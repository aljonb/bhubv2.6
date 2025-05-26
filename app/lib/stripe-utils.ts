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
      expand: ['data.payment_method'],
    });

    return paymentIntents.data.map(transformStripePaymentIntent);
  } catch (error) {
    console.error('Error fetching customer payments:', error);
    throw new Error('Failed to fetch payment history');
  }
}

/**
 * Fetch payments by metadata (e.g., user_id from Clerk)
 */
export async function getPaymentsByMetadata(userId: string, limit: number = 100): Promise<StripePayment[]> {
  try {
    const paymentIntents = await stripe.paymentIntents.list({
      limit,
      expand: ['data.payment_method'],
    });

    // Filter by user_id in metadata since Stripe doesn't support metadata filtering in list
    const userPayments = paymentIntents.data.filter(
      (payment) => payment.metadata?.user_id === userId
    );

    return userPayments.map(transformStripePaymentIntent);
  } catch (error) {
    console.error('Error fetching payments by metadata:', error);
    throw new Error('Failed to fetch payment history');
  }
}

/**
 * Get a specific payment intent by ID
 */
export async function getPaymentIntent(paymentIntentId: string): Promise<StripePayment> {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['payment_method'],
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
function transformStripePaymentIntent(paymentIntent: any): StripePayment {
  return {
    id: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    status: paymentIntent.status,
    created: paymentIntent.created,
    description: paymentIntent.description,
    metadata: paymentIntent.metadata || {},
    payment_method: paymentIntent.payment_method ? {
      type: paymentIntent.payment_method.type,
      card: paymentIntent.payment_method.card ? {
        brand: paymentIntent.payment_method.card.brand,
        last4: paymentIntent.payment_method.card.last4,
      } : undefined,
    } : undefined,
    receipt_url: paymentIntent.charges?.data?.[0]?.receipt_url,
    customer: paymentIntent.customer,
  };
}

/**
 * Transform Stripe payments to PaymentHistoryItem format
 */
export function transformToPaymentHistory(stripePayments: StripePayment[]): PaymentHistoryItem[] {
  return stripePayments.map((payment) => {
    const amount = payment.amount / 100; // Convert from cents
    const tip = 0; // We'll need to implement tip tracking separately if needed
    
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
      status: payment.status,
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
function getPaymentMethodType(type?: string, brand?: string): 'card' | 'cash' | 'apple_pay' | 'google_pay' | 'unknown' {
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