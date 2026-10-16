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
