import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getPaymentIntent, transformToPaymentHistory } from '../../../lib/stripe-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the authenticated user from Clerk
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const paymentIntentId = params.id;

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // Fetch the specific payment from Stripe
    const stripePayment = await getPaymentIntent(paymentIntentId);
    
    // Verify the payment belongs to the current user
    if (stripePayment.metadata.user_id !== userId) {
      return NextResponse.json(
        { error: 'Payment not found or access denied' },
        { status: 404 }
      );
    }
    
    // Transform to our payment history format
    const paymentHistory = transformToPaymentHistory([stripePayment]);
    const payment = paymentHistory[0];

    return NextResponse.json({
      payment,
    });

  } catch (error) {
    console.error('Error fetching payment details:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch payment details',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 