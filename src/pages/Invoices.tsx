import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, Printer, Send, FileText, RotateCcw, ArrowLeftRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/supabaseClient.ts';
import { type Database } from '@/integrations/supabase/types';
import { format } from 'date-fns';

// Type alias for Supabase invoice data
type Invoice = Database['public']['Tables']['invoices']['Row'] & {
  customers: { name: string } | null;
};
type InvoiceItem = Database['public']['Tables']['invoice_items']['Row'];

function formatCurrency(amount: number | null) {
  if (amount === null) return '-';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
}

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedInvoiceItems, setSelectedInvoiceItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, customers(name)') // Fetch customer name via relationship
        .order('invoice_date', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error: any) {
      console.error('Error loading invoices:', error);
      toast.error('Failed to load invoices', { description: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function fetchInvoiceDetails(invoiceId: number) {
    try {
      const { data, error } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId);
      
      if (error) throw error;
      setSelectedInvoiceItems(data || []);

    } catch (error: any) {
      console.error('Error fetching invoice details:', error);
      toast.error('Failed to load invoice details', { description: error.message });
    }
  }

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.customers?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  function handlePrint(invoice: Invoice) {
    // Print functionality will be simplified for now. 
    // A more robust solution can be built later.
    toast.info("Print functionality is under development.");
  }

  function handleWhatsApp(invoice: Invoice) {
    const text = `Invoice ${invoice.invoice_number}\nTotal: ${formatCurrency(invoice.grand_total)}\nThank you!`;
    const phone = invoice.customer_phone?.replace(/\D/g, '');
    const url = phone
      ? `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }
  
  function handleViewInvoice(invoice: Invoice) {
    setSelectedInvoice(invoice);
    fetchInvoiceDetails(invoice.id);
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground">View and manage all invoices</p>
        </div>
        <Link to="/billing">
          <Button className="gap-2">
            <FileText className="h-4 w-4" />
            New Invoice
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by invoice number or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Invoice List */}
      {filteredInvoices.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Type</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th className="w-40">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="font-medium font-mono-numbers">
                    {invoice.invoice_number}
                  </td>
                  <td>
                    <Badge
                      variant={invoice.transaction_status === 'RETURN' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {invoice.transaction_status === 'RETURN' ? (
                        <><RotateCcw className="h-3 w-3 mr-1" /> Return</>
                      ) : (
                        'Sale'
                      )}
                    </Badge>
                  </td>
                  <td className="text-muted-foreground">
                    {format(new Date(invoice.invoice_date), 'dd MMM yyyy')}
                  </td>
                  <td>{invoice.customers?.name || 'Walk-in'}</td>
                  <td className="font-mono-numbers font-medium">
                    {invoice.transaction_status === 'RETURN' ? '-' : ''}{formatCurrency(invoice.grand_total)}
                  </td>
                  <td>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        invoice.status === 'paid'
                          ? 'bg-success/10 text-success'
                          : 'bg-destructive/10 text-destructive' // Simplified from 'partial'
                      }`}
                    >
                      {invoice.status ? invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1) : 'Draft'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleViewInvoice(invoice)}
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handlePrint(invoice)}
                        title="Print"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-success hover:text-success"
                        onClick={() => handleWhatsApp(invoice)}
                        title="Share via WhatsApp"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                      {invoice.transaction_status !== 'RETURN' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => toast.info('Return functionality is under development.')}
                          title="Create Return"
                        >
                          <ArrowLeftRight className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <FileText className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No invoices found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? 'Try a different search term' : 'Create your first invoice to get started'}
          </p>
          <Link to="/billing" className="mt-4">
            <Button>Create Invoice</Button>
          </Link>
        </div>
      )}

      {/* Invoice Preview Dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice {selectedInvoice?.invoice_number}</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div id="invoice-print-content" className="space-y-6">
              <div className="text-center border-b border-border pb-4">
                <h2 className="text-xl font-bold text-foreground">Your Shop Name</h2>
                {/* Shop details will be added back later */}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Bill To:</p>
                  <p className="font-medium text-foreground">{selectedInvoice.customer_name}</p>
                  {selectedInvoice.customer_phone && <p>{selectedInvoice.customer_phone}</p>}
                  {selectedInvoice.customer_gstin && (
                    <p className="font-mono-numbers">GSTIN: {selectedInvoice.customer_gstin}</p>
                  )}
                </div>
                <div className="text-right">
                  <p>
                    <span className="text-muted-foreground">Invoice No:</span>{' '}
                    <span className="font-mono-numbers font-medium">{selectedInvoice.invoice_number}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Date:</span>{' '}
                    {format(new Date(selectedInvoice.invoice_date), 'dd MMM yyyy')}
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="p-2 text-left">Item</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Rate</th>
                      <th className="p-2 text-center">GST%</th>
                      <th className="p-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoiceItems.map((item, idx) => (
                      <tr key={idx} className="border-t border-border">
                        <td className="p-2">{item.product_name}</td>
                        <td className="p-2 text-center font-mono-numbers">
                          {item.quantity}
                        </td>
                        <td className="p-2 text-right font-mono-numbers">
                          {formatCurrency(item.rate)}
                        </td>
                        <td className="p-2 text-center font-mono-numbers">
                           {/* GST percent needs to be fetched or calculated */}
                        </td>
                        <td className="p-2 text-right font-mono-numbers">
                          {formatCurrency(item.total_price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <div className="w-64 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                     <span className="font-mono-numbers">{formatCurrency(selectedInvoice.grand_total - (selectedInvoice.total_gst ?? 0))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GST</span>
                    <span className="font-mono-numbers">{formatCurrency(selectedInvoice.total_gst)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                    <span>Grand Total</span>
                    <span className="font-mono-numbers">{formatCurrency(selectedInvoice.grand_total)}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4 text-center text-xs text-muted-foreground">
                <p>Thank you for your business!</p>
              </div>
            </div>
          )}
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => selectedInvoice && handlePrint(selectedInvoice)}
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={() => selectedInvoice && handleWhatsApp(selectedInvoice)}
            >
              <Send className="h-4 w-4" />
              Share on WhatsApp
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
