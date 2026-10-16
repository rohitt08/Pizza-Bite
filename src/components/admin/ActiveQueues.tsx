import React from 'react';
import { Clock, ChefHat } from 'lucide-react';
import type { Order } from '../../types';
import { OrderCard } from './OrderCard';

interface ActiveQueuesProps {
  newOrders: Order[];
  acceptedOrders: Order[];
  onAcceptOrder: (orderId: string) => void;
  onCompleteOrder: (orderId: string) => void;
}

export const ActiveQueues: React.FC<ActiveQueuesProps> = ({
  newOrders,
  acceptedOrders,
  onAcceptOrder,
  onCompleteOrder,
}) => {
  const oldestWaitingId = newOrders.length > 0
    ? [...newOrders].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0]?.id
    : undefined;

  return (
    <div className="w-full space-y-5">
      <QueueSection
        title="New Orders"
        description="Live incoming orders from customers"
        count={newOrders.length}
        emptyMessage="New orders will appear here."
        tone="amber"
        icon={<Clock className="w-4 h-4" />}
        orders={newOrders}
        oldestWaitingId={oldestWaitingId}
        onAction={onAcceptOrder}
      />
      <QueueSection
        title="Accepted Orders"
        description="Orders in preparation"
        count={acceptedOrders.length}
        emptyMessage="No orders are currently in preparation."
        tone="sky"
        icon={<ChefHat className="w-4 h-4" />}
        orders={acceptedOrders}
        onAction={onCompleteOrder}
      />
    </div>
  );
};

interface QueueSectionProps {
  title: string;
  description: string;
  count: number;
  emptyMessage: string;
  tone: 'amber' | 'sky';
  icon: React.ReactNode;
  orders: Order[];
  oldestWaitingId?: string;
  onAction: (orderId: string) => void;
}

const QueueSection: React.FC<QueueSectionProps> = ({
  title,
  description,
  count,
  emptyMessage,
  tone,
  icon,
  orders,
  oldestWaitingId,
  onAction,
}) => (
  <section className="flex flex-col rounded-3xl bg-stone-925 border border-stone-800 p-3.5 sm:p-5 shadow-lg">
    <header className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-stone-800 gap-2">
      <div className="flex items-center gap-2.5">
        <div className={`w-9 h-9 rounded-2xl border flex items-center justify-center shrink-0 ${tone === 'amber' ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' : 'bg-sky-500/20 border-sky-500/30 text-sky-400'}`}>
          {icon}
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">{title}</h2>
          <span className="text-xs text-stone-400 font-medium">{description}</span>
        </div>
      </div>
      <span className={`px-3 py-1 rounded-xl font-mono font-bold text-xs sm:text-sm border shrink-0 ${tone === 'amber' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-sky-500/20 text-sky-300 border-sky-500/30'}`}>
        {count} {tone === 'amber' ? 'Waiting' : 'In prep'}
      </span>
    </header>
    <div className="space-y-3.5">
      {orders.length === 0 ? (
        <div className="min-h-32 rounded-2xl border border-dashed border-stone-800 flex items-center justify-center text-center p-6 text-sm text-stone-400">
          {emptyMessage}
        </div>
      ) : orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          isOldestWaiting={order.id === oldestWaitingId}
          onAccept={tone === 'amber' ? onAction : undefined}
          onComplete={tone === 'sky' ? onAction : undefined}
        />
      ))}
    </div>
  </section>
);
