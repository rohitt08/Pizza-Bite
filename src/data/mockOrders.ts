import type { Order } from '../types';
import { generateBillId } from '../utils/formatters';

const now = new Date();

// Helper to create timestamp offset by minutes
const minutesAgo = (min: number) => new Date(now.getTime() - min * 60 * 1000).toISOString();

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-mock-1',
    orderNumber: 'PB-1038',
    billId: generateBillId(now, 'PB-1038'),
    customerName: 'Rahul Sharma',
    customerPhone: '9876543210',
    items: [
      {
        productId: 'prod-corn-pizza',
        nameSnapshot: 'Corn Pizza',
        unitPrice: 109,
        quantity: 1,
        lineTotal: 109,
      },
      {
        productId: 'prod-cold-coffee',
        nameSnapshot: 'Cold Coffee',
        unitPrice: 49,
        quantity: 1,
        lineTotal: 49,
      },
    ],
    total: 158,
    status: 'COMPLETED',
    createdAt: minutesAgo(45),
    completedAt: minutesAgo(32),
  },
  {
    id: 'ord-mock-2',
    orderNumber: 'PB-1039',
    billId: generateBillId(now, 'PB-1039'),
    customerName: 'Priya Patel',
    customerPhone: '9823456781',
    items: [
      {
        productId: 'prod-paneer-corn-cheese-sandwich',
        nameSnapshot: 'Paneer & Corn and Cheese Sandwich',
        unitPrice: 109,
        quantity: 1,
        lineTotal: 109,
      },
      {
        productId: 'prod-peri-peri-fries-regular',
        nameSnapshot: 'Peri Peri Fries (Regular)',
        unitPrice: 59,
        quantity: 1,
        lineTotal: 59,
      },
    ],
    total: 168,
    status: 'COMPLETED',
    createdAt: minutesAgo(30),
    completedAt: minutesAgo(18),
  },
  {
    id: 'ord-mock-3',
    orderNumber: 'PB-1040',
    billId: generateBillId(now, 'PB-1040'),
    customerName: 'Aman Verma',
    customerPhone: '9711223344',
    items: [
      {
        productId: 'prod-farmhouse-pizza',
        nameSnapshot: 'Farmhouse Pizza',
        unitPrice: 199,
        quantity: 1,
        lineTotal: 199,
      },
      {
        productId: 'prod-peri-peri-fries-large',
        nameSnapshot: 'Peri Peri Fries (Large)',
        unitPrice: 89,
        quantity: 1,
        lineTotal: 89,
      },
    ],
    total: 288,
    status: 'ACCEPTED',
    createdAt: minutesAgo(8),
  },
  {
    id: 'ord-mock-4',
    orderNumber: 'PB-1041',
    billId: generateBillId(now, 'PB-1041'),
    customerName: 'Sneha Kulkarni',
    customerPhone: '9988776655',
    items: [
      {
        productId: 'prod-cheese-burger',
        nameSnapshot: 'Cheese Burger',
        unitPrice: 69,
        quantity: 2,
        lineTotal: 138,
      },
      {
        productId: 'prod-cold-coffee',
        nameSnapshot: 'Cold Coffee',
        unitPrice: 49,
        quantity: 2,
        lineTotal: 98,
      },
    ],
    total: 236,
    status: 'NEW',
    createdAt: minutesAgo(2),
  },
];
