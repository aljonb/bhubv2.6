'use client';

import { useState, useEffect } from 'react';

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: string;
  description: string | null;
  payment_method: string;
}

export default function AllPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/all')
      .then(res => res.json())
      .then(data => {
        setPayments(data.payments || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Stripe Payments</h1>
      
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 border">Date</th>
            <th className="p-2 border">Amount</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Method</th>
            <th className="p-2 border">Description</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td className="p-2 border">{payment.created}</td>
              <td className="p-2 border">${payment.amount.toFixed(2)}</td>
              <td className="p-2 border">{payment.status}</td>
              <td className="p-2 border">{payment.payment_method}</td>
              <td className="p-2 border">{payment.description || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <p className="mt-4 text-sm text-gray-600">Total: {payments.length} payments</p>
    </div>
  );
}