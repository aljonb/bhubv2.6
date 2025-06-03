import Stripe from 'stripe';
import { stripe } from './stripe';
import { StripePayment, PaymentHistoryItem, PaymentStats } from './payment-types';

/**
 * Fetch payment intents for a specific customer from Stripe
 */
export async function getCustomerPayments(customerId: string, limit: number = 100): Promise<StripePayment[]> {
  try {
    const paymentIntents = await stripe.paymentIntents.list({
      customer: customerId,
      limit,
      expand: ['data.payment_method', 'data.charges'],
    });

    return paymentIntents.data.map(transformStripePaymentIntent);
  } catch (error) {
    console.error('Error fetching customer payments:', error);
    throw new Error('Failed to fetch payment history');
  }
}

/**
 * Fetch payments by user ID (secure implementation)
 * Uses Stripe customer ID for server-side filtering
 */
export async function getPaymentsByUserId(userId: string, limit: number = 100): Promise<StripePayment[]> {
  try {
    // First, get the user's email from Clerk to find their Stripe customer
    // This should be passed from the calling function that has access to user data
    throw new Error('This function should not be used directly. Use getPaymentsByCustomerId instead.');
  } catch (error) {
    console.error('Error: getPaymentsByUserId is deprecated:', error);
    throw new Error('Use getPaymentsByCustomerId with proper customer ID');
  }
}

/**
 * Secure payment fetching using customer ID
 * This replaces the vulnerable getPaymentsByMetadata function
 */
export async function getPaymentsByCustomerId(customerId: string, limit: number = 100): Promise<StripePayment[]> {
  try {
    const paymentIntents = await stripe.paymentIntents.list({
      customer: customerId,
      limit,
      expand: ['data.payment_method', 'data.charges'],
    });

    return paymentIntents.data.map(transformStripePaymentIntent);
  } catch (error) {
    console.error('Error fetching customer payments:', error);
    throw new Error('Failed to fetch payment history');
  }
}

/**
 * Get a specific payment intent by ID
 */
export async function getPaymentIntent(paymentIntentId: string): Promise<StripePayment> {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['payment_method', 'charges'],
    });

    return transformStripePaymentIntent(paymentIntent);
  } catch (error) {
    console.error('Error fetching payment intent:', error);
    throw new Error('Failed to fetch payment details');
  }
}

/**
 * Transform Stripe PaymentIntent to our StripePayment interface
 */
function transformStripePaymentIntent(paymentIntent: Stripe.PaymentIntent): StripePayment {
  const paymentMethod = paymentIntent.payment_method as Stripe.PaymentMethod;
  const expandedPaymentIntent = paymentIntent as Stripe.PaymentIntent & {
    charges: Stripe.ApiList<Stripe.Charge>;
  };
  
  return {
    id: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    status: paymentIntent.status as StripePayment['status'],
    created: paymentIntent.created,
    description: paymentIntent.description || undefined,
    metadata: paymentIntent.metadata || {},
    payment_method: paymentIntent.payment_method ? {
      type: paymentMethod.type,
      card: paymentMethod.card ? {
        brand: paymentMethod.card.brand,
        last4: paymentMethod.card.last4,
      } : undefined,
    } : undefined,
    receipt_url: expandedPaymentIntent.charges?.data?.[0]?.receipt_url || undefined,
    customer: typeof paymentIntent.customer === 'string' ? paymentIntent.customer : undefined,
  };
}

/**
 * Transform Stripe payments to PaymentHistoryItem format
 */
export function transformToPaymentHistory(stripePayments: StripePayment[]): PaymentHistoryItem[] {
  return stripePayments.map((payment) => {
    const amount = payment.amount / 100; // Convert from cents
    const tip = 0; // We'll need to implement tip tracking separately if needed
    
    // Map Stripe status to PaymentHistoryItem status
    const mapStatus = (status: StripePayment['status']): PaymentHistoryItem['status'] => {
      switch (status) {
        case 'succeeded':
          return 'succeeded';
        case 'canceled':
          return 'canceled';
        case 'failed':
          return 'failed';
        case 'processing':
        case 'requires_action':
        case 'requires_capture':
        case 'requires_confirmation':
        case 'requires_payment_method':
        case 'pending':
        default:
          return 'pending';
      }
    };
    
    return {
      id: payment.id,
      date: new Date(payment.created * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      service: payment.metadata.service_type || payment.description || 'Barber Service',
      barberName: payment.metadata.barber_name || 'Professional Barber',
      amount,
      tip,
      total: amount + tip,
      paymentMethod: getPaymentMethodType(payment.payment_method?.type, payment.payment_method?.card?.brand),
      status: mapStatus(payment.status),
      receiptUrl: payment.receipt_url,
      appointmentId: payment.metadata.appointment_id,
      stripePaymentIntentId: payment.id,
      barberImage: 'https://randomuser.me/api/portraits/men/32.jpg', // Default image
    };
  });
}

/**
 * Map Stripe payment method types to our payment method types
 */
function getPaymentMethodType(type?: string, _brand?: string): 'card' | 'cash' | 'apple_pay' | 'google_pay' | 'unknown' {
  if (!type) return 'unknown';
  
  switch (type) {
    case 'card':
      return 'card';
    case 'apple_pay':
      return 'apple_pay';
    case 'google_pay':
      return 'google_pay';
    default:
      return 'unknown';
  }
}

/**
 * Calculate payment statistics
 */
export function calculatePaymentStats(payments: PaymentHistoryItem[]): PaymentStats {
  const succeededPayments = payments.filter(p => p.status === 'succeeded');
  
  const totalSpent = succeededPayments.reduce((sum, payment) => sum + payment.total, 0);
  const totalTransactions = succeededPayments.length;
  const averageAmount = totalTransactions > 0 ? totalSpent / totalTransactions : 0;
  
  const lastPayment = succeededPayments.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0];
  
  return {
    totalSpent,
    totalTransactions,
    averageAmount,
    lastPaymentDate: lastPayment?.date,
  };
}

/**
 * Create or get Stripe customer for Clerk user
 */
export async function getOrCreateStripeCustomer(userId: string, email: string, name?: string) {
  try {
    // First, try to find existing customer by metadata
    const existingCustomers = await stripe.customers.list({
      limit: 1,
      email: email,
    });

    if (existingCustomers.data.length > 0) {
      const customer = existingCustomers.data[0];
      // Update metadata if it doesn't exist
      if (!customer.metadata?.clerk_user_id) {
        await stripe.customers.update(customer.id, {
          metadata: { clerk_user_id: userId },
        });
      }
      return customer.id;
    }

    // Create new customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        clerk_user_id: userId,
      },
    });

    return customer.id;
  } catch (error) {
    console.error('Error creating/getting Stripe customer:', error);
    throw new Error('Failed to manage customer');
  }
}

/**
 * Get all payments across all users (admin only)
 */
export async function getAllPayments(limit: number = 1000): Promise<StripePayment[]> {
  try {
    const paymentIntents = await stripe.paymentIntents.list({
      limit,
      expand: ['data.payment_method', 'data.charges'],
    });

    return paymentIntents.data.map(transformStripePaymentIntent);
  } catch (error) {
    console.error('Error fetching all payments:', error);
    throw new Error('Failed to fetch payment data');
  }
}

/**
 * Calculate total revenue and statistics (admin only)
 */
export function calculateTotalRevenue(payments: PaymentHistoryItem[]): {
  totalRevenue: number;
  totalTransactions: number;
  averageTransaction: number;
  revenueByMonth: { [key: string]: number };
  revenueByBarber: { [key: string]: number };
} {
  const succeededPayments = payments.filter(p => p.status === 'succeeded');
  
  const totalRevenue = succeededPayments.reduce((sum, payment) => sum + payment.total, 0);
  const totalTransactions = succeededPayments.length;
  const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
  
  // Group by month
  const revenueByMonth: { [key: string]: number } = {};
  succeededPayments.forEach(payment => {
    const month = new Date(payment.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    revenueByMonth[month] = (revenueByMonth[month] || 0) + payment.total;
  });
  
  // Group by barber
  const revenueByBarber: { [key: string]: number } = {};
  succeededPayments.forEach(payment => {
    revenueByBarber[payment.barberName] = (revenueByBarber[payment.barberName] || 0) + payment.total;
  });
  
  return {
    totalRevenue,
    totalTransactions,
    averageTransaction,
    revenueByMonth,
    revenueByBarber,
  };
} 