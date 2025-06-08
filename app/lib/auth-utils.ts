import { auth, clerkClient } from '@clerk/nextjs/server';

const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim()) || [];

export async function validateAdminAccess(): Promise<{
  isValid: boolean;
  userId?: string;
  userEmail?: string;
  error?: string;
}> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return { isValid: false, error: 'Unauthorized' };
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const userEmail = user.emailAddresses[0]?.emailAddress;

    if (!userEmail) {
      return { isValid: false, error: 'Email address required' };
    }

    if (ADMIN_EMAILS.length === 0) {
      return { isValid: false, error: 'Admin configuration missing' };
    }

    if (!ADMIN_EMAILS.includes(userEmail)) {
      return { isValid: false, error: 'Access denied. Admin privileges required.' };
    }

    return { isValid: true, userId, userEmail };
  } catch (error) {
    return { isValid: false, error: 'Authentication failed' };
  }
}