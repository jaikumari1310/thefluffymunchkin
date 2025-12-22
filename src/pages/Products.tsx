
import { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/supabaseClient.ts';
import { type Database } from '@/integrations/supabase/types';

// Type alias for our product row
type Product = Database['public']['Tables']['products']['Row'];

const GST_RATES = [0, 5, 12, 18, 28];
const UNITS = ['Pcs', 'Kg', 'Ltr', 'Mtr', 'Box', 'Dz', 'Set', 'Pair'];

// Helper function to format currency
function formatCurrency(amount: number | null) {
  if (amount === null) return '-';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state still uses camelCase for easier form handling.
  // We'll map to snake_case on submission.
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    hsn: '',
    gstPercent: 18,
    purchasePrice: 0,
    sellingPrice: 0,
    stock: 0,
    unit: 'Pcs',
    lowStockAlert: 10,
  });

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProducts(data || []);
    } catch (error: any) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products', { description: error.message });
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  function resetForm() {
    setFormData({
      name: '',
      sku: '',
      hsn: '',
      gstPercent: 18,
      purchasePrice: 0,
      sellingPrice: 0,
      stock: 0,
      unit: 'Pcs',
      lowStockAlert: 10,
    });
    setEditingProduct(null);
  }

  function handleEdit(product: Product) {
    setEditingProduct(product);
    // Map snake_case from DB to camelCase for the form
    setFormData({
      name: product.name,
      sku: product.sku || '',
      hsn: product.hsn || '',
      gstPercent: product.gst_percent ?? 18,
      purchasePrice: product.purchase_price ?? 0,
      sellingPrice: product.price ?? 0, // 'price' in DB is sellingPrice
      stock: product.stock_quantity ?? 0,
      unit: product.unit ?? 'Pcs',
      lowStockAlert: product.low_stock_alert ?? 10,
    });
    setIsDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }

    // Map formData (camelCase) to DB fields (snake_case)
    const productData = {
      name: formData.name,
      sku: formData.sku || null,
      hsn: formData.hsn || null,
      gst_percent: formData.gstPercent,
      purchase_price: formData.purchasePrice,
      price: formData.sellingPrice, // sellingPrice maps to price
      stock_quantity: formData.stock,
      unit: formData.unit,
      low_stock_alert: formData.lowStockAlert,
    };

    try {
      let error;
      if (editingProduct) {
        // Update
        const { error: updateError } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);
        error = updateError;
        if (!error) toast.success('Product updated successfully');
      } else {
        // Insert
        const { error: insertError } = await supabase
          .from('products')
          .insert(productData);
        error = insertError;
        if (!error) toast.success('Product added successfully');
      }

      if (error) throw error;

      await loadProducts();
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product', { description: error.message });
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      
      toast.success('Product deleted successfully');
      await loadProducts();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product', { description: error.message });
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
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground">Manage your inventory</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Product name"
                  />
                </div>
                <div>
                  <Label htmlFor="sku">SKU Code</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                    placeholder="SKU001"
                  />
                </div>
                <div>
                  <Label htmlFor="hsn">HSN Code</Label>
                  <Input
                    id="hsn"
                    value={formData.hsn}
                    onChange={(e) => setFormData({ ...formData, hsn: e.target.value })}
                    placeholder="1234"
                  />
                </div>
                <div>
                  <Label>GST Rate</Label>
                  <Select
                    value={formData.gstPercent.toString()}
                    onValueChange={(v) => setFormData({ ...formData, gstPercent: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GST_RATES.map((rate) => (
                        <SelectItem key={rate} value={rate.toString()}>
                          {rate}%
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Unit</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(v) => setFormData({ ...formData, unit: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((unit) => (
                        <SelectItem key={unit} value={unit}>
                          {unit}
                        </SelectItem>
                      ))}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="purchasePrice">Purchase Price</Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.purchasePrice || ''}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="sellingPrice">Selling Price</Label>
                  <Input
                    id="sellingPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.sellingPrice || ''}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="stock">Current Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={formData.stock || ''}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="lowStockAlert">Low Stock Alert</Label>
                  <Input
                    id="lowStockAlert"
                    type="number"
                    min="0"
                    value={formData.lowStockAlert || ''}
                    onChange={(e) => setFormData({ ...formData, lowStockAlert: parseInt(e.target.value) || 0 })}
                    placeholder="10"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  {editingProduct ? 'Update' : 'Add'} Product
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Product List */}
      {filteredProducts.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>HSN</th>
                <th>GST</th>
                <th>Price</th>
                <th>Stock</th>
                <th className="w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      {product.sku && (
                        <p className="text-xs text-muted-foreground font-mono-numbers">
                          SKU: {product.sku}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="font-mono-numbers text-muted-foreground">
                    {product.hsn || '-'}
                  </td>
                  <td>
                    <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {product.gst_percent}%
                    </span>
                  </td>
                  <td className="font-mono-numbers">
                    {formatCurrency(product.price)}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono-numbers font-medium ${
                          (product.stock_quantity ?? 0) <= (product.low_stock_alert ?? 0)
                            ? 'text-destructive'
                            : 'text-foreground'
                        }`}
                      >
                        {product.stock_quantity} {product.unit}
                      </span>
                      {(product.stock_quantity ?? 0) <= (product.low_stock_alert ?? 0) && (
                        <AlertTriangle className="h-4 w-4 text-warning" />
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
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
            <Search className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No products found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? 'Try a different search term' : 'Add your first product to get started'}
          </p>
        </div>
      )}
    </AppLayout>
  );
}
