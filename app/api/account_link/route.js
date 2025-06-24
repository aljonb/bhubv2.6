import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@clerk/nextjs/server'
import { stripe } from '../../lib/stripe'
import { validateAdminAccess } from '../../lib/auth-utils'

export async function POST(req) {
  try {
    // SECURITY: Validate admin access using existing utility
    const adminCheck = await validateAdminAccess();
    
    if (!adminCheck.isValid) {
      return NextResponse.json(
        { error: adminCheck.error || 'Unauthorized' }, 
        { status: adminCheck.error === 'Unauthorized' ? 401 : 403 }
      );
    }

    const { account } = await req.json();
    
    // SECURITY: Validate account parameter
    if (!account || typeof account !== 'string' || !account.startsWith('acct_')) {
      return NextResponse.json(
        { error: 'Invalid account ID provided' },
        { status: 400 }
      );
    }

    // SECURITY: Verify the account exists and belongs to our platform
    try {
      const stripeAccount = await stripe.accounts.retrieve(account);
      
      // Check if account was created by our platform (has our metadata)
      if (!stripeAccount.metadata?.created_by_user_id) {
        return NextResponse.json(
          { error: 'Account not found or access denied' },
          { status: 404 }
        );
      }
    } catch (_stripeError) {
      return NextResponse.json(
        { error: 'Invalid account or access denied' },
        { status: 404 }
      );
    }

    const headersList = await headers();
    const origin = headersList.get('origin');

    // Add after admin validation
    const rateLimitKey = `account_link_${adminCheck.userId}`;
    const rateLimitWindow = 5 * 60 * 1000; // 5 minutes
    const maxRequests = 3;

    // Simple in-memory rate limiting (use Redis in production)
    if (!global.accountLinkRateLimit) {
      global.accountLinkRateLimit = new Map();
    }

    const now = Date.now();
    const userLimit = global.accountLinkRateLimit.get(rateLimitKey);

    if (userLimit && now < userLimit.resetTime && userLimit.count >= maxRequests) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Update rate limit counter
    global.accountLinkRateLimit.set(rateLimitKey, {
      count: userLimit ? userLimit.count + 1 : 1,
      resetTime: userLimit && now < userLimit.resetTime ? userLimit.resetTime : now + rateLimitWindow
    });

    // Create account link only after all validations pass
    const accountLink = await stripe.accountLinks.create({
      account: account,
      refresh_url: `${origin}/refresh/${account}`,
      return_url: `${origin}/return/${account}`,
      type: "account_onboarding",
    });

    // SECURITY: Log admin action for audit trail
    console.log(`Account link created by admin ${adminCheck.userEmail} for account ${account}`);

    return NextResponse.json({
      url: accountLink.url,
    });

  } catch (error) {
    console.error('Error creating account link:', error);
    
    // SECURITY: Don't expose internal error details
    return NextResponse.json(
      { error: 'Failed to create account link' },
      { status: 500 }
    );
  }
}