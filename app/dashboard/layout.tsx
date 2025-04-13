'use client';

import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs';
import dynamic from 'next/dynamic';
import { UserButton } from '@clerk/nextjs';

const Sidebar = dynamic(() => import('../components/Sidebar'), { ssr: false });

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SignedIn>
        <div className="flex h-screen">
          <Sidebar userType="client" />
          <div className="flex-1 flex flex-col overflow-hidden">
            <header className="flex h-16 items-center justify-between border-b border-[var(--secondary)] px-6">
              <h1 className="text-xl font-semibold">Dashboard</h1>
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