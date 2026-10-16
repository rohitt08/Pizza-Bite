import React from 'react';
import { ShoppingBag, User } from 'lucide-react';
import type { CustomerDetails } from '../../types';

interface CustomerHeaderProps {
  customerDetails: CustomerDetails | null;
  onEditCustomer: () => void;
  onOpenCart: () => void;
  cartCount: number;
}

export const CustomerHeader: React.FC<CustomerHeaderProps> = ({
  customerDetails,
  onEditCustomer,
  onOpenCart,
  cartCount,
}) => {
  return (
    <header className="sticky top-0 z-30 pt-[env(safe-area-inset-top)] bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
      {/* Main Header */}
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
        {/* Brand identity */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center shadow-md shadow-rose-600/20 overflow-hidden ring-2 ring-rose-100">
            <img
              src="/logo.png"
              alt="Pizza Bite"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback text if image fails
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-stone-900 leading-none">
                Pizza Bite
              </h1>
              <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">
                Fresh Fast Food
              </span>
            </div>
            <p className="text-xs text-stone-700 font-medium mt-0.5 flex items-center gap-2">
              <span>Fast Food Stall</span>
              <span className="w-1 h-1 rounded-full bg-stone-300"></span>
              <a
                href="https://instagram.com/thepizzabitee"
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center hover:text-rose-600 transition-colors"
              >
                @thepizzabitee
              </a>
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {customerDetails && (
            <button
              onClick={onEditCustomer}
              className="min-h-11 flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200/80 px-2.5 py-2 rounded-lg border border-stone-200 transition-colors"
              title="Change customer details"
            >
              <User className="w-3.5 h-3.5 text-rose-600" />
              <span className="font-medium max-w-[80px] truncate hidden sm:inline">
                {customerDetails.name}
              </span>
              <span className="text-[11px] text-stone-400 sm:hidden">Edit</span>
            </button>
          )}

          <button
            onClick={onOpenCart}
            aria-label="View Cart"
            className="relative min-w-11 min-h-11 p-2.5 rounded-xl bg-stone-900 text-white hover:bg-stone-800 transition-all shadow-sm active:scale-95 shrink-0"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white animate-scale-in">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
