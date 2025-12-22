import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Minus,
  Trash2,
  Search,
  User,
  Save,
  X,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client.ts';
import { type Database } from '@/integrations/supabase/types';

type Product = Database['public']['Tables']['products']['Row'];
type Customer = Database['public']['Tables']['customers']['Row'];
type InvoiceItemInsert = Database['public']['Tables']['invoice_items']['Insert'];

interface CartItem extends InvoiceItemInsert {
  cart_id: string; 
}

function formatCurrency(amount: number | null) {
  if (amount === null) return '-';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
}

export default function Billing() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [paymentMode, setPaymentMode] = useState('cash');
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [productsRes, customersRes] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('customers').select('*'),
      ]);

      if (productsRes.error) throw productsRes.error;
      if (customersRes.error) throw customersRes.error;

      setProducts(productsRes.data || []);
      setCustomers(customersRes.data || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error('Failed to load initial data', { description: error.message });
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      (c.phone && c.phone.includes(customerSearch))
  );

  function addToCart(product: Product) {
    const existingItem = cartItems.find((item) => item.product_id === product.id);
    
    if (existingItem) {
      updateQuantity(existingItem.cart_id, (existingItem.quantity ?? 0) + 1);
    } else {
      const newItem: CartItem = {
        cart_id: `cart-${Date.now()}`,
        product_id: product.id,
        product_name: product.name,
        hsn: product.hsn,
        quantity: 1,
        unit: product.unit,
        rate: product.price ?? 0,
        gst_percent: product.gst_percent,
        discount_amount: 0,
        total_price: product.price ?? 0,
        gst_amount: ((product.price ?? 0) * (product.gst_percent ?? 0)) / 100,
      };
      setCartItems([...cartItems, newItem]);
    }
    setSearchTerm('');
  }

  function updateQuantity(cartId: string, newQuantity: number) {
    if (newQuantity < 1) {
      removeFromCart(cartId);
      return;
    }

    setCartItems(
      cartItems.map((item) => {
        if (item.cart_id === cartId) {
          const rate = item.rate ?? 0;
          const gstPercent = item.gst_percent ?? 0;
          const totalPrice = rate * newQuantity;
          const gstAmount = (totalPrice * gstPercent) / 100;
          return {
            ...item,
            quantity: newQuantity,
            total_price: totalPrice,
            gst_amount: gstAmount,
          };
        }
        return item;
      })
    );
  }

  function removeFromCart(cartId: string) {
    setCartItems(cartItems.filter((item) => item.cart_id !== cartId));
  }

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.total_price ?? 0), 0);
  const totalGst = cartItems.reduce((sum, item) => sum + (item.gst_amount ?? 0), 0);
  const grandTotal = Math.round(subtotal + totalGst - discount);

  async function handleSaveInvoice() {
    if (cartItems.length === 0) {
      toast.error('Please add items to the cart');
      return;
    }

    try {
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`; // Simplified invoice number

      const invoiceData = {
        invoice_number: invoiceNumber,
        customer_id: selectedCustomer?.id,
        customer_name: selectedCustomer?.name || 'Walk-in Customer',
        customer_phone: selectedCustomer?.phone,
        customer_gstin: selectedCustomer?.gstin,
        total_gst: totalGst,
        grand_total: grandTotal,
        status: paidAmount >= grandTotal ? 'paid' : 'draft',
        invoice_date: new Date().toISOString(),
      };

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select('id')
        .single();

      if (invoiceError) throw invoiceError;

      const invoiceItemsData = cartItems.map(item => {
        const { cart_id, ...rest } = item;
        return { ...rest, invoice_id: invoice.id };
      });

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItemsData);

      if (itemsError) throw itemsError;

      toast.success(`Invoice ${invoiceNumber} created successfully!`);
      navigate('/invoices');
    } catch (error: any) {
      console.error('Error saving invoice:', error);
      toast.error('Failed to save invoice', { description: error.message });
    }
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
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">New Bill</h1>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Product Search & Selection */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer Selection */}
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium text-foreground">
                    {selectedCustomer?.name || 'Walk-in Customer'}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomerDialog(true)}
              >
                {selectedCustomer ? 'Change' : 'Select'} Customer
              </Button>
            </div>
          </div>

          {/* Product Search */}
          <div className="stat-card">
            <Label className="mb-2 block">Add Products</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {searchTerm && filteredProducts.length > 0 && (
              <div className="mt-2 max-h-60 overflow-y-auto rounded-lg border border-border">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="flex w-full items-center justify-between p-3 text-left hover:bg-muted transition-colors border-b border-border last:border-0"
                  >
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.sku && `SKU: ${product.sku} | `}Stock: {product.stock_quantity} {product.unit}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono-numbers font-medium text-foreground">
                        {formatCurrency(product.price)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        GST: {product.gst_percent}%
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart Items */}
          <div className="stat-card">
            <h3 className="mb-4 font-semibold text-foreground">Cart Items</h3>
            {cartItems.length > 0 ? (
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div
                    key={item.cart_id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(item.rate)} × {item.quantity} = {formatCurrency(item.total_price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.cart_id, (item.quantity ?? 0) - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-mono-numbers font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.cart_id, (item.quantity ?? 0) + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => removeFromCart(item.cart_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <p>No items in cart</p>
                <p className="text-sm">Search and add products above</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Bill Summary */}
        <div className="space-y-4">
          <div className="stat-card sticky top-6">
            <h3 className="mb-4 font-semibold text-foreground">Bill Summary</h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono-numbers">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">GST</span>
                <span className="font-mono-numbers">{formatCurrency(totalGst)}</span>
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <span className="text-muted-foreground">Discount</span>
                <Input
                  type="number"
                  min="0"
                  value={discount || ''}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="h-8 w-24 text-right font-mono-numbers"
                  placeholder="0"
                />
              </div>

              <div className="flex justify-between border-t border-border pt-2 text-lg font-bold">
                <span>Grand Total</span>
                <span className="font-mono-numbers text-primary">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            <div className="mt-4 space-y-3">
                <div>
                  <Label className="mb-1.5 block text-sm">Amount Received</Label>
                  <Input
                    type="number"
                    min="0"
                    value={paidAmount || ''}
                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                    placeholder={grandTotal.toString()}
                    className="font-mono-numbers"
                  />
                  {paidAmount > 0 && paidAmount > grandTotal && (
                    <p className="mt-1 text-sm text-success">
                      Return: {formatCurrency(paidAmount - grandTotal)}
                    </p>
                  )}
                </div>
            </div>

            <div className="mt-6 flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => {
                  setCartItems([]);
                  setSelectedCustomer(null);
                  setDiscount(0);
                  setPaidAmount(0);
                }}
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={handleSaveInvoice}
                disabled={cartItems.length === 0}
              >
                <Save className="h-4 w-4" />
                Save Bill
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Selection Dialog */}
      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or phone..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2">
              <button
                onClick={() => {
                  setSelectedCustomer(null);
                  setShowCustomerDialog(false);
                }}
                className="w-full rounded-lg border border-border p-3 text-left hover:bg-muted transition-colors"
              >
                <p className="font-medium text-foreground">Walk-in Customer</p>
                <p className="text-xs text-muted-foreground">No customer details</p>
              </button>
              {filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setShowCustomerDialog(false);
                  }}
                  className="w-full rounded-lg border border-border p-3 text-left hover:bg-muted transition-colors"
                >
                  <p className="font-medium text-foreground">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {customer.phone}{customer.gstin && ` | GSTIN: ${customer.gstin}`}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
