import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [schema, app, vercel] = await Promise.all([
  readFile(new URL('../supabase_schema.sql', import.meta.url), 'utf8'),
  readFile(new URL('../src/App.tsx', import.meta.url), 'utf8'),
  readFile(new URL('../vercel.json', import.meta.url), 'utf8'),
]);
const context = await readFile(new URL('../src/context/OrderContext.tsx', import.meta.url), 'utf8');

const functionBody = (source, functionName) => {
  const escapedName = functionName.replaceAll('.', '\\.');
  const match = source.match(new RegExp(`CREATE OR REPLACE FUNCTION ${escapedName}\\b([\\s\\S]*?)AS \\$\\$([\\s\\S]*?)\\$\\$;`));
  assert.ok(match, `Expected ${functionName} function definition`);
  return { declaration: match[1], body: match[2] };
};

test('staff PIN RPC rejects NULL and malformed PINs before creating a session', () => {
  const { body } = functionBody(schema, 'public.verify_staff_pin');
  assert.match(body, /submitted_pin\s+IS\s+NULL/i);
  assert.match(body, /submitted_pin\s*!~\s*'\^\[0-9\]\{4,6\}\$'/i);
  assert.match(body, /crypt\(submitted_pin,\s*pin_hash\)\s+IS\s+DISTINCT\s+FROM\s+pin_hash/i);
  assert.ok(body.indexOf('submitted_pin IS NULL') < body.indexOf('INSERT INTO private.staff_sessions'));
});

test('anonymous checkout is limited to the validated SECURITY DEFINER RPC', () => {
  const checkout = functionBody(schema, 'public.create_customer_order');
  assert.match(checkout.declaration, /SECURITY DEFINER/i);
  assert.match(schema, /GRANT EXECUTE ON FUNCTION public\.create_customer_order\(TEXT, TEXT, TEXT, JSONB, TEXT\) TO anon, authenticated/i);
  assert.match(schema, /REVOKE ALL ON public\.orders FROM PUBLIC, anon, authenticated/i);
  assert.doesNotMatch(schema, /GRANT INSERT ON public\.orders TO anon/i);
  assert.doesNotMatch(schema, /CREATE POLICY\s+"Customers can place new orders"/i);
});

test('customer order trigger prices items from private catalog and computes totals server-side', () => {
  const { body: trigger } = functionBody(schema, 'private.prepare_customer_order');
  assert.match(trigger, /FROM private\.menu_products/i);
  assert.match(trigger, /NEW\.total\s*:=\s*calculated_total/i);
  assert.match(trigger, /NEW\.order_number\s*:=\s*'PB-'\s*\|\|\s*nextval/i);
  assert.match(trigger, /NEW\.status\s*:=\s*'NEW'/i);
  assert.match(trigger, /Duplicate menu items are not allowed/i);
  assert.match(trigger, /payment_method NOT IN \('ONLINE', 'CASH'\)/i);
});

test('checkout payment method is required, persisted, and returned to the customer', () => {
  const checkout = functionBody(schema, 'public.create_customer_order');
  assert.match(checkout.declaration, /p_payment_method TEXT/i);
  assert.match(checkout.body, /payment_method/i);
  assert.match(schema, /ADD COLUMN IF NOT EXISTS payment_method TEXT/i);
  assert.match(context, /p_payment_method: paymentMethod/);
  assert.match(context, /paymentMethod: row\.payment_method/);
});

test('staff order policies require a verified staff session', () => {
  assert.match(schema, /CREATE POLICY "Staff can read orders"[\s\S]*?USING \(private\.is_staff_session\(\)\)/i);
  assert.match(schema, /CREATE POLICY "Staff can update orders"[\s\S]*?USING \(private\.is_staff_session\(\)\)[\s\S]*?WITH CHECK \(private\.is_staff_session\(\)\)/i);
  assert.match(schema, /CREATE POLICY "Staff can delete orders"[\s\S]*?USING \(private\.is_staff_session\(\)\)/i);
});

test('legacy order columns are added before any order-number backfill', () => {
  const addColumn = schema.indexOf('ADD COLUMN IF NOT EXISTS order_number');
  const backfill = schema.indexOf("SET order_number = 'PB-' || nextval");
  assert.ok(addColumn >= 0 && backfill > addColumn);
  assert.match(schema, /ALTER TABLE public\.orders ALTER COLUMN order_number SET NOT NULL/i);
});

test('admin deep link is protected and deployed through Vercel rewrites', () => {
  assert.match(app, /path === '\/admin'/);
  assert.match(app, /path === '\/u804'/);
  assert.match(app, /<AdminLogin onLoginSuccess=/);
  assert.match(vercel, /"source": "\/u804",\s*"destination": "\/index\.html"/);
  assert.match(vercel, /"source": "\/\(\.\*\)",\s*"destination": "\/index\.html"/);
  assert.doesNotMatch(vercel, /"source": "\/admin"/);
});

test('checkout retries return existing orders only after phone verification', () => {
  const checkout = functionBody(schema, 'public.create_customer_order');
  assert.match(checkout.body, /ON CONFLICT \(id\) DO NOTHING/i);
  assert.match(checkout.body, /customer_phone\s*=\s*regexp_replace\(COALESCE\(p_customer_phone/i);
  assert.match(checkout.body, /Order request could not be verified/i);
  assert.doesNotMatch(checkout.body, /ON CONFLICT \(id\) DO UPDATE/i);
  assert.match(context, /pendingOrderRef\.current\.id/);
});

test('staff transitions are conditional on current server status', () => {
  assert.match(context, /\.eq\('status', 'NEW'\)[\s\S]*?\.select\('id'\)/);
  assert.match(context, /\.eq\('status', 'ACCEPTED'\)[\s\S]*?\.select\('id'\)/);
  assert.match(context, /\.eq\('status', 'COMPLETED'\)[\s\S]*?\.select\('id'\)/);
});

test('Realtime reconnect snapshots paginate beyond the REST default row cap', () => {
  assert.match(context, /const pageSize = 500/);
  assert.match(context, /\.range\(offset, offset \+ pageSize - 1\)/);
  assert.match(context, /status === 'SUBSCRIBED'[\s\S]*?fetchCloudOrders/);
});
