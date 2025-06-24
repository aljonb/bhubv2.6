import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripe } from '../../lib/stripe';

export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get recent payment intents from Stripe
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 100,
      expand: ['data.payment_method']
    });

    // Simple transformation to basic payment info
    const payments = paymentIntents.data.map(payment => ({
      id: payment.id,
      amount: payment.amount / 100, // Convert from cents
      currency: payment.currency,
      status: payment.status,
      created: new Date(payment.created * 1000).toLocaleDateString(),
      description: payment.description,
      payment_method: typeof payment.payment_method === 'object' ? payment.payment_method?.type || 'unknown' : 'unknown'
    }));

    return NextResponse.json({ payments });

  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
  }
}