import { useState, useEffect } from 'react';
import { OrderProvider } from './context/OrderContext';
import { CustomerView } from './pages/CustomerView';
import { AdminView } from './pages/AdminView';

export function App() {
  const getInitialRoute = (): 'customer' | 'admin' => {
    if (typeof window === 'undefined') return 'customer';
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (path.includes('/admin') || hash.includes('#admin')) {
      return 'admin';
    }
    return 'customer';
  };

  const [currentRoute, setCurrentRoute] = useState<'customer' | 'admin'>(getInitialRoute);

  // Sync with browser navigation (back/forward buttons)
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path.includes('/admin') || hash.includes('#admin')) {
        setCurrentRoute('admin');
      } else {
        setCurrentRoute('customer');
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  return (
    <OrderProvider>
      {currentRoute === 'admin' ? (
        <AdminView />
      ) : (
        <CustomerView />
      )}
    </OrderProvider>
  );
}

export default App;
