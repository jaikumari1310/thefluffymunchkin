import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  IndianRupee,
  TrendingUp,
  Users,
  Package,
  FileText,
  ArrowRight,
  AlertTriangle,
  Receipt,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/ui/stat-card';
import { Button } from '@/components/ui/button';
import { getInvoices, getCustomers, getProducts, formatCurrency, Invoice, Customer, Product } from '@/lib/db';

export default function Dashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [inv, cust, prod] = await Promise.all([
          getInvoices(),
          getCustomers(),
          getProducts(),
        ]);
        setInvoices(inv);
        setCustomers(cust);
        setProducts(prod);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Calculate stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysSales = invoices
    .filter((inv) => new Date(inv.invoiceDate) >= today)
    .reduce((sum, inv) => sum + inv.grandTotal, 0);

  const totalSales = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalReceivables = invoices.reduce((sum, inv) => sum + inv.dueAmount, 0);
  const lowStockProducts = products.filter((p) => p.stock <= p.lowStockAlert);

  const recentInvoices = invoices.slice(0, 5);

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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your business overview.</p>
        </div>
        <Link to="/billing">
          <Button className="gap-2">
            <Receipt className="h-4 w-4" />
            Create Bill
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Sales"
          value={formatCurrency(todaysSales)}
          subtitle={`${invoices.filter((inv) => new Date(inv.invoiceDate) >= today).length} invoices`}
          icon={IndianRupee}
          variant="primary"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(totalSales)}
          subtitle={`${invoices.length} total invoices`}
          icon={TrendingUp}
          variant="success"
        />
        <StatCard
          title="Receivables"
          value={formatCurrency(totalReceivables)}
          subtitle="Outstanding amount"
          icon={FileText}
          variant="warning"
        />
        <StatCard
          title="Products"
          value={products.length}
          subtitle={`${lowStockProducts.length} low stock`}
          icon={Package}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Invoices */}
        <div className="lg:col-span-2">
          <div className="stat-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Recent Invoices</h2>
              <Link to="/invoices" className="text-sm font-medium text-primary hover:underline">
                View All
              </Link>
            </div>
            {recentInvoices.length > 0 ? (
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentInvoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td className="font-medium font-mono-numbers">{invoice.invoiceNumber}</td>
                        <td>{invoice.customerName || 'Walk-in Customer'}</td>
                        <td className="font-mono-numbers">{formatCurrency(invoice.grandTotal)}</td>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="mb-4 h-12 w-12 text-muted-foreground/30" />
                <p className="text-muted-foreground">No invoices yet</p>
                <Link to="/billing" className="mt-2 text-sm text-primary hover:underline">
                  Create your first invoice
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions & Alerts */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="stat-card">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Quick Actions</h2>
            <div className="space-y-2">
              <Link to="/billing">
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Create New Bill
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/customers">
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Add Customer
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/products">
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Add Product
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Low Stock Alert */}
          {lowStockProducts.length > 0 && (
            <div className="stat-card border-warning/30 bg-warning/5">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <h2 className="font-semibold text-foreground">Low Stock Alert</h2>
              </div>
              <ul className="space-y-2">
                {lowStockProducts.slice(0, 5).map((product) => (
                  <li
                    key={product.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-foreground">{product.name}</span>
                    <span className="font-mono-numbers font-medium text-warning">
                      {product.stock} left
                    </span>
                  </li>
                ))}
              </ul>
              {lowStockProducts.length > 5 && (
                <Link
                  to="/products"
                  className="mt-3 block text-center text-sm text-primary hover:underline"
                >
                  View all ({lowStockProducts.length})
                </Link>
              )}
            </div>
          )}

          {/* Stats Summary */}
          <div className="stat-card">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Summary</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Customers</span>
                <span className="font-semibold text-foreground">{customers.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Products</span>
                <span className="font-semibold text-foreground">{products.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Invoices</span>
                <span className="font-semibold text-foreground">{invoices.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
