import React from 'react';
import { useOrderContext } from '../context/OrderContext';
import { DashboardHeader } from '../components/admin/DashboardHeader';
import { SummaryCounters } from '../components/admin/SummaryCounters';
import { ActiveQueues } from '../components/admin/ActiveQueues';
import { OrderHistory } from '../components/admin/OrderHistory';
import { UndoToast } from '../components/admin/UndoToast';

interface AdminViewProps {
  onLogout?: () => void;
  onSwitchToCustomer?: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onLogout, onSwitchToCustomer }) => {
  const {
    orders,
    soundEnabled,
    lastCompletedOrderId,
    orderActionError,
    toggleSound,
    acceptOrder,
    completeOrder,
    undoCompleteOrder,
    deleteOrder,
    dismissUndo,
    dismissOrderActionError,
    clearOrderHistory,
  } = useOrderContext();

  // Active new orders vs completed history
  const newOrders = orders.filter((o) => o.status === 'NEW');
  const acceptedOrders = orders.filter((o) => o.status === 'ACCEPTED');
  const completedOrders = orders.filter((o) => o.status === 'COMPLETED');

  return (
    <div className="min-h-screen min-h-[100dvh] bg-stone-950 text-stone-100 flex flex-col selection:bg-rose-600 selection:text-white">
      {/* POS Header */}
      <DashboardHeader
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        onLogout={onLogout}
        onSwitchToCustomer={onSwitchToCustomer}
      />

      {/* Main Dashboard Container - Mobile First Phone Ergonomics */}
      <main className="max-w-4xl mx-auto w-full px-3.5 sm:px-6 py-4 sm:py-6 flex-1 space-y-5">
        {orderActionError && (
          <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-rose-500/40 bg-rose-950/50 px-4 py-3 text-sm text-rose-200">
            <span>{orderActionError}</span>
            <button type="button" onClick={dismissOrderActionError} className="font-bold text-rose-100 underline underline-offset-2">Dismiss</button>
          </div>
        )}

        {/* 1. Summary Counters */}
        <SummaryCounters
          newCount={newOrders.length}
          acceptedCount={acceptedOrders.length}
          completedCount={completedOrders.length}
        />

        {/* 2. New Orders List with Direct Complete Action */}
        <ActiveQueues
          newOrders={newOrders}
          acceptedOrders={acceptedOrders}
          onAcceptOrder={acceptOrder}
          onCompleteOrder={completeOrder}
        />

        {/* 3. Completed Order History with UNDO, DELETE ORDER & DELETE ALL ORDERS */}
        <OrderHistory
          completedOrders={completedOrders}
          onClearHistory={clearOrderHistory}
          onUndoOrder={undoCompleteOrder}
          onDeleteOrder={deleteOrder}
        />
      </main>

      {/* Undo Toast for Accidental Completion */}
      <UndoToast
        completedOrderId={lastCompletedOrderId}
        orders={orders}
        onUndo={undoCompleteOrder}
        onDismiss={dismissUndo}
      />
    </div>
  );
};
