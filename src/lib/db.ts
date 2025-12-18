// IndexedDB Database for offline-first billing
import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  gstin?: string;
  address?: string;
  email?: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  hsn: string;
  gstPercent: number;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  unit: string;
  lowStockAlert: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
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

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerGstin?: string;
  customerAddress?: string;
  items: InvoiceItem[];
  subtotal: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalGst: number;
  discount: number;
  roundOff: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentMode: 'cash' | 'upi' | 'card' | 'credit';
  status: 'paid' | 'partial' | 'unpaid';
  notes?: string;
  invoiceDate: Date;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentMode: 'cash' | 'upi' | 'card';
  paymentDate: Date;
  notes?: string;
  createdAt: Date;
}

export interface Settings {
  id: string;
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  shopEmail?: string;
  shopGstin?: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  stateCode: string;
  stateName: string;
  logoUrl?: string;
  bankName?: string;
  bankAccount?: string;
  bankIfsc?: string;
  upiId?: string;
  termsAndConditions?: string;
}

interface BillingDB extends DBSchema {
  customers: {
    key: string;
    value: Customer;
    indexes: { 'by-phone': string; 'by-name': string };
  };
  products: {
    key: string;
    value: Product;
    indexes: { 'by-sku': string; 'by-name': string };
  };
  invoices: {
    key: string;
    value: Invoice;
    indexes: { 'by-number': string; 'by-date': Date; 'by-customer': string };
  };
  payments: {
    key: string;
    value: Payment;
    indexes: { 'by-invoice': string; 'by-date': Date };
  };
  settings: {
    key: string;
    value: Settings;
  };
}

let dbInstance: IDBPDatabase<BillingDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<BillingDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<BillingDB>('gst-billing-db', 1, {
    upgrade(db) {
      // Customers store
      const customerStore = db.createObjectStore('customers', { keyPath: 'id' });
      customerStore.createIndex('by-phone', 'phone');
      customerStore.createIndex('by-name', 'name');

      // Products store
      const productStore = db.createObjectStore('products', { keyPath: 'id' });
      productStore.createIndex('by-sku', 'sku');
      productStore.createIndex('by-name', 'name');

      // Invoices store
      const invoiceStore = db.createObjectStore('invoices', { keyPath: 'id' });
      invoiceStore.createIndex('by-number', 'invoiceNumber');
      invoiceStore.createIndex('by-date', 'invoiceDate');
      invoiceStore.createIndex('by-customer', 'customerId');

      // Payments store
      const paymentStore = db.createObjectStore('payments', { keyPath: 'id' });
      paymentStore.createIndex('by-invoice', 'invoiceId');
      paymentStore.createIndex('by-date', 'paymentDate');

      // Settings store
      db.createObjectStore('settings', { keyPath: 'id' });
    },
  });

  return dbInstance;
}

// Helper to generate unique IDs
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Customer operations
export async function getCustomers(): Promise<Customer[]> {
  const db = await getDB();
  return db.getAll('customers');
}

export async function getCustomer(id: string): Promise<Customer | undefined> {
  const db = await getDB();
  return db.get('customers', id);
}

export async function addCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
  const db = await getDB();
  const newCustomer: Customer = {
    ...customer,
    id: generateId(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db.add('customers', newCustomer);
  return newCustomer;
}

export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<void> {
  const db = await getDB();
  const customer = await db.get('customers', id);
  if (customer) {
    await db.put('customers', { ...customer, ...updates, updatedAt: new Date() });
  }
}

export async function deleteCustomer(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('customers', id);
}

// Product operations
export async function getProducts(): Promise<Product[]> {
  const db = await getDB();
  return db.getAll('products');
}

export async function getProduct(id: string): Promise<Product | undefined> {
  const db = await getDB();
  return db.get('products', id);
}

export async function addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
  const db = await getDB();
  const newProduct: Product = {
    ...product,
    id: generateId(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db.add('products', newProduct);
  return newProduct;
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  const db = await getDB();
  const product = await db.get('products', id);
  if (product) {
    await db.put('products', { ...product, ...updates, updatedAt: new Date() });
  }
}

export async function deleteProduct(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('products', id);
}

export async function updateProductStock(id: string, quantityChange: number): Promise<void> {
  const db = await getDB();
  const product = await db.get('products', id);
  if (product) {
    await db.put('products', {
      ...product,
      stock: Math.max(0, product.stock + quantityChange),
      updatedAt: new Date(),
    });
  }
}

// Invoice operations
export async function getInvoices(): Promise<Invoice[]> {
  const db = await getDB();
  const invoices = await db.getAll('invoices');
  return invoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getInvoice(id: string): Promise<Invoice | undefined> {
  const db = await getDB();
  return db.get('invoices', id);
}

export async function addInvoice(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
  const db = await getDB();
  const newInvoice: Invoice = {
    ...invoice,
    id: generateId(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db.add('invoices', newInvoice);
  
  // Update stock for each item
  for (const item of invoice.items) {
    await updateProductStock(item.productId, -item.quantity);
  }
  
  // Update next invoice number in settings
  const settings = await getSettings();
  if (settings) {
    await updateSettings({ nextInvoiceNumber: settings.nextInvoiceNumber + 1 });
  }
  
  return newInvoice;
}

export async function updateInvoice(id: string, updates: Partial<Invoice>): Promise<void> {
  const db = await getDB();
  const invoice = await db.get('invoices', id);
  if (invoice) {
    await db.put('invoices', { ...invoice, ...updates, updatedAt: new Date() });
  }
}

// Payment operations
export async function getPayments(invoiceId?: string): Promise<Payment[]> {
  const db = await getDB();
  if (invoiceId) {
    return db.getAllFromIndex('payments', 'by-invoice', invoiceId);
  }
  return db.getAll('payments');
}

export async function addPayment(payment: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> {
  const db = await getDB();
  const newPayment: Payment = {
    ...payment,
    id: generateId(),
    createdAt: new Date(),
  };
  await db.add('payments', newPayment);
  
  // Update invoice paid amount
  const invoice = await getInvoice(payment.invoiceId);
  if (invoice) {
    const newPaidAmount = invoice.paidAmount + payment.amount;
    const newDueAmount = invoice.grandTotal - newPaidAmount;
    await updateInvoice(payment.invoiceId, {
      paidAmount: newPaidAmount,
      dueAmount: newDueAmount,
      status: newDueAmount <= 0 ? 'paid' : newPaidAmount > 0 ? 'partial' : 'unpaid',
    });
  }
  
  return newPayment;
}

// Settings operations
export async function getSettings(): Promise<Settings | undefined> {
  const db = await getDB();
  return db.get('settings', 'main');
}

export async function updateSettings(updates: Partial<Settings>): Promise<void> {
  const db = await getDB();
  const settings = await db.get('settings', 'main');
  if (settings) {
    await db.put('settings', { ...settings, ...updates });
  } else {
    await db.add('settings', {
      id: 'main',
      shopName: 'My Shop',
      shopAddress: '',
      shopPhone: '',
      invoicePrefix: 'INV',
      nextInvoiceNumber: 1,
      stateCode: '27',
      stateName: 'Maharashtra',
      ...updates,
    } as Settings);
  }
}

export async function initializeSettings(): Promise<Settings> {
  const db = await getDB();
  let settings = await db.get('settings', 'main');
  
  if (!settings) {
    settings = {
      id: 'main',
      shopName: 'My Shop',
      shopAddress: '',
      shopPhone: '',
      invoicePrefix: 'INV',
      nextInvoiceNumber: 1,
      stateCode: '27',
      stateName: 'Maharashtra',
    };
    await db.add('settings', settings);
  }
  
  return settings;
}

// GST Calculation helpers
export function calculateGST(amount: number, gstPercent: number, isInterState: boolean = false): {
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
} {
  const gstAmount = (amount * gstPercent) / 100;
  
  if (isInterState) {
    return {
      cgst: 0,
      sgst: 0,
      igst: gstAmount,
      total: gstAmount,
    };
  }
  
  const halfGst = gstAmount / 2;
  return {
    cgst: halfGst,
    sgst: halfGst,
    igst: 0,
    total: gstAmount,
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}
