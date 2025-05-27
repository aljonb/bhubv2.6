'use client';

import { SignedIn, SignedOut, RedirectToSignIn, useUser } from '@clerk/nextjs';
import dynamic from 'next/dynamic';
import { UserButton } from '@clerk/nextjs';
import { useState, useEffect } from 'react';

const Sidebar = dynamic(() => import('../components/Sidebar'), { ssr: false });

// Define admin email addresses (same as in your API route)
const ADMIN_EMAILS = [
  'bushatia777@gmail.com', // Replace with actual barber email
  // Add more admin emails as needed
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded } = useUser();
  const [userType, setUserType] = useState<'client' | 'barber' | 'owner'>('client');

  useEffect(() => {
    if (isLoaded && user) {
      const userEmail = user.emailAddresses[0]?.emailAddress;
      if (userEmail && ADMIN_EMAILS.includes(userEmail)) {
        setUserType('barber'); // or 'owner' depending on your preference
      }
    }
  }, [isLoaded, user]);

  return (
    <>
      <SignedIn>
        <div className="flex h-screen">
          <Sidebar userType={userType} />
          <div className="flex-1 flex flex-col overflow-hidden">
            <header className="flex h-16 items-center justify-between border-b border-[var(--secondary)] px-6">
              <h1 className="text-xl font-semibold">
                {userType === 'barber' ? 'Barber Dashboard' : 'Dashboard'}
              </h1>
              <div className="flex items-center gap-4">
                <div className="hidden sm:block">
                  <UserButton />
                </div>
              </div>
            </header>
            <main className="flex-1 overflow-auto p-6">
              {children}
            </main>
          </div>
        </div>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
} 