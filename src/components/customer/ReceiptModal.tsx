import React from 'react';
import { CheckCircle2, Printer, ArrowLeft, Clock } from 'lucide-react';
import type { Order } from '../../types';
import { formatINR } from '../../utils/currency';
import { formatISTDateTime, formatPhoneNumber } from '../../utils/formatters';

interface ReceiptModalProps {
  order: Order;
  onBackToHome: () => void;
  onOpenAdmin?: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  order,
  onBackToHome,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-sm sm:max-w-md rounded-3xl shadow-2xl border border-stone-100 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Screen-only top celebration banner */}
        <div className="no-print bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 sm:p-5 text-center shrink-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-1.5 backdrop-blur-xs ring-4 ring-white/20">
            <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">Order Confirmed!</h2>
          <p className="text-[11px] sm:text-xs text-emerald-100 mt-0.5">
            Your order has reached the Pizza Bite kitchen stall.
          </p>
        </div>

        {/* Printable Receipt Paper Container - Scrollable on small screens */}
        <div id="printable-receipt" className="p-4 sm:p-6 bg-white text-stone-900 overflow-y-auto flex-1">
          {/* Receipt Header */}
          <div className="text-center pb-4 border-b-2 border-dashed border-stone-300">
            <h1 className="text-2xl font-black tracking-tight text-stone-900 uppercase">
              PIZZA BITE
            </h1>
            <p className="text-xs font-semibold text-stone-600 uppercase tracking-widest mt-0.5">
              Fast Food Stall · Freshly Baked
            </p>
            <p className="text-[11px] text-stone-500 mt-1">
              Instagram: @thepizzabitee · IST
            </p>

            {/* Token Order Number Callout */}
            <div className="mt-4 p-3 bg-stone-50 rounded-2xl border border-stone-200">
              <span className="text-[10px] font-black uppercase tracking-widest text-stone-600 block">
                Pickup Token Number
              </span>
              <span className="text-3xl font-black text-rose-600 tracking-tight font-mono">
                {order.orderNumber}
              </span>
              <div className="mt-1 flex items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md">
                  <Clock className="w-3 h-3" />
                  STATUS: {order.status}
                </span>
              </div>
            </div>
          </div>

          {/* Metadata Section */}
          <div className="py-3.5 border-b border-dashed border-stone-200 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-stone-700">Bill ID:</span>
              <span className="font-mono font-bold text-stone-800">{order.billId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-700">Date & Time:</span>
              <span className="font-semibold text-stone-800">{formatISTDateTime(order.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-700">Customer:</span>
              <span className="font-bold text-stone-900">{order.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-700">Mobile:</span>
              <span className="font-semibold text-stone-800">{formatPhoneNumber(order.customerPhone)}</span>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="py-3.5 border-b-2 border-dashed border-stone-300">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-stone-600 font-bold uppercase border-b border-stone-200">
                  <th className="text-left pb-1.5">Item</th>
                  <th className="text-center pb-1.5">Qty</th>
                  <th className="text-right pb-1.5">Rate</th>
                  <th className="text-right pb-1.5">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium">
                {order.items.map((item, idx) => (
                  <tr key={`${item.productId}-${idx}`} className="pt-1.5">
                    <td className="py-2 text-stone-900 font-bold pr-2 leading-tight">
                      {item.nameSnapshot}
                    </td>
                    <td className="py-2 text-center text-stone-700">{item.quantity}</td>
                    <td className="py-2 text-right text-stone-700">{formatINR(item.unitPrice)}</td>
                    <td className="py-2 text-right text-stone-900 font-bold">{formatINR(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="py-3.5 space-y-1 text-xs">
            <div className="flex justify-between text-stone-700">
              <span>Item Subtotal</span>
              <span className="font-bold">{formatINR(order.total)}</span>
            </div>
            <div className="flex justify-between text-stone-700">
              <span>Taxes & GST (Included)</span>
              <span>₹0</span>
            </div>
            <div className="flex justify-between text-base font-black text-stone-900 pt-2 border-t border-stone-200">
              <span>GRAND TOTAL</span>
              <span className="text-rose-600">{formatINR(order.total)}</span>
            </div>
          </div>

          {/* Receipt Footer */}
          <div className="text-center pt-3 text-[11px] text-stone-500 border-t border-dashed border-stone-200">
            <p className="font-semibold text-stone-700">Thank you for dining with Pizza Bite!</p>
            <p className="mt-0.5">Please show token {order.orderNumber} at the counter for collection.</p>
            <p className="text-[10px] text-stone-400 mt-2 font-mono">
              [Asia/Kolkata]
            </p>
          </div>
        </div>

        {/* Screen-only Actions */}
        <div className="no-print p-4 sm:p-5 bg-stone-50 border-t border-stone-100 space-y-2.5 shrink-0">
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex-1 py-3 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer min-h-[44px]"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt</span>
            </button>
            <button
              onClick={onBackToHome}
              className="flex-1 py-3 px-4 rounded-xl border border-stone-300 hover:bg-stone-200/80 text-stone-700 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Order More</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
