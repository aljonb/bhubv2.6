export interface StripePayment {
  id: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed' | 'canceled' | 'processing' | 'requires_action' | 'requires_capture' | 'requires_confirmation' | 'requires_payment_method';
  created: number;
  description?: string;
  metadata: {
    appointment_id?: string;
    service_type?: string;
    barber_name?: string;
    user_id?: string;
  };
  payment_method?: {
    type: string;
    card?: {
      brand: string;
      last4: string;
    };
  };
  receipt_url?: string;
  customer?: string;
}

export interface PaymentHistoryItem {
  id: string;
  date: string;
  service: string;
  barberName: string;
  amount: number;
  tip?: number;
  total: number;
  paymentMethod: 'card' | 'cash' | 'apple_pay' | 'google_pay' | 'unknown';
  status: 'succeeded' | 'pending' | 'failed' | 'canceled';
  receiptUrl?: string;
  appointmentId?: string;
  stripePaymentIntentId: string;
  barberImage?: string;
}

export interface PaymentFilters {
  status?: string;
  paymentMethod?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface PaymentStats {
  totalSpent: number;
  totalTransactions: number;
  averageAmount: number;
  lastPaymentDate?: string;
} 