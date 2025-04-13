'use client';

import { useState } from 'react';
import { PaymentCard } from '../components/PaymentCard';

// Sample payment data
const paymentHistory = [
  {
    id: '1',
    date: 'Dec 5, 2023',
    service: 'Haircut & Beard Trim',
    barberName: 'Mike Johnson',
    amount: 40,
    tip: 8,
    paymentMethod: 'card' as const,
    barberImage: 'https://randomuser.me/api/portraits/men/32.jpg'
  },
  {
    id: '2',
    date: 'Nov 20, 2023',
    service: 'Haircut',
    barberName: 'Mike Johnson',
    amount: 30,
    tip: 5,
    paymentMethod: 'apple_pay' as const,
    barberImage: 'https://randomuser.me/api/portraits/men/32.jpg'
  },
  {
    id: '3',
    date: 'Nov 5, 2023',
    service: 'Hair Coloring',
    barberName: 'David Smith',
    amount: 60,
    tip: 12,
    paymentMethod: 'cash' as const,
    barberImage: 'https://randomuser.me/api/portraits/men/44.jpg'
  }
];

export default function PaymentsPage() {
  const [filter, setFilter] = useState('all');
  
  // Filter payments by payment method if needed
  const filteredPayments = filter === 'all' 
    ? paymentHistory 
    : paymentHistory.filter(payment => payment.paymentMethod === filter);
  
  // Calculate total spent
  const totalSpent = paymentHistory.reduce((total, payment) => total + payment.amount + (payment.tip || 0), 0);

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
          <h2 className="text-lg font-medium">Upcoming Payment</h2>
          <p className="text-3xl font-bold mt-2">$40.00</p>
          <p className="text-sm text-gray-500 mt-1">Haircut & Beard Trim on Dec 17</p>
          <button className="btn-primary btn-sm mt-4">Pay Now</button>
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
                paymentMethod={payment.paymentMethod}
                barberImage={payment.barberImage}
              />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No payment history found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 