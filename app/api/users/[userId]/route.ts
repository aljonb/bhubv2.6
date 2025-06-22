import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

const BARBER_EMAIL = 'bushatia777@gmail.com';

// Define types for Clerk errors
interface ClerkError extends Error {
  status?: number;
  code?: string;
}

// Type guard to check if error is a Clerk error
function isClerkError(error: unknown): error is ClerkError {
  return error instanceof Error && ('status' in error || 'code' in error);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: currentUserId } = await auth();
    
    if (!currentUserId) {
      console.log('Unauthorized request to fetch user details');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await the params to get the userId
    const { userId } = await params;

    // Get current user to check if they're the barber
    const client = await clerkClient();
    const currentUser = await client.users.getUser(currentUserId);
    const currentUserEmail = currentUser.emailAddresses[0]?.emailAddress;

    // Only allow barber to fetch other users' info
    if (currentUserEmail !== BARBER_EMAIL) {
      console.log(`Access denied for ${currentUserEmail}, not barber`);
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    console.log(`Barber ${currentUserEmail} fetching user details for userId: ${userId}`);
    
    // Fetch the requested user
    const user = await client.users.getUser(userId);
    
    const userDetails = {
      firstName: user.firstName || 'Unknown',
      lastName: user.lastName || '',
      email: user.emailAddresses[0]?.emailAddress || '',
      imageUrl: user.imageUrl || null
    };
    
    console.log(`Successfully fetched user: ${userDetails.firstName} ${userDetails.lastName} (${userDetails.email})`);
    
    return NextResponse.json(userDetails);
  } catch (error: unknown) {
    // Note: We need to await params here too for error handling
    const { userId } = await params;
    const clerkError = isClerkError(error) ? error : null;
    
    console.error('Error fetching user details:', {
      userId: userId,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: clerkError?.status,
      code: clerkError?.code,
      details: error
    });
    
    // Handle Clerk-specific errors
    if (clerkError?.code === 'user_not_found' || clerkError?.status === 404) {
      return NextResponse.json({ 
        error: 'User not found in Clerk - user may have been deleted',
        userId: userId 
      }, { status: 404 });
    }
    
    if (clerkError?.code === 'rate_limit_exceeded') {
      return NextResponse.json({ 
        error: 'Rate limit exceeded - too many requests',
        userId: userId 
      }, { status: 429 });
    }
    
    // Generic error response
    return NextResponse.json({ 
      error: 'Failed to fetch user details',
      details: error instanceof Error ? error.message : 'Unknown error',
      userId: userId 
    }, { status: 500 });
  }
}