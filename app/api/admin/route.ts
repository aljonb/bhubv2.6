import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { getAllPayments, transformToPaymentHistory, calculateTotalRevenue } from '../../lib/stripe-utils';

// Define admin email addresses
const ADMIN_EMAILS = [
  'bushatia777@gmail.com', // Replace with actual barber email
  // Add more admin emails as needed
];

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

    // Check if user is admin
    if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '1000');

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

  } catch (error) {
    console.error('Error fetching admin payment data:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch payment data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}