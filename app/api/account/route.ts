import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { stripe } from '../../lib/stripe';
import { handleApiError } from '../../lib/error-handler';
import { validateAdminAccess } from '../../lib/auth-utils';

// Use environment variable for admin emails (more secure and manageable)
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || [];

// Rate limiting map (in production, use Redis or database)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_HOUR = 3; // Maximum 3 account creation attempts per hour

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (userLimit.count >= MAX_REQUESTS_PER_HOUR) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Simplified admin validation
    const adminCheck = await validateAdminAccess();
    
    if (!adminCheck.isValid) {
      if (adminCheck.error === 'Unauthorized') {
        return NextResponse.json({ error: adminCheck.error }, { status: 401 });
      }
      return NextResponse.json({ error: adminCheck.error }, { status: 403 });
    }

    const { userId, userEmail } = adminCheck;

    // Rate limiting check
    if (!checkRateLimit(userId!)) {
      console.warn(`Rate limit exceeded for user ${userId} attempting to create Stripe Connect account`);
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Get request body for account details (with validation)
    const body = await request.json().catch(() => ({}));
    const { country = 'US', type = 'express' } = body;

    // Validate input parameters
    const validCountries = ['US', 'CA', 'GB', 'AU']; // Add more as needed
    const validTypes = ['express', 'standard'];

    if (!validCountries.includes(country)) {
      return NextResponse.json(
        { error: 'Invalid country code' },
        { status: 400 }
      );
    }

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid account type' },
        { status: 400 }
      );
    }

    // Create Stripe Connect account with enhanced metadata
    const account = await stripe.accounts.create({
      type: type as 'express' | 'standard',
      country,
      metadata: {
        created_by_user_id: userId!,
        created_by_email: userEmail!,
        created_at: new Date().toISOString(),
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
      },
    });

    // Enhanced logging for audit trail
    console.log(`Stripe Connect account created successfully:`, {
      accountId: account.id,
      type: account.type,
      country: account.country,
      createdBy: userEmail,
      userId: userId,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ 
      account: account.id,
      type: account.type,
      country: account.country,
    });

  } catch (error) {
    const context = {
      userId: (await auth()).userId || 'unknown',
      endpoint: '/api/account',
      method: request.method,
      userAgent: request.headers.get('user-agent') || undefined
    };

    const { response, status } = handleApiError(error, context, 'Failed to create Stripe Connect account');
    return NextResponse.json(response, { status });
  }
}