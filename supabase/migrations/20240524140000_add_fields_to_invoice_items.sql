ALTER TABLE public.invoice_items
ADD COLUMN hsn TEXT,
ADD COLUMN unit TEXT,
ADD COLUMN gst_percent NUMERIC(5, 2);
