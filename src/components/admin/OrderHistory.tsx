import React, { useState } from 'react';
import { History, Search, ChevronDown, ChevronUp, CheckCircle2, Phone, Trash2, Undo2 } from 'lucide-react';
import type { Order } from '../../types';
import { formatINR } from '../../utils/currency';
import { formatISTTime, formatPhoneNumber } from '../../utils/formatters';

interface OrderHistoryProps {
  completedOrders: Order[];
  onClearHistory?: () => void;
  onUndoOrder?: (orderId: string) => void;
  onDeleteOrder?: (orderId: string) => void;
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({
  completedOrders,
  onClearHistory,
  onUndoOrder,
  onDeleteOrder,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom Card Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'single' | 'all';
    orderId?: string;
    orderNumber?: string;
  }>({
    isOpen: false,
    type: 'single',
  });

  // Filter completed orders by orderNumber, billId, or phone
  const filteredOrders = completedOrders.filter((order) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      order.orderNumber.toLowerCase().includes(q) ||
      order.billId.toLowerCase().includes(q) ||
      order.customerPhone.includes(q) ||
      order.customerName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden transition-all shadow-md">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-stone-850/80 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <History className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                Order History
              </h3>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {completedOrders.length} Completed
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-stone-400">
          <span className="text-xs font-semibold hidden sm:inline">
            {isOpen ? 'Hide History' : 'View History'}
          </span>
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {/* Collapsible Body */}
      {isOpen && (
        <div className="p-5 border-t border-stone-800 bg-stone-925 space-y-4">
          {/* Search Filter & Clean Database Action */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Order ID (PB-1038), Bill ID, or Phone..."
                className="w-full pl-9 pr-4 py-2 bg-stone-900 border border-stone-700/80 rounded-xl text-xs text-stone-200 placeholder-stone-500 focus:outline-hidden focus:border-stone-500 focus:ring-1 focus:ring-stone-500 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200 text-xs font-bold cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {onClearHistory && completedOrders.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setConfirmModal({
                    isOpen: true,
                    type: 'all',
                  });
                }}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 shadow-md shadow-rose-900/30"
                title="Permanently remove all completed orders at once"
              >
                <Trash2 className="w-3.5 h-3.5 text-white" />
                <span>DELETE ALL ORDERS</span>
              </button>
            )}
          </div>

          {/* List of completed orders */}
          {filteredOrders.length === 0 ? (
            <div className="py-8 text-center text-stone-500 text-xs">
              No matching completed orders found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[550px] overflow-y-auto pr-1">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-stone-900 border border-stone-800 rounded-2xl p-3.5 hover:border-stone-700 transition-colors text-xs flex flex-col justify-between shadow-sm"
                >
                  <div>
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2 border-b border-stone-800 pb-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-base text-white">
                            {order.orderNumber}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            COMPLETED
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-stone-400 block mt-0.5">
                          {order.billId}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="font-black text-sm text-stone-100">
                          {formatINR(order.total)}
                        </span>
                      </div>
                    </div>

                    {/* Customer */}
                    <div className="flex items-center justify-between text-stone-300 mb-2 font-medium">
                      <span className="truncate max-w-[150px]">{order.customerName}</span>
                      <span className="flex items-center gap-1 text-stone-400 font-mono text-[11px]">
                        <Phone className="w-3 h-3 text-stone-500" />
                        {formatPhoneNumber(order.customerPhone)}
                      </span>
                    </div>

                    {/* Items */}
                    <div className="bg-stone-950/70 rounded-xl p-2.5 mb-2.5 text-stone-300 space-y-1">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-[11px]">
                          <span>
                            {item.quantity}× {item.nameSnapshot}
                          </span>
                          <span className="text-stone-400 font-mono">{formatINR(item.lineTotal)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Timestamps & Actions */}
                  <div className="pt-2 border-t border-stone-800/80 space-y-2">
                    <div className="text-[10px] text-stone-400 flex justify-between items-center font-mono">
                      <span>Ordered: {formatISTTime(order.createdAt)}</span>
                      {order.completedAt && (
                        <span className="text-emerald-400">
                          Done: {formatISTTime(order.completedAt)}
                        </span>
                      )}
                    </div>

                    {/* Card Actions: UNDO and DELETE ORDER */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {onUndoOrder && (
                        <button
                          type="button"
                          onClick={() => onUndoOrder(order.id)}
                          className="py-2.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                          title="Move order back to New Orders"
                        >
                          <Undo2 className="w-3.5 h-3.5 text-amber-400" />
                          <span>UNDO</span>
                        </button>
                      )}

                      {onDeleteOrder && (
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmModal({
                              isOpen: true,
                              type: 'single',
                              orderId: order.id,
                              orderNumber: order.orderNumber,
                            });
                          }}
                          className="py-2.5 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 hover:text-rose-100 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                          title="Permanently delete this order"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          <span>DELETE ORDER</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Custom Confirmation Modal Card */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-base font-black text-white uppercase tracking-wider">
                {confirmModal.type === 'all' ? 'Delete All Orders?' : 'Delete Order?'}
              </h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                {confirmModal.type === 'all'
                  ? `Permanently delete all ${completedOrders.length} completed orders from history and database to free up storage?`
                  : `Permanently delete order ${confirmModal.orderNumber}? This action cannot be undone.`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: false, type: 'single' })}
                className="py-3 px-4 rounded-xl border border-stone-700 bg-stone-850 hover:bg-stone-800 text-stone-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer min-h-[44px]"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmModal.type === 'all') {
                    onClearHistory?.();
                  } else if (confirmModal.orderId) {
                    onDeleteOrder?.(confirmModal.orderId);
                  }
                  setConfirmModal({ isOpen: false, type: 'single' });
                }}
                className="py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer active:scale-95 shadow-md shadow-rose-900/30 min-h-[44px]"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
