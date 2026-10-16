// src/utils/orderApi.ts
import { supabase } from './supabase';

export interface Order {
  id?: string;
  customer_id: string;
  product_name: string;
  quantity: number;
  price: number;
  status?: string;
}

/**
 * Insert a new order for the given customer.
 * Uses `insert` (not `upsert`) so existing rows stay untouched.
 */
export async function createOrder(order: Order) {
  const { data, error } = await supabase!
    .from('orders')
    .insert([order]);

  if (error) throw new Error(`Failed to create order: ${error.message}`);
  return data;
}

/**
 * Fetch *all* orders for a customer, sorted newest‑first.
 */
export async function getCustomerOrders(customerId: string) {
  const { data, error } = await supabase!
    .from('orders')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to load orders: ${error.message}`);
  return data as Order[];
}
