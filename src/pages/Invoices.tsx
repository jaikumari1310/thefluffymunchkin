import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, Printer, Send, FileText } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { getInvoices, getSettings, Invoice, Settings, formatCurrency } from '@/lib/db';
import { format } from 'date-fns';

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [inv, sett] = await Promise.all([getInvoices(), getSettings()]);
      setInvoices(inv);
      setSettings(sett || null);
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function handlePrint(invoice: Invoice) {
    const printContent = document.getElementById('invoice-print-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Invoice ${invoice.invoiceNumber}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background: #f5f5f5; }
                .header { text-align: center; margin-bottom: 20px; }
                .details { display: flex; justify-content: space-between; margin-bottom: 20px; }
                .totals { margin-top: 20px; text-align: right; }
                .total-row { display: flex; justify-content: flex-end; gap: 40px; margin: 5px 0; }
                .grand-total { font-size: 18px; font-weight: bold; margin-top: 10px; }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  }

  function handleWhatsApp(invoice: Invoice) {
    const text = `Invoice ${invoice.invoiceNumber}\nTotal: ${formatCurrency(invoice.grandTotal)}\nThank you for your business!`;
    const phone = invoice.customerPhone?.replace(/\D/g, '');
    const url = phone
      ? `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
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
                <th>Date</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th className="w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="font-medium font-mono-numbers">
                    {invoice.invoiceNumber}
                  </td>
                  <td className="text-muted-foreground">
                    {format(new Date(invoice.invoiceDate), 'dd MMM yyyy')}
                  </td>
                  <td>{invoice.customerName}</td>
                  <td className="font-mono-numbers font-medium">
                    {formatCurrency(invoice.grandTotal)}
                  </td>
                  <td>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        invoice.status === 'paid'
                          ? 'bg-success/10 text-success'
                          : invoice.status === 'partial'
                          ? 'bg-warning/10 text-warning'
                          : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setSelectedInvoice(invoice)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setSelectedInvoice(invoice);
                          setTimeout(() => handlePrint(invoice), 100);
                        }}
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-success hover:text-success"
                        onClick={() => handleWhatsApp(invoice)}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
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
            <DialogTitle>Invoice {selectedInvoice?.invoiceNumber}</DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div id="invoice-print-content" className="space-y-6">
              {/* Shop Header */}
              <div className="text-center border-b border-border pb-4">
                <h2 className="text-xl font-bold text-foreground">
                  {settings?.shopName || 'My Shop'}
                </h2>
                {settings?.shopAddress && (
                  <p className="text-sm text-muted-foreground">{settings.shopAddress}</p>
                )}
                {settings?.shopPhone && (
                  <p className="text-sm text-muted-foreground">Phone: {settings.shopPhone}</p>
                )}
                {settings?.shopGstin && (
                  <p className="text-sm font-mono-numbers text-muted-foreground">
                    GSTIN: {settings.shopGstin}
                  </p>
                )}
              </div>

              {/* Invoice Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Bill To:</p>
                  <p className="font-medium text-foreground">{selectedInvoice.customerName}</p>
                  {selectedInvoice.customerPhone && <p>{selectedInvoice.customerPhone}</p>}
                  {selectedInvoice.customerGstin && (
                    <p className="font-mono-numbers">GSTIN: {selectedInvoice.customerGstin}</p>
                  )}
                  {selectedInvoice.customerAddress && <p>{selectedInvoice.customerAddress}</p>}
                </div>
                <div className="text-right">
                  <p>
                    <span className="text-muted-foreground">Invoice No:</span>{' '}
                    <span className="font-mono-numbers font-medium">{selectedInvoice.invoiceNumber}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Date:</span>{' '}
                    {format(new Date(selectedInvoice.invoiceDate), 'dd MMM yyyy')}
                  </p>
                  {selectedInvoice.dueDate && (
                    <p>
                      <span className="text-muted-foreground">Due Date:</span>{' '}
                      {format(new Date(selectedInvoice.dueDate), 'dd MMM yyyy')}
                    </p>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="p-2 text-left">Item</th>
                      <th className="p-2 text-center">HSN</th>
                      <th className="p-2 text-center">Qty</th>
                      <th className="p-2 text-right">Rate</th>
                      <th className="p-2 text-center">GST%</th>
                      <th className="p-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items.map((item, idx) => (
                      <tr key={idx} className="border-t border-border">
                        <td className="p-2">{item.productName}</td>
                        <td className="p-2 text-center font-mono-numbers">{item.hsn || '-'}</td>
                        <td className="p-2 text-center font-mono-numbers">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="p-2 text-right font-mono-numbers">
                          {formatCurrency(item.rate)}
                        </td>
                        <td className="p-2 text-center font-mono-numbers">{item.gstPercent}%</td>
                        <td className="p-2 text-right font-mono-numbers">
                          {formatCurrency(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-mono-numbers">{formatCurrency(selectedInvoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CGST</span>
                    <span className="font-mono-numbers">{formatCurrency(selectedInvoice.totalCgst)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SGST</span>
                    <span className="font-mono-numbers">{formatCurrency(selectedInvoice.totalSgst)}</span>
                  </div>
                  {selectedInvoice.totalIgst > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IGST</span>
                      <span className="font-mono-numbers">{formatCurrency(selectedInvoice.totalIgst)}</span>
                    </div>
                  )}
                  {selectedInvoice.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="font-mono-numbers">-{formatCurrency(selectedInvoice.discount)}</span>
                    </div>
                  )}
                  {selectedInvoice.roundOff !== 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Round Off</span>
                      <span className="font-mono-numbers">
                        {selectedInvoice.roundOff > 0 ? '+' : ''}{selectedInvoice.roundOff.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                    <span>Grand Total</span>
                    <span className="font-mono-numbers">{formatCurrency(selectedInvoice.grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-border pt-4 text-center text-xs text-muted-foreground">
                <p>Thank you for your business!</p>
                {settings?.termsAndConditions && <p className="mt-2">{settings.termsAndConditions}</p>}
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
