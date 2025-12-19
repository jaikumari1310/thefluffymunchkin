import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Minus,
  Trash2,
  Search,
  User,
  Save,
  Printer,
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
import {
  getProducts,
  getCustomers,
  getSettings,
  initializeSettings,
  addInvoice,
  Product,
  Customer,
  Settings,
  InvoiceItem,
  formatCurrency,
  calculateGST,
} from '@/lib/db';

interface CartItem extends InvoiceItem {
  id: string;
}

export default function Billing() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'card' | 'credit'>('cash');
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [prod, cust, sett] = await Promise.all([
        getProducts(),
        getCustomers(),
        initializeSettings(),
      ]);
      setProducts(prod);
      setCustomers(cust);
      setSettings(sett);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch)
  );

  function addToCart(product: Product) {
    const existingItem = cartItems.find((item) => item.productId === product.id);
    
    if (existingItem) {
      updateQuantity(existingItem.id, existingItem.quantity + 1);
    } else {
      const gst = calculateGST(product.sellingPrice, product.gstPercent);
      const newItem: CartItem = {
        id: `cart-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        hsn: product.hsn,
        quantity: 1,
        unit: product.unit,
        rate: product.sellingPrice,
        gstPercent: product.gstPercent,
        discount: 0,
        amount: product.sellingPrice,
        cgst: gst.cgst,
        sgst: gst.sgst,
        igst: gst.igst,
      };
      setCartItems([...cartItems, newItem]);
    }
    setSearchTerm('');
  }

  function updateQuantity(itemId: string, newQuantity: number) {
    if (newQuantity < 1) {
      removeFromCart(itemId);
      return;
    }

    setCartItems(
      cartItems.map((item) => {
        if (item.id === itemId) {
          const amount = item.rate * newQuantity;
          const gst = calculateGST(amount, item.gstPercent);
          return {
            ...item,
            quantity: newQuantity,
            amount,
            cgst: gst.cgst,
            sgst: gst.sgst,
            igst: gst.igst,
          };
        }
        return item;
      })
    );
  }

  function removeFromCart(itemId: string) {
    setCartItems(cartItems.filter((item) => item.id !== itemId));
  }

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.amount, 0);
  const totalCgst = cartItems.reduce((sum, item) => sum + item.cgst * item.quantity, 0);
  const totalSgst = cartItems.reduce((sum, item) => sum + item.sgst * item.quantity, 0);
  const totalIgst = cartItems.reduce((sum, item) => sum + item.igst * item.quantity, 0);
  const totalGst = totalCgst + totalSgst + totalIgst;
  const afterDiscount = subtotal + totalGst - discount;
  const roundOff = Math.round(afterDiscount) - afterDiscount;
  const grandTotal = Math.round(afterDiscount);
  const dueAmount = grandTotal - paidAmount;

  async function handleSaveInvoice() {
    if (cartItems.length === 0) {
      toast.error('Please add items to the cart');
      return;
    }

    if (!settings) {
      toast.error('Settings not loaded');
      return;
    }

    try {
      const invoiceNumber = `${settings.invoicePrefix}-${String(settings.nextInvoiceNumber).padStart(5, '0')}`;
      
      const now = new Date();
      const receiptTime = now.toTimeString().slice(0, 8).replace(/:/g, ''); // HHMMSS format
      
      const invoice = await addInvoice({
        invoiceNumber,
        customerId: selectedCustomer?.id,
        customerName: selectedCustomer?.name || 'Walk-in Customer',
        customerPhone: selectedCustomer?.phone,
        customerGstin: selectedCustomer?.gstin,
        customerAddress: selectedCustomer?.address,
        customerStateCode: selectedCustomer?.stateCode,
        customerStateName: selectedCustomer?.stateName,
        items: cartItems.map(({ id, ...item }) => item),
        subtotal,
        totalCgst,
        totalSgst,
        totalIgst,
        totalGst,
        discount,
        roundOff,
        grandTotal,
        paidAmount: paymentMode === 'credit' ? 0 : paidAmount || grandTotal,
        dueAmount: paymentMode === 'credit' ? grandTotal : Math.max(0, grandTotal - (paidAmount || grandTotal)),
        paymentMode,
        status: paymentMode === 'credit' ? 'unpaid' : paidAmount >= grandTotal ? 'paid' : 'partial',
        invoiceDate: now,
        // POS PATROL fields
        receiptTime,
        businessDate: now,
        transactionStatus: 'SALES',
        locationCode: settings.locationCode || '01',
        terminalId: settings.terminalId || '01',
        shiftNo: settings.currentShift || '01',
      });

      toast.success(`Invoice ${invoiceNumber} created successfully!`);
      navigate('/invoices');
    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error('Failed to save invoice');
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
          <p className="text-muted-foreground">
            Invoice #{settings?.invoicePrefix}-{String(settings?.nextInvoiceNumber || 1).padStart(5, '0')}
          </p>
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
                        {product.sku && `SKU: ${product.sku} | `}Stock: {product.stock} {product.unit}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono-numbers font-medium text-foreground">
                        {formatCurrency(product.sellingPrice)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        GST: {product.gstPercent}%
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
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(item.rate)} × {item.quantity} = {formatCurrency(item.amount)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
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
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => removeFromCart(item.id)}
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
                <span className="text-muted-foreground">CGST</span>
                <span className="font-mono-numbers">{formatCurrency(totalCgst)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SGST</span>
                <span className="font-mono-numbers">{formatCurrency(totalSgst)}</span>
              </div>
              {totalIgst > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IGST</span>
                  <span className="font-mono-numbers">{formatCurrency(totalIgst)}</span>
                </div>
              )}
              
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

              {roundOff !== 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Round Off</span>
                  <span className="font-mono-numbers">
                    {roundOff > 0 ? '+' : ''}{roundOff.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="flex justify-between border-t border-border pt-2 text-lg font-bold">
                <span>Grand Total</span>
                <span className="font-mono-numbers text-primary">{formatCurrency(grandTotal)}</span>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <Label className="mb-1.5 block text-sm">Payment Mode</Label>
                <Select
                  value={paymentMode}
                  onValueChange={(v) => setPaymentMode(v as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="credit">Credit (Due)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentMode !== 'credit' && (
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
              )}
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
