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

UPDATE public.orders
SET customer_name = COALESCE(NULLIF(btrim(customer_name), ''), 'Customer'),
    customer_phone = COALESCE(customer_phone, ''),
    items = COALESCE(items, '[]'::jsonb),
    total = COALESCE(total, 0),
    status = COALESCE(NULLIF(status, ''), 'NEW'),
    created_at = COALESCE(created_at, timezone('utc'::text, now()));

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

  SELECT MAX(NULLIF(regexp_replace(order_number, '[^0-9]', '', 'g'), '')::BIGINT)
  INTO highest_order_number
  FROM public.orders
  WHERE order_number IS NOT NULL;

  IF existing_last_value IS NULL OR existing_last_value < COALESCE(highest_order_number, 1041) THEN
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

CREATE INDEX IF NOT EXISTS orders_created_at_desc_idx
ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_created_at_idx
ON public.orders (status, created_at DESC);

DROP FUNCTION IF EXISTS public.next_order_number();

-- Staff PIN hashes and staff sessions are not exposed through the Data API.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE TABLE IF NOT EXISTS private.menu_products (
  product_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  unit_price NUMERIC NOT NULL CHECK (unit_price > 0),
  available BOOLEAN NOT NULL DEFAULT TRUE
);
REVOKE ALL ON private.menu_products FROM PUBLIC, anon, authenticated;

INSERT INTO private.menu_products (product_id, name, unit_price) VALUES
  ('prod-corn-pizza', 'Corn Pizza', 109),
  ('prod-paneer-onion-pizza', 'Paneer & Onion Pizza', 139),
  ('prod-paneer-corn-pizza', 'Paneer & Corn Pizza', 169),
  ('prod-farmhouse-pizza', 'Farmhouse Pizza', 199),
  ('prod-veg-burger', 'Veg Burger', 49),
  ('prod-cheese-burger', 'Cheese Burger', 69),
  ('prod-cheese-corn-sandwich', 'Cheese & Corn Sandwich', 79),
  ('prod-paneer-corn-cheese-sandwich', 'Paneer & Corn and Cheese Sandwich', 109),
  ('prod-peri-peri-fries-regular', 'Peri Peri Fries (Regular)', 59),
  ('prod-peri-peri-fries-large', 'Peri Peri Fries (Large)', 89),
  ('prod-cold-coffee', 'Cold Coffee', 49)
ON CONFLICT (product_id) DO UPDATE
SET name = EXCLUDED.name,
    unit_price = EXCLUDED.unit_price;

CREATE OR REPLACE FUNCTION private.prepare_customer_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  item JSONB;
  normalized_items JSONB := '[]'::jsonb;
  requested_product_id TEXT;
  product_name TEXT;
  product_price NUMERIC;
  item_quantity INTEGER;
  calculated_total NUMERIC := 0;
BEGIN
  NEW.customer_name := btrim(COALESCE(NEW.customer_name, ''));
  NEW.customer_phone := regexp_replace(COALESCE(NEW.customer_phone, ''), '[^0-9]', '', 'g');

  IF char_length(NEW.customer_name) < 2 OR char_length(NEW.customer_name) > 100 THEN
    RAISE EXCEPTION 'Enter a valid customer name';
  END IF;
  IF NEW.customer_phone !~ '^[6-9][0-9]{9}$' THEN
    RAISE EXCEPTION 'Enter a valid 10-digit Indian mobile number';
  END IF;
  IF NEW.items IS NULL OR jsonb_typeof(NEW.items) <> 'array' THEN
    RAISE EXCEPTION 'Order items must be a JSON array';
  END IF;
  IF jsonb_array_length(NEW.items) NOT BETWEEN 1 AND 30 THEN
    RAISE EXCEPTION 'Order must contain between 1 and 30 items';
  END IF;
  IF jsonb_array_length(NEW.items) <> (
    SELECT count(DISTINCT entry.value->>'productId')
    FROM jsonb_array_elements(NEW.items) AS entry(value)
  ) THEN
    RAISE EXCEPTION 'Duplicate menu items are not allowed';
  END IF;

  FOR item IN SELECT entry.value FROM jsonb_array_elements(NEW.items) AS entry(value)
  LOOP
    IF jsonb_typeof(item) <> 'object'
      OR item->>'productId' IS NULL
      OR COALESCE(item->>'quantity', '') !~ '^[1-9][0-9]?$'
    THEN
      RAISE EXCEPTION 'Order contains an invalid item';
    END IF;

    requested_product_id := item->>'productId';
    item_quantity := (item->>'quantity')::INTEGER;

    SELECT menu.name, menu.unit_price INTO product_name, product_price
    FROM private.menu_products AS menu
    WHERE menu.product_id = requested_product_id AND menu.available;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Order contains an unavailable menu item';
    END IF;

    normalized_items := normalized_items || jsonb_build_array(jsonb_build_object(
      'productId', requested_product_id,
      'nameSnapshot', product_name,
      'unitPrice', product_price,
      'quantity', item_quantity,
      'lineTotal', product_price * item_quantity
    ));
    calculated_total := calculated_total + product_price * item_quantity;
  END LOOP;

  NEW.items := normalized_items;
  NEW.total := calculated_total;
  NEW.order_number := 'PB-' || nextval('public.order_number_seq')::TEXT;
  NEW.created_at := clock_timestamp();
  NEW.bill_id := 'PB-' || to_char(NEW.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYYMMDD')
    || '-' || regexp_replace(NEW.order_number, '[^0-9]', '', 'g');
  NEW.status := 'NEW';
  NEW.completed_at := NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prepare_customer_order ON public.orders;
CREATE TRIGGER prepare_customer_order
BEFORE INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION private.prepare_customer_order();

REVOKE ALL ON FUNCTION private.prepare_customer_order() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_customer_order(
  p_order_id TEXT,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  created_order public.orders%ROWTYPE;
  id_is_uuid BOOLEAN;
BEGIN
  IF p_order_id IS NULL OR p_order_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN
    RAISE EXCEPTION 'Invalid order identifier';
  END IF;

  SELECT data_type = 'uuid' INTO id_is_uuid
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'id';

  IF id_is_uuid THEN
    INSERT INTO public.orders (
      id, order_number, bill_id, customer_name, customer_phone, items, total, status
    ) VALUES (
      p_order_id::UUID, 'PB-PENDING', 'PB-PENDING', p_customer_name, p_customer_phone, p_items, 0, 'NEW'
    ) ON CONFLICT (id) DO NOTHING
    RETURNING * INTO created_order;
  ELSE
    INSERT INTO public.orders (
      id, order_number, bill_id, customer_name, customer_phone, items, total, status
    ) VALUES (
      p_order_id, 'PB-PENDING', 'PB-PENDING', p_customer_name, p_customer_phone, p_items, 0, 'NEW'
    ) ON CONFLICT (id) DO NOTHING
    RETURNING * INTO created_order;
  END IF;

  IF NOT FOUND THEN
    SELECT * INTO created_order
    FROM public.orders
    WHERE id::TEXT = p_order_id
      AND customer_phone = regexp_replace(COALESCE(p_customer_phone, ''), '[^0-9]', '', 'g');

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Order request could not be verified';
    END IF;
  END IF;

  RETURN to_jsonb(created_order);
END;
$$;

REVOKE ALL ON FUNCTION public.create_customer_order(TEXT, TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_customer_order(TEXT, TEXT, TEXT, JSONB) TO anon, authenticated;

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
  IF current_user_id IS NULL
    OR submitted_pin IS NULL
    OR submitted_pin !~ '^[0-9]{4,6}$' THEN
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

  IF extensions.crypt(submitted_pin, pin_hash) IS DISTINCT FROM pin_hash THEN
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
GRANT SELECT, UPDATE, DELETE ON public.orders TO authenticated;

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
