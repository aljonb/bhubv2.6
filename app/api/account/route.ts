import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { stripe } from '../../lib/stripe';

// Define admin email addresses (same as your other routes)
const ADMIN_EMAILS = [
  'bushatia777@gmail.com', // Replace with actual barber email
  // Add more admin emails as needed
];

export async function POST(request: NextRequest) {
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

    // Check if user is admin (only admins can create Stripe Connect accounts)
    if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required for account creation.' },
        { status: 403 }
      );
    }

    // Get request body for account details (optional)
    const body = await request.json().catch(() => ({}));
    const { country = 'US', type = 'express' } = body;

    // Create Stripe Connect account with metadata
    const account = await stripe.accounts.create({
      type,
      country,
      metadata: {
        created_by_user_id: userId,
        created_by_email: userEmail,
        created_at: new Date().toISOString(),
      },
    });

    console.log(`Stripe Connect account created by admin ${userEmail}: ${account.id}`);

    return NextResponse.json({ 
      account: account.id,
      type: account.type,
      country: account.country,
    });

  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create Stripe Connect account',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}