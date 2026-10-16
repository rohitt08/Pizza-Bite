import React, { useState, useMemo } from 'react';
import { Search, Sparkles } from 'lucide-react';
import type { PaymentMethod, ProductCategory } from '../types';
import { useOrderContext } from '../context/OrderContext';
import { CustomerHeader } from '../components/customer/CustomerHeader';
import { CustomerDetailsModal } from '../components/customer/CustomerDetailsModal';
import { CategoryTabs } from '../components/customer/CategoryTabs';
import { ProductCard } from '../components/customer/ProductCard';
import { StickyCartBar } from '../components/customer/StickyCartBar';
import { CartDrawer } from '../components/customer/CartDrawer';
import { OrderReviewModal } from '../components/customer/OrderReviewModal';
import { ReceiptModal } from '../components/customer/ReceiptModal';

interface CustomerViewProps {
  onSwitchToAdmin?: () => void;
}

const CATEGORIES: ProductCategory[] = [
  'All',
  'Pizza',
  'Burgers',
  'Sandwiches',
  'Fries',
  'Beverages',
];

export const CustomerView: React.FC<CustomerViewProps> = () => {
  const {
    products,
    cart,
    customerDetails,
    activeReceiptOrder,
    totalCartItems,
    cartTotal,
    setCustomerDetails,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    placeOrder,
    setActiveReceiptOrder,
  } = useOrderContext();

  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(!customerDetails);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<ProductCategory, number> = {
      All: products.length,
      Pizza: 0,
      Burgers: 0,
      Sandwiches: 0,
      Fries: 0,
      Beverages: 0,
    };
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Filter products by category & search query
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        selectedCategory === 'All' || p.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Map cart items for fast lookup in product cards
  const cartQuantityMap = useMemo(() => {
    const map = new Map<string, number>();
    cart.forEach((item) => {
      map.set(item.product.id, item.quantity);
    });
    return map;
  }, [cart]);

  // Handle flow transitions
  const handleProceedToReview = () => {
    if (!customerDetails) {
      setIsCustomerModalOpen(true);
      return;
    }
    setIsCartOpen(false);
    setIsReviewOpen(true);
  };

  const handleConfirmOrder = async (paymentMethod: PaymentMethod) => {
    const newOrder = await placeOrder(paymentMethod);
    if (newOrder) {
      setIsReviewOpen(false);
    }
  };

  const [isMenuPosterOpen, setIsMenuPosterOpen] = useState(false);

  return (
    <div className="min-h-screen min-h-[100dvh] bg-stone-50 pb-24 text-stone-900 selection:bg-rose-500 selection:text-white">
      {/* Customer Header */}
      <CustomerHeader
        customerDetails={customerDetails}
        onEditCustomer={() => setIsCustomerModalOpen(true)}
        onOpenCart={() => setIsCartOpen(true)}
        cartCount={totalCartItems}
      />

      {/* Main Content Area */}
      <main className="max-w-3xl mx-auto px-4 py-4 sm:py-6 space-y-5">
        {/* Stall Welcome Banner with Official Branding */}
        <div className="bg-gradient-to-r from-stone-950 via-stone-900 to-rose-950 rounded-3xl p-5 text-white shadow-xl border border-stone-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 rounded-full bg-rose-600/20 blur-2xl pointer-events-none"></div>
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest bg-amber-400 text-stone-950 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-stone-950" />
                  HOT · FRESH · DELICIOUS
                </span>
                <span className="text-xs text-rose-300 font-semibold">Good Food Good Mood</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight text-white">
                Pizza Makes Everything Better
              </h2>
              <p className="text-xs text-stone-300 font-medium mt-1">
                Order directly from your phone · Collect hot at the counter when token is ready
              </p>
            </div>

            <button
              onClick={() => setIsMenuPosterOpen(true)}
              className="self-start sm:self-auto shrink-0 min-h-11 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-750 text-amber-300 border border-amber-400/30 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              <span>View Stall Menu Card</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pizza, burger, sandwich, coffee..."
            className="w-full pl-10 pr-10 py-3 bg-white border border-stone-200/90 rounded-2xl text-sm font-medium text-stone-900 placeholder-stone-400 shadow-xs focus:outline-hidden focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 hover:text-stone-700"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <CategoryTabs
          categories={CATEGORIES}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          categoryCounts={categoryCounts}
        />

        {/* Product Grid */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm font-black uppercase tracking-wider text-stone-800">
              {selectedCategory === 'All' ? 'All Items' : selectedCategory} ({filteredProducts.length})
            </h2>
            {searchQuery && (
              <span className="text-xs text-stone-700">
                Found for "{searchQuery}"
              </span>
            )}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-stone-200 p-8 text-center text-stone-500">
              <p className="font-bold text-stone-800 text-sm">No items match your search</p>
              <p className="text-xs text-stone-600 mt-1">
                Try selecting a different category or clearing the search text.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="mt-4 px-4 py-2 bg-stone-900 text-white font-bold text-xs rounded-xl hover:bg-stone-800"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  quantity={cartQuantityMap.get(product.id) || 0}
                  onAdd={() => addToCart(product)}
                  onUpdateQuantity={(qty) => updateCartQuantity(product.id, qty)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Sticky Bottom Cart Bar */}
      <StickyCartBar
        totalItems={totalCartItems}
        totalAmount={cartTotal}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Step 1: Customer Details Modal */}
      {isCustomerModalOpen && (
        <CustomerDetailsModal
          initialDetails={customerDetails}
          canDismiss={!!customerDetails}
          onClose={() => setIsCustomerModalOpen(false)}
          onSave={(details) => {
            setCustomerDetails(details);
            setIsCustomerModalOpen(false);
          }}
        />
      )}

      {/* Step 3: Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        cartTotal={cartTotal}
        totalItems={totalCartItems}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
        onProceedToReview={handleProceedToReview}
      />

      {/* Step 4: Order Review & Placement Modal */}
      {customerDetails && (
        <OrderReviewModal
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          onBackToCart={() => {
            setIsReviewOpen(false);
            setIsCartOpen(true);
          }}
          cart={cart}
          cartTotal={cartTotal}
          customerDetails={customerDetails}
          onEditCustomer={() => {
            setIsReviewOpen(false);
            setIsCustomerModalOpen(true);
          }}
          onConfirmOrder={handleConfirmOrder}
        />
      )}

      {/* Step 5: Receipt Confirmation Modal */}
      {activeReceiptOrder && (
        <ReceiptModal
          order={activeReceiptOrder}
          onBackToHome={() => setActiveReceiptOrder(null)}
        />
      )}

      {/* Official Menu Poster Modal */}
      {isMenuPosterOpen && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto overscroll-contain px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] bg-stone-950/85 backdrop-blur-xs">
          <div className="bg-stone-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-stone-800 animate-in zoom-in-95 duration-200">
            <div className="px-4 py-3 border-b border-stone-800 flex items-center justify-between text-white bg-stone-925">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span className="font-extrabold text-xs uppercase tracking-wider text-white">
                  Pizza Bite Menu Board
                </span>
              </div>
              <button
                onClick={() => setIsMenuPosterOpen(false)}
                className="w-7 h-7 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-3 bg-stone-950 max-h-[80vh] max-h-[80dvh] overflow-y-auto overscroll-contain">
              <img
                src="/images/menu_poster.jpg"
                alt="Pizza Bite Official Menu Board"
                className="w-full h-auto rounded-xl object-contain shadow-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
