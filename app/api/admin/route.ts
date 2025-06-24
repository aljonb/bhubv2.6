import { NextRequest, NextResponse } from 'next/server';
import { getAllPayments, transformToPaymentHistory, calculateTotalRevenue } from '../../lib/stripe-utils';
import { validateAdminAccess } from '../../lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    // Use centralized admin validation instead of direct email comparison
    const adminCheck = await validateAdminAccess();
    
    if (!adminCheck.isValid) {
      return NextResponse.json(
        { error: adminCheck.error || 'Access denied' },
        { status: adminCheck.error === 'Unauthorized' ? 401 : 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '1000');

    // Validate limit parameter
    if (limit > 10000 || limit < 1) {
      return NextResponse.json(
        { error: 'Invalid limit parameter' },
        { status: 400 }
      );
    }

    // Fetch all payments from Stripe
    const stripePayments = await getAllPayments(limit);
    
    // Transform to our payment history format
    const paymentHistory = transformToPaymentHistory(stripePayments);
    
    // Calculate revenue statistics
    const revenueStats = calculateTotalRevenue(paymentHistory);

    return NextResponse.json({
      payments: paymentHistory,
      stats: revenueStats,
      total: paymentHistory.length,
    });

  } catch (_error) {
    // Use secure error handling - prefixed with underscore to indicate intentionally unused
    return NextResponse.json(
      { error: 'Failed to fetch payment data' },
      { status: 500 }
    );
  }
}