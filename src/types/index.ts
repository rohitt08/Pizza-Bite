export type ProductCategory = 
  | 'All'
  | 'Pizza'
  | 'Burgers'
  | 'Sandwiches'
  | 'Fries'
  | 'Beverages';

export interface Product {
  id: string;
  name: string;
  category: Exclude<ProductCategory, 'All'>;
  price: number; // In Rupees (e.g., 109)
  image: string;
  description?: string;
  available: boolean;
  isVeg?: boolean;
  badge?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  nameSnapshot: string;
  unitPrice: number; // In Rupees
  quantity: number;
  lineTotal: number; // In Rupees
}

export type OrderStatus = 'NEW' | 'ACCEPTED' | 'COMPLETED';
export type PaymentMethod = 'ONLINE' | 'CASH';

export interface Order {
  id: string; // Internal unique ID
  orderNumber: string; // e.g. "PB-1042"
  billId: string; // e.g. "PB-20261009-1042"
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  total: number; // In Rupees
  paymentMethod?: PaymentMethod;
  status: OrderStatus;
  createdAt: string; // ISO string
  completedAt?: string; // ISO string
}

export interface CustomerDetails {
  name: string;
  phone: string;
}
