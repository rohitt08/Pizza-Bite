import React, { useEffect } from 'react';
import { Undo2, X, CheckCircle2 } from 'lucide-react';
import type { Order } from '../../types';

interface UndoToastProps {
  completedOrderId: string | null;
  orders: Order[];
  onUndo: (orderId: string) => void;
  onDismiss: () => void;
}

export const UndoToast: React.FC<UndoToastProps> = ({
  completedOrderId,
  orders,
  onUndo,
  onDismiss,
}) => {
  const completedOrder = orders.find((o) => o.id === completedOrderId);

  // Auto-dismiss toast after 7 seconds
  useEffect(() => {
    if (!completedOrderId) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 7000);
    return () => clearTimeout(timer);
  }, [completedOrderId, onDismiss]);

  if (!completedOrderId || !completedOrder) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
      <div className="bg-stone-900 border border-emerald-500/40 text-stone-100 rounded-2xl p-4 shadow-2xl flex items-center gap-4 max-w-md ring-1 ring-emerald-500/20">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <span>Order</span>
            <span className="font-mono text-emerald-300 font-extrabold">
              {completedOrder.orderNumber}
            </span>
            <span>completed</span>
          </div>
          <p className="text-[11px] text-stone-400 truncate mt-0.5">
            {completedOrder.customerName} · Handed over
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onUndo(completedOrderId)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-xs"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>UNDO</span>
          </button>

          <button
            onClick={onDismiss}
            className="p-1 rounded-lg text-stone-500 hover:text-stone-300 transition-colors cursor-pointer"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
