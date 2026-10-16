-- Repair the missing public.next_order_number() RPC without rerunning the full security migration.
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

NOTIFY pgrst, 'reload schema';
