import { useState, useEffect } from 'react';
import { OrderProvider } from './context/OrderContext';
import { CustomerView } from './pages/CustomerView';
import { AdminView } from './pages/AdminView';
import { AdminLogin } from './pages/AdminLogin';
import { isSupabaseConfigured, supabase } from './utils/supabase';

type AppRoute = 'customer' | 'admin' | 'not-found';

function resolveRoute(location: Location): AppRoute {
  const path = location.pathname.replace(/\/+$/, '').toLowerCase() || '/';
  const hash = location.hash.toLowerCase();
  if (path === '/' && (!hash || hash === '#')) return 'customer';
  if (path === '/admin' || path === '/u804' || hash === '#admin' || hash === '#u804') return 'admin';
  return 'not-found';
}

export function App() {
  const [currentRoute, setCurrentRoute] = useState<AppRoute>(() =>
    typeof window === 'undefined' ? 'customer' : resolveRoute(window.location)
  );
  const [isStaff, setIsStaff] = useState(false);
  const [isCheckingStaff, setIsCheckingStaff] = useState(currentRoute === 'admin');

  // Sync with browser navigation (back/forward buttons)
  useEffect(() => {
    const handleLocationChange = () => {
      const nextRoute = resolveRoute(window.location);
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

      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !sessionData.session) {
          if (active) {
            setIsStaff(false);
            setIsCheckingStaff(false);
          }
          return;
        }

        const { data, error } = await supabase.rpc('is_staff_session');
        if (active) setIsStaff(!error && data === true);
      } catch {
        if (active) setIsStaff(false);
      } finally {
        if (active) setIsCheckingStaff(false);
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
        currentRoute === 'customer' ? (
          <CustomerView />
        ) : (
          <main className="min-h-screen bg-stone-950 text-white flex items-center justify-center px-6 text-center">
            <div>
              <h1 className="text-2xl font-black">Page not found</h1>
              <p className="mt-2 text-sm text-stone-400">That Pizza Bite page does not exist.</p>
              <a href="/" className="inline-flex mt-5 px-4 py-2 rounded-lg bg-rose-600 font-bold">Back to menu</a>
            </div>
          </main>
        )
      )}
    </OrderProvider>
  );
}

export default App;
