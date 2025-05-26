'use client';

import { useState } from 'react';
import { PaymentCard } from '../components/PaymentCard';
import { usePayments } from '../hooks/usePayments';

export default function PaymentsPage() {
  const [filter, setFilter] = useState('all');
  const { payments, stats, loading, error, refetch } = usePayments({ includeStats: true });
  
  // Filter payments by payment method if needed
  const filteredPayments = filter === 'all' 
    ? payments 
    : payments.filter(payment => payment.paymentMethod === filter);
  
  // Use stats from Stripe or calculate from filtered payments
  const totalSpent = stats?.totalSpent || 0;

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">Payments</h1>
          <p className="text-gray-600 mt-1">Loading your payment history...</p>
        </div>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">Payments</h1>
          <p className="text-gray-600 mt-1">View your payment history</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">Error loading payments: {error}</p>
          <button 
            onClick={refetch}
            className="mt-2 btn-primary btn-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Payments</h1>
        <p className="text-gray-600 mt-1">View your payment history</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-medium">Total Spent</h2>
          <p className="text-3xl font-bold mt-2">${totalSpent.toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-1">Lifetime</p>
        </div>
        
        <div className="card p-6">
          <h2 className="text-lg font-medium">Total Transactions</h2>
          <p className="text-3xl font-bold mt-2">{stats?.totalTransactions || 0}</p>
          <p className="text-sm text-gray-500 mt-1">Completed payments</p>
        </div>
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Payment History</h2>
          <div className="flex items-center space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-md border border-[var(--secondary)] bg-[var(--background)] px-3 py-1 text-sm"
            >
              <option value="all">All Payments</option>
              <option value="card">Card</option>
              <option value="cash">Cash</option>
              <option value="apple_pay">Apple Pay</option>
              <option value="google_pay">Google Pay</option>
            </select>
          </div>
        </div>
        
        <div className="space-y-4">
          {filteredPayments.length > 0 ? (
            filteredPayments.map((payment) => (
              <PaymentCard
                key={payment.id}
                id={payment.id}
                date={payment.date}
                service={payment.service}
                barberName={payment.barberName}
                amount={payment.amount}
                tip={payment.tip}
                total={payment.total}
                paymentMethod={payment.paymentMethod}
                status={payment.status}
                receiptUrl={payment.receiptUrl}
                appointmentId={payment.appointmentId}
                stripePaymentIntentId={payment.stripePaymentIntentId}
                barberImage={payment.barberImage}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No payment history found</p>
              <p className="text-sm text-gray-400 mt-1">
                Your completed payments will appear here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 