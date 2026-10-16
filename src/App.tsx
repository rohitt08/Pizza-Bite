import { useState, useEffect } from 'react';
import { OrderProvider } from './context/OrderContext';
import { CustomerView } from './pages/CustomerView';
import { AdminView } from './pages/AdminView';
import { AdminLogin } from './pages/AdminLogin';
import { isSupabaseConfigured, supabase } from './utils/supabase';

export function App() {
  const getInitialRoute = (): 'customer' | 'admin' => {
    if (typeof window === 'undefined') return 'customer';
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    if (path.includes('/u804') || hash.includes('#u804')) {
      return 'admin';
    }
    return 'customer';
  };

  const [currentRoute, setCurrentRoute] = useState<'customer' | 'admin'>(getInitialRoute);
  const [isStaff, setIsStaff] = useState(false);
  const [isCheckingStaff, setIsCheckingStaff] = useState(currentRoute === 'admin');

  // Sync with browser navigation (back/forward buttons)
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const nextRoute = path.includes('/u804') || hash.includes('#u804') ? 'admin' : 'customer';
      if (nextRoute !== currentRoute) setIsCheckingStaff(nextRoute === 'admin');
      setCurrentRoute(nextRoute);
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, [currentRoute]);

  useEffect(() => {
    if (currentRoute !== 'admin') return;
    let active = true;

    const checkStaffSession = async () => {
      if (!isSupabaseConfigured || !supabase) {
        if (active) {
          setIsStaff(false);
          setIsCheckingStaff(false);
        }
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        if (active) {
          setIsStaff(false);
          setIsCheckingStaff(false);
        }
        return;
      }

      const { data, error } = await supabase.rpc('is_staff_session');
      if (active) {
        setIsStaff(!error && data === true);
        setIsCheckingStaff(false);
      }
    };

    void checkStaffSession();
    const { data: { subscription } } = supabase?.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setIsStaff(false);
        setIsCheckingStaff(false);
      } else {
        window.setTimeout(() => void checkStaffSession(), 0);
      }
    }) ?? { data: { subscription: undefined } };

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, [currentRoute]);

  return (
    <OrderProvider>
      {currentRoute === 'admin' ? (
        isCheckingStaff ? (
          <div className="min-h-screen bg-stone-950" aria-label="Checking staff access" />
        ) : isStaff ? (
          <AdminView onLogout={() => {
            void (async () => {
              try {
                await supabase?.rpc('end_staff_session');
              } finally {
                await supabase?.auth.signOut();
                setIsStaff(false);
              }
            })();
          }} />
        ) : (
          <AdminLogin onLoginSuccess={() => setIsStaff(true)} />
        )
      ) : (
        <CustomerView />
      )}
    </OrderProvider>
  );
}

export default App;
