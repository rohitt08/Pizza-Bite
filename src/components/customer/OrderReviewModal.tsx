import React, { useState } from 'react';
import { X, User, Phone, ArrowLeft, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import type { CartItem, CustomerDetails } from '../../types';
import { formatINR, calculateLineTotal } from '../../utils/currency';
import { formatPhoneNumber } from '../../utils/formatters';

interface OrderReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToCart: () => void;
  cart: CartItem[];
  cartTotal: number;
  customerDetails: CustomerDetails;
  onEditCustomer: () => void;
  onConfirmOrder: () => Promise<void>;
}

export const OrderReviewModal: React.FC<OrderReviewModalProps> = ({
  isOpen,
  onClose,
  onBackToCart,
  cart,
  cartTotal,
  customerDetails,
  onEditCustomer,
  onConfirmOrder,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handlePlaceOrder = async () => {
    if (isSubmitting) return; // Prevent double click
    setIsSubmitting(true);
    try {
      // Simulate submission network latency (~900ms)
      await new Promise((resolve) => setTimeout(resolve, 900));
      await onConfirmOrder();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-stone-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100 bg-stone-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToCart}
              disabled={isSubmitting}
              className="p-1 rounded-lg hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
              title="Back to Cart"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base font-extrabold text-stone-900">Review Your Order</h2>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[72vh] overflow-y-auto">
          {/* Customer Summary Card */}
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 block">
                Pickup Customer
              </span>
              <div className="flex items-center gap-2 text-sm font-bold text-stone-900">
                <User className="w-4 h-4 text-stone-400" />
                <span>{customerDetails.name}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-stone-600">
                <Phone className="w-3.5 h-3.5 text-stone-400" />
                <span>{formatPhoneNumber(customerDetails.phone)}</span>
              </div>
            </div>

            <button
              onClick={onEditCustomer}
              disabled={isSubmitting}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-white border border-rose-200 px-3 py-1.5 rounded-xl shadow-2xs hover:bg-rose-50 transition-colors cursor-pointer"
            >
              Edit
            </button>
          </div>

          {/* Itemized Order List */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
              Order Items ({cart.length})
            </h3>
            <div className="bg-white rounded-2xl border border-stone-200/80 divide-y divide-stone-100 overflow-hidden">
              {cart.map((item) => {
                const lineTotal = calculateLineTotal(item.product.price, item.quantity);
                return (
                  <div key={item.product.id} className="p-3.5 flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-xs border border-emerald-600 flex items-center justify-center shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        </span>
                        <span className="font-bold text-stone-900 leading-snug break-words">
                          {item.product.name}
                        </span>
                      </div>
                      <div className="text-xs text-stone-700 mt-0.5">
                        {item.quantity} × {formatINR(item.product.price)}
                      </div>
                    </div>

                    <div className="font-extrabold text-stone-900 text-sm shrink-0">
                      {formatINR(lineTotal)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bill breakdown */}
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 space-y-2 text-xs">
            <div className="flex justify-between text-stone-700">
              <span>Item Total</span>
              <span className="font-semibold text-stone-900">{formatINR(cartTotal)}</span>
            </div>
            <div className="flex justify-between text-stone-700">
              <span>Stall Service & Packaging</span>
              <span className="text-emerald-800 font-semibold">FREE (₹0)</span>
            </div>
            <div className="flex justify-between text-stone-700">
              <span>GST (Included in item price)</span>
              <span className="text-stone-700 font-semibold">₹0 extra</span>
            </div>
            <div className="pt-2 border-t border-stone-200 flex justify-between items-center text-sm">
              <span className="font-bold text-stone-900">Grand Total</span>
              <span className="font-black text-rose-600 text-base">{formatINR(cartTotal)}</span>
            </div>
          </div>

          {/* Prototype disclaimer tag */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200/60 text-[11px] text-amber-800">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Frontend Prototype Demo</p>
              <p className="text-amber-700 leading-relaxed">
                Clicking place order will simulate a live order in frontend state and send it straight to the Staff POS Dashboard.
              </p>
            </div>
          </div>
        </div>

        {/* Footer / Submit Button */}
        <div className="p-5 border-t border-stone-100 bg-stone-50/50">
          <button
            onClick={handlePlaceOrder}
            disabled={isSubmitting}
            className={`w-full py-4 px-6 rounded-2xl font-black text-sm tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
              isSubmitting
                ? 'bg-rose-400 text-white cursor-wait'
                : 'bg-rose-600 hover:bg-rose-700 active:scale-98 text-white shadow-rose-600/30'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Sending to Stall Kitchen...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-rose-200" />
                <span>PLACE ORDER · {formatINR(cartTotal)}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
