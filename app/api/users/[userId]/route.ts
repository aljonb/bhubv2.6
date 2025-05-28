import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

const BARBER_EMAIL = 'bushatia777@gmail.com';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId: currentUserId } = await auth();
    
    if (!currentUserId) {
      console.log('Unauthorized request to fetch user details');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user to check if they're the barber
    const client = await clerkClient();
    const currentUser = await client.users.getUser(currentUserId);
    const currentUserEmail = currentUser.emailAddresses[0]?.emailAddress;

    // Only allow barber to fetch other users' info
    if (currentUserEmail !== BARBER_EMAIL) {
      console.log(`Access denied for ${currentUserEmail}, not barber`);
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    console.log(`Barber ${currentUserEmail} fetching user details for userId: ${params.userId}`);
    
    // Fetch the requested user
    const user = await client.users.getUser(params.userId);
    
    const userDetails = {
      firstName: user.firstName || 'Unknown',
      lastName: user.lastName || '',
      email: user.emailAddresses[0]?.emailAddress || ''
    };
    
    console.log(`Successfully fetched user: ${userDetails.firstName} ${userDetails.lastName} (${userDetails.email})`);
    
    return NextResponse.json(userDetails);
  } catch (error: any) {
    console.error('Error fetching user details:', {
      userId: params.userId,
      error: error.message,
      status: error.status,
      code: error.code,
      details: error
    });
    
    // Handle Clerk-specific errors
    if (error.code === 'user_not_found' || error.status === 404) {
      return NextResponse.json({ 
        error: 'User not found in Clerk - user may have been deleted',
        userId: params.userId 
      }, { status: 404 });
    }
    
    if (error.code === 'rate_limit_exceeded') {
      return NextResponse.json({ 
        error: 'Rate limit exceeded - too many requests',
        userId: params.userId 
      }, { status: 429 });
    }
    
    // Generic error response
    return NextResponse.json({ 
      error: 'Failed to fetch user details',
      details: error.message || 'Unknown error',
      userId: params.userId 
    }, { status: 500 });
  }
}