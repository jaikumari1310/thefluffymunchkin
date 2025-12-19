-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  gstin TEXT,
  state_name TEXT,
  state_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  hsn_code TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  gst_percent NUMERIC NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'pcs',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create settings table with POS PATROL fields
CREATE TABLE public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_name TEXT DEFAULT '',
  shop_address TEXT DEFAULT '',
  shop_phone TEXT DEFAULT '',
  shop_email TEXT DEFAULT '',
  shop_gstin TEXT DEFAULT '',
  shop_state_name TEXT DEFAULT '',
  invoice_prefix TEXT DEFAULT 'INV',
  state_code TEXT DEFAULT '',
  bank_name TEXT DEFAULT '',
  bank_account TEXT DEFAULT '',
  bank_ifsc TEXT DEFAULT '',
  upi_id TEXT DEFAULT '',
  terms_conditions TEXT DEFAULT '',
  next_invoice_number INTEGER DEFAULT 1,
  -- POS PATROL integration fields
  location_code TEXT DEFAULT '01',
  terminal_id TEXT DEFAULT '01',
  current_shift TEXT DEFAULT '01',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoices table with POS PATROL fields
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES public.customers(id),
  customer_name TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  customer_gstin TEXT,
  customer_state_name TEXT,
  customer_state_code TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  total_cgst NUMERIC NOT NULL DEFAULT 0,
  total_sgst NUMERIC NOT NULL DEFAULT 0,
  total_igst NUMERIC NOT NULL DEFAULT 0,
  total_gst NUMERIC NOT NULL DEFAULT 0,
  grand_total NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  due_amount NUMERIC NOT NULL DEFAULT 0,
  payment_mode TEXT DEFAULT 'cash',
  status TEXT DEFAULT 'pending',
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  -- POS PATROL fields
  receipt_time TEXT,
  business_date DATE DEFAULT CURRENT_DATE,
  transaction_status TEXT DEFAULT 'SALES',
  return_amount NUMERIC DEFAULT 0,
  original_invoice_id UUID REFERENCES public.invoices(id),
  location_code TEXT DEFAULT '01',
  terminal_id TEXT DEFAULT '01',
  shift_no TEXT DEFAULT '01',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id),
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_mode TEXT DEFAULT 'cash',
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create public read/write policies (kiosk system - single user/device)
-- Customers policies
CREATE POLICY "Allow all operations on customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);

-- Products policies
CREATE POLICY "Allow all operations on products" ON public.products FOR ALL USING (true) WITH CHECK (true);

-- Settings policies
CREATE POLICY "Allow all operations on settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);

-- Invoices policies
CREATE POLICY "Allow all operations on invoices" ON public.invoices FOR ALL USING (true) WITH CHECK (true);

-- Payments policies
CREATE POLICY "Allow all operations on payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.settings (id, shop_name, invoice_prefix, location_code, terminal_id, current_shift)
VALUES (gen_random_uuid(), 'My Shop', 'INV', '01', '01', '01');