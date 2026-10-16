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

-- CREATE TABLE IF NOT EXISTS does not add columns to an existing legacy table.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS bill_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name TEXT NOT NULL DEFAULT 'Customer';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone TEXT NOT NULL DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'NEW';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Older schemas stored one product per row and may require these legacy-only fields.
DO $$
DECLARE
  legacy_column TEXT;
BEGIN
  FOREACH legacy_column IN ARRAY ARRAY['customer_id', 'product_name', 'quantity', 'price']
  LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'orders'
        AND column_name = legacy_column
        AND is_nullable = 'NO'
    ) THEN
      EXECUTE format('ALTER TABLE public.orders ALTER COLUMN %I DROP NOT NULL', legacy_column);
    END IF;
  END LOOP;
END
$$;

-- Preserve product details from the former row-per-product schema.
UPDATE public.orders AS legacy_order
SET items = jsonb_build_array(jsonb_build_object(
  'productId', COALESCE(to_jsonb(legacy_order)->>'product_id', 'legacy'),
  'nameSnapshot', COALESCE(to_jsonb(legacy_order)->>'product_name', 'Legacy item'),
  'unitPrice', COALESCE(NULLIF(to_jsonb(legacy_order)->>'price', '')::NUMERIC, 0),
  'quantity', COALESCE(NULLIF(to_jsonb(legacy_order)->>'quantity', '')::INTEGER, 1),
  'lineTotal',
    COALESCE(NULLIF(to_jsonb(legacy_order)->>'price', '')::NUMERIC, 0)
    * COALESCE(NULLIF(to_jsonb(legacy_order)->>'quantity', '')::INTEGER, 1)
))
WHERE legacy_order.items = '[]'::jsonb
  AND to_jsonb(legacy_order) ? 'product_name';

UPDATE public.orders
SET total = (
  SELECT COALESCE(SUM((item->>'lineTotal')::NUMERIC), 0)
  FROM jsonb_array_elements(items) AS elements(item)
)
WHERE total = 0 AND items <> '[]'::jsonb;

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
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'orders'
        AND column_name IN ('order_number', 'orderNumber')
    ) THEN
      EXECUTE format(
        'SELECT MAX(NULLIF(regexp_replace(%I::text, ''[^0-9]'', '''', ''g''), '''')::BIGINT) FROM public.orders',
        CASE
          WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'order_number'
          ) THEN 'order_number'
          ELSE 'orderNumber'
        END
      ) INTO highest_order_number;
    ELSE
      highest_order_number := 1041;
    END IF;

    PERFORM setval(
      'public.order_number_seq',
      GREATEST(COALESCE(highest_order_number, 1041), 1041)
    );
  END IF;
END
$$;

UPDATE public.orders
SET order_number = 'PB-' || nextval('public.order_number_seq')::TEXT
WHERE order_number IS NULL OR btrim(order_number) = '';

UPDATE public.orders
SET bill_id = 'PB-' || to_char(created_at AT TIME ZONE 'Asia/Kolkata', 'YYYYMMDD') || '-' || regexp_replace(order_number, '[^0-9]', '', 'g')
WHERE bill_id IS NULL OR btrim(bill_id) = '';

ALTER TABLE public.orders ALTER COLUMN order_number SET NOT NULL;
ALTER TABLE public.orders ALTER COLUMN bill_id SET NOT NULL;

CREATE OR REPLACE FUNCTION public.next_order_number()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT 'PB-' || nextval('public.order_number_seq')::TEXT;
$$;

REVOKE ALL ON FUNCTION public.next_order_number() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_order_number() TO anon, authenticated;

-- Staff PIN hashes and staff sessions are not exposed through the Data API.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE TABLE IF NOT EXISTS private.staff_sessions (
  user_id UUID PRIMARY KEY,
  expires_at TIMESTAMPTZ NOT NULL
);
REVOKE ALL ON private.staff_sessions FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS private.staff_pin_attempts (
  user_id UUID PRIMARY KEY,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ
);
REVOKE ALL ON private.staff_pin_attempts FROM PUBLIC, anon, authenticated;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION private.is_staff_session()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM private.staff_sessions
    WHERE user_id = (SELECT auth.uid())
      AND expires_at > now()
  );
$$;

REVOKE ALL ON FUNCTION private.is_staff_session() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_staff_session() TO authenticated;

CREATE OR REPLACE FUNCTION public.is_staff_session()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT private.is_staff_session();
$$;

REVOKE ALL ON FUNCTION public.is_staff_session() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_staff_session() TO authenticated;

CREATE OR REPLACE FUNCTION public.end_staff_session()
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = ''
AS $$
  DELETE FROM private.staff_sessions WHERE user_id = (SELECT auth.uid());
$$;

REVOKE ALL ON FUNCTION public.end_staff_session() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.end_staff_session() TO authenticated;

CREATE OR REPLACE FUNCTION public.verify_staff_pin(submitted_pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  pin_hash TEXT;
  current_user_id UUID := auth.uid();
  current_lock TIMESTAMPTZ;
BEGIN
  IF current_user_id IS NULL OR submitted_pin !~ '^[0-9]{4,6}$' THEN
    RETURN FALSE;
  END IF;

  SELECT locked_until INTO current_lock
  FROM private.staff_pin_attempts
  WHERE user_id = current_user_id;

  IF current_lock > now() THEN
    RETURN FALSE;
  END IF;

  SELECT decrypted_secret INTO pin_hash
  FROM vault.decrypted_secrets
  WHERE name = 'pizza_bite_staff_pin_hash'
  LIMIT 1;

  IF pin_hash IS NULL THEN
    RAISE EXCEPTION 'Staff PIN hash is not configured in Supabase Vault';
  END IF;

  IF extensions.crypt(submitted_pin, pin_hash) <> pin_hash THEN
    INSERT INTO private.staff_pin_attempts (user_id, failed_attempts, locked_until)
    VALUES (current_user_id, 1, NULL)
    ON CONFLICT (user_id) DO UPDATE
    SET failed_attempts = private.staff_pin_attempts.failed_attempts + 1,
        locked_until = CASE
          WHEN private.staff_pin_attempts.failed_attempts + 1 >= 5
            THEN now() + interval '15 minutes'
          ELSE private.staff_pin_attempts.locked_until
        END;
    RETURN FALSE;
  END IF;

  DELETE FROM private.staff_pin_attempts WHERE user_id = current_user_id;
  INSERT INTO private.staff_sessions (user_id, expires_at)
  VALUES (current_user_id, now() + interval '12 hours')
  ON CONFLICT (user_id) DO UPDATE SET expires_at = EXCLUDED.expires_at;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_staff_pin(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_staff_pin(TEXT) TO authenticated;

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders REPLICA IDENTITY FULL;

-- Remove legacy and custom permissive policies before applying the restricted set.
DO $$
DECLARE
  existing_policy RECORD;
BEGIN
  FOR existing_policy IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'orders'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.orders', existing_policy.policyname);
  END LOOP;
END
$$;

REVOKE ALL ON public.orders FROM PUBLIC, anon, authenticated;
GRANT INSERT ON public.orders TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.orders TO authenticated;

CREATE POLICY "Customers can place new orders"
ON public.orders FOR INSERT
TO anon, authenticated
WITH CHECK (status = 'NEW' AND completed_at IS NULL);

CREATE POLICY "Staff can read orders"
ON public.orders FOR SELECT
TO authenticated
USING (private.is_staff_session());

CREATE POLICY "Staff can update orders"
ON public.orders FOR UPDATE
TO authenticated
USING (private.is_staff_session())
WITH CHECK (private.is_staff_session());

CREATE POLICY "Staff can delete orders"
ON public.orders FOR DELETE
TO authenticated
USING (private.is_staff_session());

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

-- Refresh PostgREST's function cache after all RPC functions and grants are installed.
NOTIFY pgrst, 'reload schema';
