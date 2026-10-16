-- RPC-only repair for a database that already has the current public.orders schema.
-- For a legacy table missing current order columns, run supabase_schema.sql instead.
-- Run this entire script in the Supabase SQL Editor for the connected project.

CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START WITH 1042;

DO $$
DECLARE
  current_last_value BIGINT;
  highest_order_number BIGINT;
BEGIN
  SELECT last_value INTO current_last_value
  FROM pg_sequences
  WHERE schemaname = 'public' AND sequencename = 'order_number_seq';

  IF current_last_value IS NULL THEN
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

NOTIFY pgrst, 'reload schema';
