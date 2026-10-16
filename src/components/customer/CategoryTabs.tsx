import React from 'react';
import type { ProductCategory } from '../../types';
import { Pizza, Sandwich, CupSoda, Sparkles } from 'lucide-react';

interface CategoryTabsProps {
  categories: ProductCategory[];
  selectedCategory: ProductCategory;
  onSelectCategory: (category: ProductCategory) => void;
  categoryCounts: Record<ProductCategory, number>;
}

// Icon helper
const getCategoryIcon = (category: ProductCategory) => {
  switch (category) {
    case 'Pizza':
      return <Pizza className="w-4 h-4" />;
    case 'Burgers':
      return <span className="text-sm leading-none">🍔</span>;
    case 'Sandwiches':
      return <Sandwich className="w-4 h-4" />;
    case 'Fries':
      return <span className="text-sm leading-none">🍟</span>;
    case 'Beverages':
      return <CupSoda className="w-4 h-4" />;
    default:
      return <Sparkles className="w-4 h-4" />;
  }
};

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  categoryCounts,
}) => {
  return (
    <div className="w-full overflow-x-auto scrollbar-none py-1 -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex items-center gap-2 min-w-max pb-1">
        {categories.map((category) => {
          const isSelected = selectedCategory === category;
          const count = categoryCounts[category] || 0;

          return (
            <button
              key={category}
              onClick={() => onSelectCategory(category)}
              className={`min-h-11 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all select-none cursor-pointer active:scale-95 ${
                isSelected
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25 ring-2 ring-rose-600/20'
                  : 'bg-white text-stone-700 hover:text-stone-900 hover:bg-stone-100 border border-stone-200/80 shadow-xs'
              }`}
            >
              <span className={isSelected ? 'text-white' : 'text-stone-500'}>
                {getCategoryIcon(category)}
              </span>
              <span>{category}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isSelected
                    ? 'bg-rose-700/80 text-rose-100'
                    : 'bg-stone-100 text-stone-700'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
