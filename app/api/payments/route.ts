import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getPaymentsByMetadata, transformToPaymentHistory, calculatePaymentStats } from '../../lib/stripe-utils';

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user from Clerk
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const includeStats = searchParams.get('include_stats') === 'true';

    // Fetch payments from Stripe using metadata filtering
    const stripePayments = await getPaymentsByMetadata(userId, limit);
    
    // Transform to our payment history format
    const paymentHistory = transformToPaymentHistory(stripePayments);
    
    // Calculate stats if requested
    const stats = includeStats ? calculatePaymentStats(paymentHistory) : undefined;

    return NextResponse.json({
      payments: paymentHistory,
      stats,
      total: paymentHistory.length,
    });

  } catch (error) {
    console.error('Error fetching payment history:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch payment history',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 