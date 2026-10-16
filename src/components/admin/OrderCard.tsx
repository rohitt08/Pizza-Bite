import React, { useState, useEffect } from 'react';
import { Phone, Clock, AlertCircle } from 'lucide-react';
import type { Order } from '../../types';
import { formatINR } from '../../utils/currency';
import { formatISTTime, formatPhoneNumber, getElapsedTimeString } from '../../utils/formatters';

interface OrderCardProps {
  order: Order;
  rushMode?: boolean;
  isOldestWaiting?: boolean;
  onAccept?: (orderId: string) => void;
  onComplete?: (orderId: string) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  isOldestWaiting = false,
  onComplete,
}) => {
  // Live ticking elapsed time
  const [elapsedTime, setElapsedTime] = useState(() => getElapsedTimeString(order.createdAt));

  useEffect(() => {
    const updateElapsed = () => {
      setElapsedTime(getElapsedTimeString(order.createdAt));
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 5000);
    return () => clearInterval(interval);
  }, [order.createdAt]);

  return (
    <div
      className={`bg-stone-900 rounded-2xl border transition-all duration-150 flex flex-col justify-between p-3.5 sm:p-4 ${
        isOldestWaiting
          ? 'border-amber-400 ring-2 ring-amber-400/30 shadow-lg shadow-amber-500/10'
          : 'border-amber-500/30 hover:border-amber-500/60'
      }`}
    >
      <div>
        {/* Card Header: Token & Elapsed */}
        <div className="flex items-start justify-between gap-2 border-b border-stone-800 pb-2.5 mb-2.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black font-mono tracking-tight text-2xl sm:text-3xl text-white">
                {order.orderNumber}
              </span>

              {isOldestWaiting && (
                <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-amber-400 text-stone-950 px-2 py-0.5 rounded-md animate-pulse">
                  <AlertCircle className="w-3 h-3" />
                  Oldest
                </span>
              )}
            </div>

            <span className="text-[11px] font-mono text-stone-400 block leading-tight mt-0.5">
              {order.billId}
            </span>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-xs font-bold rounded-lg px-2 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Clock className="w-3 h-3" />
              <span>{elapsedTime}</span>
            </span>
            <span className="text-[10px] text-stone-400 font-mono block mt-1">
              {formatISTTime(order.createdAt)}
            </span>
          </div>
        </div>

        {/* Customer Information */}
        <div className="flex items-center justify-between text-xs mb-3 text-stone-300">
          <div className="font-bold text-stone-100 truncate max-w-[170px]">
            {order.customerName}
          </div>
          <a
            href={`tel:${order.customerPhone}`}
            className="flex items-center gap-1 text-stone-400 hover:text-stone-200 font-mono text-[11px] transition-colors"
          >
            <Phone className="w-3 h-3 text-stone-500" />
            <span>{formatPhoneNumber(order.customerPhone)}</span>
          </a>
        </div>

        {/* Itemized Snapshot */}
        <div className="space-y-1.5 mb-3 rounded-xl bg-stone-950/60 p-2.5 border border-stone-800/80">
          {order.items.map((item, idx) => (
            <div
              key={`${item.productId}-${idx}`}
              className="flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-xs bg-stone-850 text-stone-200 font-black font-mono rounded px-1.5 py-0.2 shrink-0">
                  {item.quantity}×
                </span>
                <span className="text-stone-200 truncate font-medium">
                  {item.nameSnapshot}
                </span>
              </div>
              <span className="text-stone-400 font-mono text-[11px] shrink-0 ml-2">
                {formatINR(item.lineTotal)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer: Total & Single Action Button */}
      <div className="pt-2 border-t border-stone-800 flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold uppercase text-stone-500 block leading-none">
            Total
          </span>
          <span className="text-base sm:text-lg font-black text-white tracking-tight">
            {formatINR(order.total)}
          </span>
        </div>

        {/* Direct Complete Button for New Orders */}
        {onComplete && (
          <button
            onClick={() => onComplete(order.id)}
            className="py-3 px-5 sm:px-6 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400/40 min-h-[44px] flex items-center justify-center gap-1.5"
            title="Mark order as completed and move to Order History"
          >
            <span>MARK COMPLETED</span>
          </button>
        )}
      </div>
    </div>
  );
};
