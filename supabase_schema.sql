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

-- Allocate unique order tokens centrally across every customer device.
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START WITH 1042;

DO $$
DECLARE
  existing_last_value BIGINT;
  highest_order_number BIGINT;
BEGIN
  SELECT last_value INTO existing_last_value
  FROM pg_sequences
  WHERE schemaname = 'public' AND sequencename = 'order_number_seq';

  IF existing_last_value IS NULL THEN
    SELECT MAX(NULLIF(regexp_replace(order_number, '[^0-9]', '', 'g'), '')::BIGINT)
    INTO highest_order_number
    FROM public.orders;

    PERFORM setval(
      'public.order_number_seq',
      GREATEST(COALESCE(highest_order_number, 1041), 1041)
    );
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.next_order_number()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT 'PB-' || nextval('public.order_number_seq')::TEXT;
$$;

GRANT EXECUTE ON FUNCTION public.next_order_number() TO anon, authenticated;

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 3. Add permissive policies for the Food Stall model (Public Menu & Anonymous Order Creation)
-- Anyone can view orders (needed for real-time tracking)
DROP POLICY IF EXISTS "Allow public read access to orders" ON public.orders;
CREATE POLICY "Allow public read access to orders"
ON public.orders FOR SELECT
TO anon, authenticated
USING (true);

-- Anyone can insert orders (Customers placing orders from mobile)
DROP POLICY IF EXISTS "Allow public insert to orders" ON public.orders;
CREATE POLICY "Allow public insert to orders"
ON public.orders FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow updates (Staff POS accepting & completing orders)
DROP POLICY IF EXISTS "Allow public update to orders" ON public.orders;
CREATE POLICY "Allow public update to orders"
ON public.orders FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Allow the staff dashboard to delete individual orders and clear completed history.
DROP POLICY IF EXISTS "Allow public delete from orders" ON public.orders;
CREATE POLICY "Allow public delete from orders"
ON public.orders FOR DELETE
TO anon, authenticated
USING (true);

-- 4. Enable Realtime Replication for the orders table
-- This allows instant cross-device WebSocket updates between customer and POS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
END
$$;
