import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, TrendingUp, TrendingDown, IndianRupee, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { getInvoices, getProducts, Invoice, Product, formatCurrency } from '@/lib/db';
import { format, startOfDay, startOfWeek, startOfMonth, startOfYear, isAfter } from 'date-fns';

type Period = 'today' | 'week' | 'month' | 'year' | 'all';

export default function Reports() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [period, setPeriod] = useState<Period>('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [inv, prod] = await Promise.all([getInvoices(), getProducts()]);
      setInvoices(inv);
      setProducts(prod);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  function getStartDate(p: Period): Date | null {
    const now = new Date();
    switch (p) {
      case 'today':
        return startOfDay(now);
      case 'week':
        return startOfWeek(now, { weekStartsOn: 1 });
      case 'month':
        return startOfMonth(now);
      case 'year':
        return startOfYear(now);
      case 'all':
        return null;
    }
  }

  const startDate = getStartDate(period);
  const filteredInvoices = startDate
    ? invoices.filter((inv) => isAfter(new Date(inv.invoiceDate), startDate))
    : invoices;

  // Calculate metrics
  const totalSales = filteredInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalReceived = filteredInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const totalDue = filteredInvoices.reduce((sum, inv) => sum + inv.dueAmount, 0);
  const totalGst = filteredInvoices.reduce((sum, inv) => sum + inv.totalGst, 0);
  const invoiceCount = filteredInvoices.length;
  const avgInvoiceValue = invoiceCount > 0 ? totalSales / invoiceCount : 0;

  // GST Summary
  const cgstTotal = filteredInvoices.reduce((sum, inv) => sum + inv.totalCgst, 0);
  const sgstTotal = filteredInvoices.reduce((sum, inv) => sum + inv.totalSgst, 0);
  const igstTotal = filteredInvoices.reduce((sum, inv) => sum + inv.totalIgst, 0);

  // Product-wise sales
  const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
  filteredInvoices.forEach((inv) => {
    inv.items.forEach((item) => {
      if (!productSales[item.productId]) {
        productSales[item.productId] = { name: item.productName, quantity: 0, revenue: 0 };
      }
      productSales[item.productId].quantity += item.quantity;
      productSales[item.productId].revenue += item.amount;
    });
  });
  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  function exportToCSV() {
    const headers = ['Invoice No', 'Date', 'Customer', 'Subtotal', 'GST', 'Total', 'Paid', 'Due', 'Status'];
    const rows = filteredInvoices.map((inv) => [
      inv.invoiceNumber,
      format(new Date(inv.invoiceDate), 'dd-MM-yyyy'),
      inv.customerName,
      inv.subtotal,
      inv.totalGst,
      inv.grandTotal,
      inv.paidAmount,
      inv.dueAmount,
      inv.status,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported successfully');
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
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground">Business analytics and insights</p>
        </div>
        <div className="flex gap-3">
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2" onClick={exportToCSV}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Sales"
          value={formatCurrency(totalSales)}
          subtitle={`${invoiceCount} invoices`}
          icon={IndianRupee}
          variant="primary"
        />
        <StatCard
          title="Amount Received"
          value={formatCurrency(totalReceived)}
          icon={TrendingUp}
          variant="success"
        />
        <StatCard
          title="Amount Due"
          value={formatCurrency(totalDue)}
          icon={TrendingDown}
          variant="warning"
        />
        <StatCard
          title="Total GST"
          value={formatCurrency(totalGst)}
          icon={FileText}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* GST Summary */}
        <div className="stat-card">
          <h2 className="mb-4 text-lg font-semibold text-foreground">GST Summary</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <span className="text-muted-foreground">CGST Collected</span>
              <span className="font-mono-numbers font-semibold text-foreground">
                {formatCurrency(cgstTotal)}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
              <span className="text-muted-foreground">SGST Collected</span>
              <span className="font-mono-numbers font-semibold text-foreground">
                {formatCurrency(sgstTotal)}
              </span>
            </div>
            {igstTotal > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                <span className="text-muted-foreground">IGST Collected</span>
                <span className="font-mono-numbers font-semibold text-foreground">
                  {formatCurrency(igstTotal)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className="font-medium text-foreground">Total GST</span>
              <span className="font-mono-numbers text-lg font-bold text-primary">
                {formatCurrency(totalGst)}
              </span>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="stat-card">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Top Selling Products</h2>
          {topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((product, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.quantity} units sold
                      </p>
                    </div>
                  </div>
                  <span className="font-mono-numbers font-semibold text-foreground">
                    {formatCurrency(product.revenue)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-muted-foreground">No sales data available</p>
          )}
        </div>

        {/* Quick Stats */}
        <div className="stat-card lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Quick Stats</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border p-4 text-center">
              <p className="text-2xl font-bold font-mono-numbers text-foreground">
                {invoiceCount}
              </p>
              <p className="text-sm text-muted-foreground">Total Invoices</p>
            </div>
            <div className="rounded-lg border border-border p-4 text-center">
              <p className="text-2xl font-bold font-mono-numbers text-foreground">
                {formatCurrency(avgInvoiceValue)}
              </p>
              <p className="text-sm text-muted-foreground">Avg. Invoice Value</p>
            </div>
            <div className="rounded-lg border border-border p-4 text-center">
              <p className="text-2xl font-bold font-mono-numbers text-foreground">
                {products.filter((p) => p.stock <= p.lowStockAlert).length}
              </p>
              <p className="text-sm text-muted-foreground">Low Stock Items</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
