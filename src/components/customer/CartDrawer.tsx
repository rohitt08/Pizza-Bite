import React from 'react';
import { X, Plus, Minus, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import type { CartItem } from '../../types';
import { formatINR, calculateLineTotal } from '../../utils/currency';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  cartTotal: number;
  totalItems: number;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedToReview: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  cartTotal,
  totalItems,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToReview,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-950/60 backdrop-blur-xs">
      <div
        className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
      >
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 leading-none">Your Cart</h2>
              <span className="text-xs text-stone-500 font-medium">
                {totalItems} {totalItems === 1 ? 'item' : 'items'} selected
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close cart"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cart Item List */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3.5 divide-y divide-stone-100">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-stone-100 text-stone-400 mx-auto flex items-center justify-center mb-3">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-stone-800 text-base">Your cart is empty</h3>
              <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                Explore our menu to add freshly prepared pizzas, burgers, sandwiches & beverages.
              </p>
              <button
                onClick={onClose}
                className="mt-5 px-5 py-2.5 rounded-xl bg-stone-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-stone-800 cursor-pointer"
              >
                Browse Menu
              </button>
            </div>
          ) : (
            cart.map((item) => {
              const lineTotal = calculateLineTotal(item.product.price, item.quantity);

              return (
                <div key={item.product.id} className="pt-3.5 first:pt-0 flex items-center justify-between gap-3">
                  {/* Thumbnail & Item name */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-13 h-13 rounded-xl object-cover bg-stone-100 shrink-0 border border-stone-200/60"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-xs border border-emerald-600 flex items-center justify-center shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        </span>
                        <h4 className="font-bold text-stone-900 text-sm leading-snug break-words">
                          {item.product.name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-stone-700">
                        <span>{formatINR(item.product.price)} each</span>
                        <span>·</span>
                        <span className="font-bold text-stone-900">{formatINR(lineTotal)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity Stepper & Remove */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center bg-stone-100 rounded-xl p-1 border border-stone-200">
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center hover:bg-white rounded-lg text-stone-700 hover:text-stone-900 transition-colors cursor-pointer active:scale-90"
                        title="Decrease"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-bold text-xs tabular-nums text-stone-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center hover:bg-white rounded-lg text-stone-700 hover:text-stone-900 transition-colors cursor-pointer active:scale-90"
                        title="Increase"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.product.id)}
                      className="w-8 h-8 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Cart Footer */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-stone-100 bg-stone-50/70 space-y-3.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-stone-600">Subtotal</span>
              <span className="font-extrabold text-stone-900 text-lg">
                {formatINR(cartTotal)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl border border-stone-300 text-stone-700 font-bold text-xs uppercase tracking-wider hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Add More Items
              </button>
              <button
                onClick={onProceedToReview}
                className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20 transition-all cursor-pointer"
              >
                <span>Review Order</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
