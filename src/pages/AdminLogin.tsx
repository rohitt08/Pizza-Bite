import React, { useState } from 'react';
import { Lock, KeyRound, ArrowRight, ShieldAlert, ArrowLeft } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: () => void;
  onBackToCustomer?: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onBackToCustomer }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || '[REDACTED]';

  const handleKeyClick = (digit: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + digit);
      setError('');
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin) {
      setError('Please enter your staff PIN');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      if (pin === ADMIN_PIN) {
        sessionStorage.setItem('pb_admin_auth', 'true');
        onLoginSuccess();
      } else {
        setError('Incorrect PIN. Access restricted to staff only.');
        setPin('');
      }
      setIsSubmitting(false);
    }, 250);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-center items-center px-4 py-8 selection:bg-rose-600 selection:text-white">
      <div className="w-full max-w-sm bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-rose-600/10 border border-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight text-white">Staff POS Portal</h2>
          <p className="text-xs text-stone-400">
            Enter authorized staff PIN to access order queue and controls.
          </p>
        </div>

        {/* PIN Indicators */}
        <div className="flex justify-center items-center gap-3 py-2">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                pin.length > idx
                  ? 'bg-rose-500 scale-110 shadow-sm shadow-rose-500/50'
                  : 'bg-stone-800 border border-stone-700'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-center gap-2 text-rose-400 text-xs font-semibold animate-shake">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Mobile-Friendly Numpad Grid */}
        <div className="grid grid-cols-3 gap-2.5 pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyClick(digit)}
              className="h-14 rounded-2xl bg-stone-800 hover:bg-stone-700/80 active:bg-rose-600 active:text-white text-xl font-bold text-stone-200 transition-all cursor-pointer shadow-sm active:scale-95 flex items-center justify-center"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-14 rounded-2xl bg-stone-850 hover:bg-stone-800 text-xs font-bold text-stone-400 uppercase tracking-wider transition-all cursor-pointer active:scale-95 flex items-center justify-center"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleKeyClick('0')}
            className="h-14 rounded-2xl bg-stone-800 hover:bg-stone-700/80 active:bg-rose-600 active:text-white text-xl font-bold text-stone-200 transition-all cursor-pointer shadow-sm active:scale-95 flex items-center justify-center"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-stone-850 hover:bg-stone-800 text-xs font-bold text-stone-400 uppercase tracking-wider transition-all cursor-pointer active:scale-95 flex items-center justify-center"
          >
            Del
          </button>
        </div>

        {/* Submit Action */}
        <button
          type="button"
          disabled={pin.length < 4 || isSubmitting}
          onClick={() => handleSubmit()}
          className="w-full py-3.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:bg-stone-800 disabled:text-stone-600 text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-900/30 transition-all cursor-pointer active:scale-95 disabled:cursor-not-allowed"
        >
          <KeyRound className="w-4 h-4" />
          <span>{isSubmitting ? 'Verifying...' : 'Unlock Dashboard'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Optional Exit to Customer Menu */}
        {onBackToCustomer && (
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={onBackToCustomer}
              className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-300 transition-colors cursor-pointer py-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Customer Menu</span>
            </button>
          </div>
        )}

        <div className="text-center pt-1 border-t border-stone-800">
          <p className="text-[10px] text-stone-600 font-mono">
            Authorized staff access only
          </p>
        </div>
      </div>
    </div>
  );
};
