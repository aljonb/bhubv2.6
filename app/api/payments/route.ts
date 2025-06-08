import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { getPaymentsByCustomerId, getOrCreateStripeCustomer, transformToPaymentHistory, calculatePaymentStats } from '../../lib/stripe-utils';
import { handleApiError } from '../../../lib/error-handler';

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

    // Get user details from Clerk
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const userEmail = user.emailAddresses[0]?.emailAddress;
    const userName = user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user.firstName || user.lastName || undefined;

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer ID
    const customerId = await getOrCreateStripeCustomer(userId, userEmail, userName);

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const includeStats = searchParams.get('include_stats') === 'true';

    // Fetch payments using secure customer-based filtering
    const stripePayments = await getPaymentsByCustomerId(customerId, limit);
    
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
    const context = {
      userId: (await auth()).userId || 'unknown',
      endpoint: '/api/payments',
      method: request.method,
      userAgent: request.headers.get('user-agent') || undefined
    };

    const { response, status } = handleApiError(error, context, 'Failed to fetch payment history');
    return NextResponse.json(response, { status });
  }
} 