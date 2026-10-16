import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { formatINR } from '../../utils/currency';

interface StickyCartBarProps {
  totalItems: number;
  totalAmount: number;
  onOpenCart: () => void;
}

export const StickyCartBar: React.FC<StickyCartBarProps> = ({
  totalItems,
  totalAmount,
  onOpenCart,
}) => {
  if (totalItems <= 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-3 sm:p-4 pointer-events-none">
      <div className="max-w-xl mx-auto pointer-events-auto">
        <button
          onClick={onOpenCart}
          className="w-full bg-stone-950 text-white rounded-2xl p-3 sm:p-3.5 shadow-xl shadow-stone-950/25 border border-stone-800 flex items-center justify-between transition-all hover:bg-stone-900 active:scale-98 cursor-pointer group"
        >
          {/* Left: item count & badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                  {totalItems} {totalItems === 1 ? 'Item' : 'Items'} Added
                </span>
              </div>
              <p className="text-base font-extrabold text-white tracking-tight">
                {formatINR(totalAmount)}
              </p>
            </div>
          </div>

          {/* Right: View Cart Button */}
          <div className="flex items-center gap-2 bg-rose-600 group-hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition-colors shadow-xs">
            <span>View Cart</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </button>
      </div>
    </div>
  );
};
