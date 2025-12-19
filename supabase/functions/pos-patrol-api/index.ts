import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map payment modes to mall's expected values
function mapPaymentMode(mode: string): string {
  const mapping: Record<string, string> = {
    'cash': 'CASH',
    'upi': 'OTHERS',
    'card': 'CC',
    'credit': 'CREDIT',
  };
  return mapping[mode?.toLowerCase()] || 'OTHERS';
}

// Format date to YYYYMMDD
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

// Format time to HHMMSS
function formatTime(dateStr: string, receiptTime?: string): string {
  if (receiptTime && /^\d{6}$/.test(receiptTime)) {
    return receiptTime;
  }
  const date = new Date(dateStr);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}${minutes}${seconds}`;
}

interface InvoiceItem {
  productId: string;
  productName: string;
  hsn: string;
  quantity: number;
  unit: string;
  rate: number;
  gstPercent: number;
  discount: number;
  amount: number;
  cgst: number;
  sgst: number;
  igst: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  created_at: string;
  customer_name: string;
  customer_phone: string;
  customer_gstin: string;
  items: InvoiceItem[];
  subtotal: number;
  total_cgst: number;
  total_sgst: number;
  total_igst: number;
  total_gst: number;
  grand_total: number;
  paid_amount: number;
  payment_mode: string;
  status: string;
  receipt_time: string;
  business_date: string;
  transaction_status: string;
  return_amount: number;
  location_code: string;
  terminal_id: string;
  shift_no: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const fromDate = url.searchParams.get('from_date');
    const toDate = url.searchParams.get('to_date');

    console.log(`POS Patrol API called with from_date=${fromDate}, to_date=${toDate}`);

    if (!fromDate || !toDate) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required parameters: from_date and to_date',
          usage: 'Add ?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD to the URL'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(fromDate) || !dateRegex.test(toDate)) {
      return new Response(
        JSON.stringify({ error: 'Invalid date format. Use YYYY-MM-DD' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Query invoices within date range
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('*')
      .gte('invoice_date', fromDate)
      .lte('invoice_date', toDate)
      .order('invoice_date', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch invoices', details: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Found ${invoices?.length || 0} invoices`);

    // Transform invoices to mall format
    const transactions = (invoices || []).map((inv: Invoice) => {
      const items = (inv.items || []).map((item: InvoiceItem, idx: number) => ({
        ITEM_NO: idx + 1,
        ITEM_CODE: item.productId || '',
        ITEM_NAME: item.productName || '',
        HSN_CODE: item.hsn || '',
        QUANTITY: item.quantity || 0,
        UNIT: item.unit || 'pcs',
        RATE: item.rate || 0,
        AMOUNT: item.amount || 0,
        GST_PERCENT: item.gstPercent || 0,
        CGST: item.cgst || 0,
        SGST: item.sgst || 0,
        IGST: item.igst || 0,
        DISCOUNT: item.discount || 0,
      }));

      const payments = [{
        PAYMENT_NAME: mapPaymentMode(inv.payment_mode),
        PAYMENT_AMT: inv.paid_amount || inv.grand_total || 0,
      }];

      return {
        LOCATION_CODE: inv.location_code || '01',
        TERMINAL_ID: inv.terminal_id || '01',
        SHIFT_NO: inv.shift_no || '01',
        RCPT_NUM: inv.invoice_number || '',
        RCPT_DT: formatDate(inv.invoice_date),
        BUSINESS_DT: inv.business_date ? formatDate(inv.business_date) : formatDate(inv.invoice_date),
        RCPT_TM: formatTime(inv.created_at, inv.receipt_time),
        INV_AMT: inv.grand_total || 0,
        TAX_AMT: inv.total_gst || 0,
        RET_AMT: inv.return_amount || 0,
        TRAN_STATUS: inv.transaction_status || 'SALES',
        CUSTOMER_NAME: inv.customer_name || 'Walk-in',
        CUSTOMER_PHONE: inv.customer_phone || '',
        CUSTOMER_GSTIN: inv.customer_gstin || '',
        items,
        payments,
      };
    });

    // Calculate summary
    const summary = {
      total_transactions: transactions.length,
      total_sales: transactions.filter(t => t.TRAN_STATUS === 'SALES').length,
      total_returns: transactions.filter(t => t.TRAN_STATUS === 'RETURN').length,
      total_amount: transactions.reduce((sum, t) => sum + (t.TRAN_STATUS === 'SALES' ? t.INV_AMT : -t.INV_AMT), 0),
      total_tax: transactions.reduce((sum, t) => sum + (t.TRAN_STATUS === 'SALES' ? t.TAX_AMT : -t.TAX_AMT), 0),
      from_date: fromDate,
      to_date: toDate,
      generated_at: new Date().toISOString(),
    };

    const response = {
      success: true,
      summary,
      transactions,
    };

    console.log(`Returning ${transactions.length} transactions`);

    return new Response(
      JSON.stringify(response, null, 2),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (err) {
    const error = err as Error;
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
