-- ========================================================
-- Pizza Bite: Supabase Database Schema & Realtime Setup
-- ========================================================

-- 1. Create the orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL,
  bill_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'NEW',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  completed_at TIMESTAMPTZ
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 3. Add permissive policies for the Food Stall model (Public Menu & Anonymous Order Creation)
-- Anyone can view orders (needed for real-time tracking)
CREATE POLICY "Allow public read access to orders"
ON public.orders FOR SELECT
TO anon, authenticated
USING (true);

-- Anyone can insert orders (Customers placing orders from mobile)
CREATE POLICY "Allow public insert to orders"
ON public.orders FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow updates (Staff POS accepting & completing orders)
CREATE POLICY "Allow public update to orders"
ON public.orders FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 4. Enable Realtime Replication for the orders table
-- This allows instant cross-device WebSocket updates between customer and POS
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
