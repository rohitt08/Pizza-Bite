import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, LogOut } from 'lucide-react';

interface DashboardHeaderProps {
  soundEnabled: boolean;
  onToggleSound: () => void;
  onLogout?: () => void;
  onSwitchToCustomer?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  soundEnabled,
  onToggleSound,
  onLogout,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  // Live ticking clock in Asia/Kolkata timezone
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setCurrentDate(
        now.toLocaleDateString('en-IN', {
          timeZone: 'Asia/Kolkata',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-stone-900 border-b border-stone-800 text-stone-100 sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Status */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center font-black text-white shadow-md shadow-rose-900/30 overflow-hidden ring-1 ring-rose-500/30">
            <img
              src="/logo.png"
              alt="Pizza Bite"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-normal text-white uppercase font-sans">
                Pizza Bite
              </h1>
            </div>
            
            {/* Live Indicator & Clock */}
            <div className="flex items-center gap-2.5 text-xs text-stone-400 mt-0.5 font-medium">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Live Orders</span>
              </span>
              <span>·</span>
              <span className="font-mono text-stone-300">
                {currentTime} <span className="text-stone-500 hidden sm:inline">IST ({currentDate})</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className={`p-2 rounded-xl text-xs font-semibold transition-colors border cursor-pointer ${
              soundEnabled
                ? 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700'
                : 'bg-stone-900 hover:bg-stone-800 text-stone-500 border-stone-800'
            }`}
            title={soundEnabled ? 'Order sound is ON (Click to Mute)' : 'Order sound is MUTED (Click to Unmute)'}
            aria-label="Toggle Sound"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-stone-500" />
            )}
          </button>



          {/* Staff Logout / Lock Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-stone-300 bg-stone-850 hover:bg-stone-800 hover:text-white border border-stone-700/80 transition-all cursor-pointer active:scale-95"
              title="Lock Admin Dashboard"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Lock POS</span>
              <span className="sm:hidden">Lock</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
