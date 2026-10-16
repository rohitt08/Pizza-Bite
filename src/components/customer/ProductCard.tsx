import React, { useState } from 'react';
import { Plus, Minus, Utensils } from 'lucide-react';
import type { Product } from '../../types';
import { formatINR } from '../../utils/currency';

interface ProductCardProps {
  product: Product;
  quantity: number;
  onAdd: () => void;
  onUpdateQuantity: (quantity: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  quantity,
  onAdd,
  onUpdateQuantity,
}) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={`group bg-white rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
        product.available
          ? 'border-stone-200/80 shadow-xs hover:shadow-md hover:border-stone-300'
          : 'border-stone-200 bg-stone-50/80 opacity-70 cursor-not-allowed'
      }`}
    >
      {/* Top Media & Badges */}
      <div className="relative aspect-4/3 w-full bg-stone-100 overflow-hidden">
        {!imageError ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            onError={() => setImageError(true)}
            className={`w-full h-full object-cover transition-transform duration-300 ${
              product.available ? 'group-hover:scale-105' : 'grayscale'
            }`}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-stone-100 to-rose-50 text-stone-400 p-4">
            <Utensils className="w-8 h-8 text-rose-300 mb-1" />
            <span className="text-xs font-semibold text-stone-500">{product.category}</span>
          </div>
        )}

        {/* Veg icon tag */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <div className="w-4 h-4 bg-white/95 rounded-sm border border-emerald-600 flex items-center justify-center p-0.5 shadow-xs" title="100% Vegetarian">
            <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
          </div>
        </div>

        {/* Feature badge or Sold Out badge */}
        <div className="absolute top-2.5 right-2.5 z-10 flex flex-col gap-1 items-end">
          {!product.available ? (
            <span className="bg-stone-900/90 text-white font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs">
              Sold Out
            </span>
          ) : product.badge ? (
            <span className="bg-rose-600/95 backdrop-blur-xs text-white font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs">
              {product.badge}
            </span>
          ) : null}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between">
        <div>
          <div className="min-h-[2.6rem] sm:min-h-[2.85rem] mb-1.5 flex items-start">
            <h3 className="font-bold text-stone-900 text-sm sm:text-base leading-tight group-hover:text-rose-600 transition-colors line-clamp-2">
              {product.name}
            </h3>
          </div>

          {product.description && (
            <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed mb-3 min-h-[2.2rem]">
              {product.description}
            </p>
          )}
        </div>

        {/* Price & Action Button */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-100 mt-1">
          <div>
            <span className="text-xs text-stone-600 font-medium block leading-none">Price</span>
            <span className="text-base sm:text-lg font-extrabold text-stone-900 tracking-tight">
              {formatINR(product.price)}
            </span>
          </div>

          <div>
            {!product.available ? (
              <button
                disabled
                className="px-3 py-1.5 rounded-xl bg-stone-200 text-stone-400 text-xs font-semibold cursor-not-allowed select-none"
              >
                Unavailable
              </button>
            ) : quantity === 0 ? (
              <button
                onClick={onAdd}
                className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold tracking-wide shadow-xs shadow-rose-600/20 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ADD</span>
              </button>
            ) : (
              <div className="flex items-center bg-stone-900 text-white rounded-xl p-0.5 shadow-sm">
                <button
                  onClick={() => onUpdateQuantity(quantity - 1)}
                  className="w-7 h-7 flex items-center justify-center hover:bg-stone-800 rounded-lg text-white transition-colors cursor-pointer active:scale-90"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-7 text-center font-bold text-xs tabular-nums text-white">
                  {quantity}
                </span>
                <button
                  onClick={() => onUpdateQuantity(quantity + 1)}
                  className="w-7 h-7 flex items-center justify-center hover:bg-stone-800 rounded-lg text-white transition-colors cursor-pointer active:scale-90"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
