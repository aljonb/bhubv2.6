'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { PaymentCard } from '../components/PaymentCard';
import { usePayments } from '../hooks/usePayments';

const BARBER_EMAIL = 'bushatia777@gmail.com';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: string;
  description: string | null;
  payment_method: string;
}

export default function PaymentsPage() {
  const { user, isLoaded } = useUser();
  const [filter, setFilter] = useState('all');
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [allPaymentsLoading, setAllPaymentsLoading] = useState(false);
  const [allPaymentsError, setAllPaymentsError] = useState<string | null>(null);
  
  const { payments, stats, loading, error, refetch } = usePayments({ includeStats: true });
  
  // Check if user is barber
  const userEmail = user?.emailAddresses[0]?.emailAddress;
  const isBarber = userEmail === BARBER_EMAIL;

  // Fetch all payments for barber view
  useEffect(() => {
    if (isBarber) {
      setAllPaymentsLoading(true);
      fetch('/api/all')
        .then(res => res.json())
        .then(data => {
          setAllPayments(data.payments || []);
          setAllPaymentsLoading(false);
        })
        .catch(err => {
          setAllPaymentsError(err.message);
          setAllPaymentsLoading(false);
        });
    }
  }, [isBarber]);

  // Loading state
  if (!isLoaded || loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">Payments</h1>
          <p className="text-gray-600 mt-1">Loading...</p>
        </div>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // Require authentication
  if (!user) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">Authentication Required</h1>
          <p className="text-gray-600 mt-1">Please sign in to view your payments.</p>
        </div>
      </div>
    );
  }

  // Filter payments by payment method if needed (for client view)
  const filteredPayments = filter === 'all' 
    ? payments 
    : payments.filter(payment => payment.paymentMethod === filter);
  
  // Use stats from Stripe or calculate from filtered payments
  const totalSpent = stats?.totalSpent || 0;

  // Error handling for client payments
  if (error && !isBarber) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">Payments</h1>
          <p className="text-gray-600 mt-1">Your payment history</p>
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
        <p className="text-gray-600 mt-1">
          {isBarber ? 'Business payment overview' : 'Your payment history'}
        </p>
      </div>

      {/* Barber View - All Payments Overview */}
      {isBarber && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-6">
              <h2 className="text-lg font-medium">Total Payments</h2>
              <p className="text-3xl font-bold mt-2">{allPayments.length}</p>
              <p className="text-sm text-gray-500 mt-1">All time</p>
            </div>
            
            <div className="card p-6">
              <h2 className="text-lg font-medium">Total Revenue</h2>
              <p className="text-3xl font-bold mt-2">
                ${allPayments.reduce((sum, payment) => sum + payment.amount, 0).toFixed(2)}
              </p>
              <p className="text-sm text-gray-500 mt-1">Gross revenue</p>
            </div>
            
            <div className="card p-6">
              <h2 className="text-lg font-medium">Successful Payments</h2>
              <p className="text-3xl font-bold mt-2">
                {allPayments.filter(p => p.status === 'succeeded').length}
              </p>
              <p className="text-sm text-gray-500 mt-1">Completed transactions</p>
            </div>
          </div>

          {/* All Payments Table */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">All Payments</h2>
            
            {allPaymentsLoading && (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            )}
            
            {allPaymentsError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800">Error: {allPaymentsError}</p>
              </div>
            )}
            
            {!allPaymentsLoading && !allPaymentsError && (
              <>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allPayments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.created}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${payment.amount.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              payment.status === 'succeeded' 
                                ? 'bg-green-100 text-green-800' 
                                : payment.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.payment_method}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.description || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {allPayments.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No payments found</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Client View - Personal Payment History */}
      {!isBarber && (
        <>
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
        </>
      )}
    </div>
  );
} 