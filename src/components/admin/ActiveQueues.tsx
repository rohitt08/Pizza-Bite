import React from 'react';
import { Clock, CheckCircle } from 'lucide-react';
import type { Order } from '../../types';
import { OrderCard } from './OrderCard';

interface ActiveQueuesProps {
  newOrders: Order[];
  onCompleteOrder: (orderId: string) => void;
}

export const ActiveQueues: React.FC<ActiveQueuesProps> = ({
  newOrders,
  onCompleteOrder,
}) => {
  // Find oldest waiting order in NEW orders
  const oldestWaitingId = newOrders.length > 0
    ? [...newOrders].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0]?.id
    : undefined;

  return (
    <div className="w-full">
      {/* NEW ORDERS QUEUE */}
      <div className="flex flex-col rounded-3xl bg-stone-925 border border-stone-800 p-3.5 sm:p-5 shadow-lg">
        <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-stone-800 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">
                New Orders
              </h2>
              <span className="text-xs text-stone-400 font-medium">
                Live incoming orders from customers
              </span>
            </div>
          </div>

          <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-mono font-bold text-xs sm:text-sm border border-amber-500/30 shrink-0">
            {newOrders.length} Waiting
          </span>
        </div>

        {/* List of cards */}
        <div className="space-y-3.5">
          {newOrders.length === 0 ? (
            <div className="h-52 rounded-2xl border border-dashed border-stone-800 flex flex-col items-center justify-center text-center p-6 text-stone-500">
              <CheckCircle className="w-10 h-10 text-stone-600 mb-2" />
              <p className="text-sm sm:text-base font-bold text-stone-300">All caught up!</p>
              <p className="text-xs text-stone-400 mt-1 max-w-xs">
                New orders placed from mobile phones will pop up here with instant audio chime.
              </p>
            </div>
          ) : (
            newOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                isOldestWaiting={order.id === oldestWaitingId}
                onComplete={onCompleteOrder}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
