import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Product, CartItem, Order, CustomerDetails } from '../types';
import { INITIAL_PRODUCTS } from '../data/mockProducts';
import { calculateGrandTotal, calculateLineTotal } from '../utils/currency';
import { generateOrderNumber, generateBillId } from '../utils/formatters';
import { supabase, isSupabaseConfigured } from '../utils/supabase';

interface OrderContextType {
  products: Product[];
  orders: Order[];
  cart: CartItem[];
  customerDetails: CustomerDetails | null;
  activeReceiptOrder: Order | null;
  rushMode: boolean;
  soundEnabled: boolean;
  lastCompletedOrderId: string | null;
  totalCartItems: number;
  cartTotal: number;
  
  // Actions
  setCustomerDetails: (details: CustomerDetails | null) => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  placeOrder: () => Promise<Order | null>;
  acceptOrder: (orderId: string) => void;
  completeOrder: (orderId: string) => void;
  undoCompleteOrder: (orderId: string) => void;
  deleteOrder: (orderId: string) => Promise<void>;
  dismissUndo: () => void;
  clearOrderHistory: () => Promise<void>;
  toggleRushMode: () => void;
  toggleSound: () => void;
  setActiveReceiptOrder: (order: Order | null) => void;

}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

const ORDERS_STORAGE_KEY = 'pb_orders_v1';
const CUSTOMER_STORAGE_KEY = 'pb_customer_details_v1';
const RUSH_MODE_STORAGE_KEY = 'pb_rush_mode_v1';
const SOUND_STORAGE_KEY = 'pb_sound_pref_v1';
const ORDER_COUNTER_KEY = 'pb_order_seq_counter';

// Web Audio API chime synthesizer (safe in all browsers, zero external audio asset required)
function playChime(enabled: boolean) {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    
    // First high note (bell tone)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.4);

    // Second cheerful note
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12); // A5
    gain2.gain.setValueAtTime(0.2, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.7);
  } catch {
    // Audio autoplay restrictions or unsupported
  }
}

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products] = useState<Product[]>(INITIAL_PRODUCTS);

  // Initialize orders from localStorage or start empty
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Fallback
    }
    return [];
  });

  // Customer details for the ordering session
  const [customerDetails, setCustomerDetailsState] = useState<CustomerDetails | null>(() => {
    try {
      const saved = localStorage.getItem(CUSTOMER_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return null;
  });

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);

  // Receipt order
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<Order | null>(null);

  // Rush mode
  const [rushMode, setRushMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(RUSH_MODE_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Sound preference
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const pref = localStorage.getItem(SOUND_STORAGE_KEY);
      return pref === null ? true : pref === 'true';
    } catch {
      return true;
    }
  });

  // Last completed order ID for Undo banner
  const [lastCompletedOrderId, setLastCompletedOrderId] = useState<string | null>(null);

  // Sync orders to localStorage as local cache
  useEffect(() => {
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } catch {
      // Storage quota or disabled
    }
  }, [orders]);

  // Realtime Supabase Subscription & Sync
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      // Fallback cross-tab storage sync when Supabase is not configured
      const handleStorage = (e: StorageEvent) => {
        if (e.key === ORDERS_STORAGE_KEY && e.newValue) {
          try {
            const updated = JSON.parse(e.newValue);
            setOrders(updated);
          } catch {
            // Ignore
          }
        }
      };
      window.addEventListener('storage', handleStorage);
      return () => window.removeEventListener('storage', handleStorage);
    }

    const client = supabase;
    if (!client) return;

    // 1. Initial fetch from Supabase
    const fetchCloudOrders = async () => {
      try {
        const { data, error } = await client
          .from('orders')
          .select('*')
          .order('createdAt', { ascending: false });

        if (!error && data && data.length > 0) {
          const parsedOrders: Order[] = data.map((row: any) => ({
            id: row.id,
            orderNumber: row.order_number || row.orderNumber,
            billId: row.bill_id || row.billId,
            customerName: row.customer_name || row.customerName,
            customerPhone: row.customer_phone || row.customerPhone,
            items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
            total: Number(row.total),
            status: row.status,
            createdAt: row.created_at || row.createdAt,
            completedAt: row.completed_at || row.completedAt || undefined,
          }));
          setOrders(parsedOrders);
        }
      } catch (err) {
        console.warn('Could not fetch from Supabase, using local fallback:', err);
      }
    };

    fetchCloudOrders();

    // 2. Realtime listener for cross-device orders
    const channel = client
      .channel('realtime_orders_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRow = payload.new;
            const newOrder: Order = {
              id: newRow.id,
              orderNumber: newRow.order_number || newRow.orderNumber,
              billId: newRow.bill_id || newRow.billId,
              customerName: newRow.customer_name || newRow.customerName,
              customerPhone: newRow.customer_phone || newRow.customerPhone,
              items: typeof newRow.items === 'string' ? JSON.parse(newRow.items) : newRow.items,
              total: Number(newRow.total),
              status: newRow.status,
              createdAt: newRow.created_at || newRow.createdAt,
              completedAt: newRow.completed_at || newRow.completedAt || undefined,
            };

            setOrders((prev) => {
              if (prev.some((o) => o.id === newOrder.id)) return prev;
              return [newOrder, ...prev];
            });

            // Chime for new incoming order
            playChime(soundEnabled);
          } else if (payload.eventType === 'UPDATE') {
            const updatedRow = payload.new;
            setOrders((prev) =>
              prev.map((ord) =>
                ord.id === updatedRow.id
                  ? {
                      ...ord,
                      status: updatedRow.status,
                      completedAt: updatedRow.completed_at || updatedRow.completedAt || ord.completedAt,
                    }
                  : ord
              )
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedRow = payload.old;
            setOrders((prev) => prev.filter((ord) => ord.id !== deletedRow.id));
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [soundEnabled]);

  const setCustomerDetails = useCallback((details: CustomerDetails | null) => {
    setCustomerDetailsState(details);
    if (details) {
      localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(details));
    } else {
      localStorage.removeItem(CUSTOMER_STORAGE_KEY);
    }
  }, []);

  const toggleRushMode = useCallback(() => {
    setRushMode((prev) => {
      const next = !prev;
      localStorage.setItem(RUSH_MODE_STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(SOUND_STORAGE_KEY, String(next));
      if (next) {
        playChime(true);
      }
      return next;
    });
  }, []);

  // Cart actions
  const addToCart = useCallback((product: Product) => {
    if (!product.available) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Cart totals
  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = calculateGrandTotal(
    cart.map((item) => ({ unitPrice: item.product.price, quantity: item.quantity }))
  );

  // Place order
  const placeOrder = useCallback(async (): Promise<Order | null> => {
    if (!customerDetails || cart.length === 0) return null;

    // Get current sequence counter
    let currentSeq = 1042;
    try {
      const storedSeq = localStorage.getItem(ORDER_COUNTER_KEY);
      if (storedSeq) {
        currentSeq = parseInt(storedSeq, 10);
      }
    } catch {
      // Use fallback
    }

    const orderNumber = generateOrderNumber(currentSeq);
    const now = new Date();
    const billId = generateBillId(now, orderNumber);

    const items = cart.map((cartItem) => ({
      productId: cartItem.product.id,
      nameSnapshot: cartItem.product.name,
      unitPrice: cartItem.product.price,
      quantity: cartItem.quantity,
      lineTotal: calculateLineTotal(cartItem.product.price, cartItem.quantity),
    }));

    const total = calculateGrandTotal(
      items.map((i) => ({ unitPrice: i.unitPrice, quantity: i.quantity }))
    );

    const newOrder: Order = {
      id: `ord-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      orderNumber,
      billId,
      customerName: customerDetails.name.trim(),
      customerPhone: customerDetails.phone.trim(),
      items,
      total,
      status: 'NEW',
      createdAt: now.toISOString(),
    };

    // Update sequence
    try {
      localStorage.setItem(ORDER_COUNTER_KEY, String(currentSeq + 1));
    } catch {
      // Ignore
    }

    // Persist to Supabase if configured
    if (isSupabaseConfigured && supabase) {
      supabase
        .from('orders')
        .insert({
          id: newOrder.id,
          order_number: newOrder.orderNumber,
          bill_id: newOrder.billId,
          customer_name: newOrder.customerName,
          customer_phone: newOrder.customerPhone,
          items: newOrder.items,
          total: newOrder.total,
          status: newOrder.status,
          created_at: newOrder.createdAt,
        })
        .then(({ error }) => {
          if (error) console.error('Supabase order insert error:', error);
        });
    }

    // Update orders list
    setOrders((prev) => [newOrder, ...prev]);
    setActiveReceiptOrder(newOrder);
    clearCart();

    // Trigger audio chime
    playChime(soundEnabled);

    return newOrder;
  }, [customerDetails, cart, soundEnabled, clearCart]);

  // Staff workflow actions: ONLY ACCEPT and COMPLETE
  const acceptOrder = useCallback((orderId: string) => {
    setOrders((prev) =>
      prev.map((ord) =>
        ord.id === orderId ? { ...ord, status: 'ACCEPTED' as const } : ord
      )
    );

    if (isSupabaseConfigured && supabase) {
      supabase
        .from('orders')
        .update({ status: 'ACCEPTED' })
        .eq('id', orderId)
        .then(({ error }) => {
          if (error) console.error('Supabase accept order error:', error);
        });
    }
  }, []);

  const completeOrder = useCallback((orderId: string) => {
    const completedAt = new Date().toISOString();
    setOrders((prev) =>
      prev.map((ord) =>
        ord.id === orderId
          ? {
              ...ord,
              status: 'COMPLETED' as const,
              completedAt,
            }
          : ord
      )
    );
    setLastCompletedOrderId(orderId);

    if (isSupabaseConfigured && supabase) {
      supabase
        .from('orders')
        .update({ status: 'COMPLETED', completed_at: completedAt })
        .eq('id', orderId)
        .then(({ error }) => {
          if (error) console.error('Supabase complete order error:', error);
        });
    }
  }, []);

  const undoCompleteOrder = useCallback((orderId: string) => {
    setOrders((prev) =>
      prev.map((ord) =>
        ord.id === orderId
          ? {
              ...ord,
              status: 'NEW' as const,
              completedAt: undefined,
            }
          : ord
      )
    );
    setLastCompletedOrderId(null);

    if (isSupabaseConfigured && supabase) {
      supabase
        .from('orders')
        .update({ status: 'NEW', completed_at: null })
        .eq('id', orderId)
        .then(({ error }) => {
          if (error) console.error('Supabase undo error:', error);
        });
    }
  }, []);

  const deleteOrder = useCallback(async (orderId: string) => {
    // 1. Remove from local state
    setOrders((prev) => prev.filter((o) => o.id !== orderId));

    // 2. Remove from Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('orders')
          .delete()
          .eq('id', orderId);
        if (error) console.error('Error deleting order from Supabase:', error);
      } catch (err) {
        console.error('Failed to delete order:', err);
      }
    }
  }, []);

  const dismissUndo = useCallback(() => {
    setLastCompletedOrderId(null);
  }, []);

  // Delete completed order history to clean database & free storage
  const clearOrderHistory = useCallback(async () => {
    // 1. Update local state
    setOrders((prev) => prev.filter((o) => o.status !== 'COMPLETED'));

    // 2. Delete from Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('orders')
          .delete()
          .eq('status', 'COMPLETED');
        if (error) console.error('Error clearing completed orders from Supabase:', error);
      } catch (err) {
        console.error('Failed to clear completed orders:', err);
      }
    }
  }, []);

  return (
    <OrderContext.Provider
      value={{
        products,
        orders,
        cart,
        customerDetails,
        activeReceiptOrder,
        rushMode,
        soundEnabled,
        lastCompletedOrderId,
        totalCartItems,
        cartTotal,
        setCustomerDetails,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        placeOrder,
        acceptOrder,
        completeOrder,
        undoCompleteOrder,
        deleteOrder,
        dismissUndo,
        clearOrderHistory,
        toggleRushMode,
        toggleSound,
        setActiveReceiptOrder,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export function useOrderContext() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrderContext must be used within an OrderProvider');
  }
  return context;
}
