import React, { useState } from 'react';
import { Utensils, Phone, User, ArrowRight, Sparkles } from 'lucide-react';
import type { CustomerDetails } from '../../types';
import { isValidIndianPhone } from '../../utils/formatters';

interface CustomerDetailsModalProps {
  initialDetails: CustomerDetails | null;
  onSave: (details: CustomerDetails) => void;
  canDismiss?: boolean;
  onClose?: () => void;
}

export const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
  initialDetails,
  onSave,
  canDismiss = false,
  onClose,
}) => {
  const [name, setName] = useState(initialDetails?.name || '');
  const [phone, setPhone] = useState(initialDetails?.phone || '');
  const [touched, setTouched] = useState({ name: false, phone: false });

  const isNameValid = name.trim().length >= 2;
  const isPhoneValid = isValidIndianPhone(phone);
  const isValid = isNameValid && isPhoneValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, phone: true });
    if (!isValid) return;

    onSave({
      name: name.trim(),
      phone: phone.replace(/\D/g, ''),
    });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and limit to 10 digits
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto overscroll-contain px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] bg-stone-950/70 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-stone-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Banner with Pizza Bite aesthetic */}
        <div className="bg-gradient-to-br from-rose-600 via-rose-600 to-rose-700 text-white p-6 sm:p-7 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-36 h-36 rounded-full bg-rose-500/30 blur-2xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-28 h-28 rounded-full bg-amber-400/20 blur-xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-white p-1 shadow-lg ring-4 ring-white/20 mb-4 flex items-center justify-center overflow-hidden">
              <img
                src="/logo.png"
                alt="Pizza Bite"
                className="w-full h-full object-cover rounded-xl"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
              <Utensils className="w-7 h-7 text-rose-600" />
            </div>

            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-xs text-white px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Quick Stall Ordering
              </span>
            </div>

            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Welcome to Pizza Bite!
            </h2>
            <p className="text-sm text-rose-100 mt-1 font-medium">
              Enter your name and mobile number to start ordering freshly prepared bites.
            </p>
          </div>

          {canDismiss && onClose && (
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 rounded-full w-11 h-11 flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-5">
          {/* Name Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
              Your Name <span className="text-rose-600">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-600">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => setTouched((p) => ({ ...p, name: true }))}
                placeholder="e.g. Rahul Sharma"
                autoFocus
                className={`w-full pl-10 pr-4 py-3 bg-stone-50 border rounded-xl text-stone-900 placeholder-stone-400 text-sm font-medium transition-all focus:bg-white focus:outline-hidden focus:ring-2 ${
                  touched.name && !isNameValid
                    ? 'border-rose-400 focus:ring-rose-500/20'
                    : 'border-stone-200 focus:border-rose-500 focus:ring-rose-500/10'
                }`}
              />
            </div>
            {touched.name && !isNameValid && (
              <p className="text-xs text-rose-600 mt-1.5 font-medium">
                Please enter at least 2 characters for your name.
              </p>
            )}
          </div>

          {/* 10-digit Indian Mobile Number */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
              10-Digit Mobile Number <span className="text-rose-600">*</span>
            </label>
            <div className="relative flex">
              <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-stone-200 bg-stone-100 text-stone-700 text-sm font-semibold select-none">
                🇮🇳 +91
              </span>
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-600">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={handlePhoneChange}
                  onBlur={() => setTouched((p) => ({ ...p, phone: true }))}
                  placeholder="98765 43210"
                  maxLength={10}
                  className={`w-full pl-9 pr-4 py-3 bg-stone-50 border rounded-r-xl text-stone-900 placeholder-stone-400 text-sm font-semibold tracking-wider transition-all focus:bg-white focus:outline-hidden focus:ring-2 ${
                    touched.phone && !isPhoneValid
                      ? 'border-rose-400 focus:ring-rose-500/20'
                      : 'border-stone-200 focus:border-rose-500 focus:ring-rose-500/10'
                  }`}
                />
              </div>
            </div>
            {touched.phone && !isPhoneValid ? (
              <p className="text-xs text-rose-600 mt-1.5 font-medium">
                Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.
              </p>
            ) : (
              <p className="text-[11px] text-stone-600 mt-1.5">
                Used strictly for calling your order when ready. No password or OTP needed.
              </p>
            )}
          </div>

          {/* Prominent Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={touched.name && touched.phone && !isValid}
              className={`w-full min-h-11 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-sm tracking-wide transition-all shadow-md active:scale-98 cursor-pointer ${
                isValid
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30'
                  : 'bg-stone-200 text-stone-400 hover:bg-stone-300 hover:text-stone-700 cursor-not-allowed'
              }`}
            >
              <span>Continue to Menu</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center">
            <span className="text-[11px] text-stone-600">
              By continuing, you are placing an instant pickup order at Pizza Bite Stall.
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};
