import { useState, useEffect, useCallback } from 'react';
import { PaymentHistoryItem, PaymentStats } from '../lib/payment-types';

interface UsePaymentsResult {
  payments: PaymentHistoryItem[];
  stats: PaymentStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UsePaymentsOptions {
  includeStats?: boolean;
  limit?: number;
}

export function usePayments(options: UsePaymentsOptions = {}): UsePaymentsResult {
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { includeStats = true, limit = 100 } = options;

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: limit.toString(),
        include_stats: includeStats.toString(),
      });

      const response = await fetch(`/api/payments?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch payments');
      }

      const data = await response.json();
      
      setPayments(data.payments || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [includeStats, limit]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return {
    payments,
    stats,
    loading,
    error,
    refetch: fetchPayments,
  };
} 