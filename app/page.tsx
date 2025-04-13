'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';
import { SignInButton, SignUpButton, useAuth } from '@clerk/nextjs';

export default function Home() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard');
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center justify-between border-b border-[var(--secondary)] px-6">
        <h1 className="text-2xl font-bold text-[var(--primary)]">BarberHub</h1>
        <div className="flex items-center gap-4">
          <SignInButton mode="modal">
            <button className="btn-secondary">Sign In</button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="btn-primary">Sign Up</button>
          </SignUpButton>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="max-w-3xl text-center">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Subscription-based platform for barbershop management
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Manage your barbershop with ease. Book appointments, send messages,
            and handle payments all in one place.
          </p>
          <div className="mt-10 flex items-center justify-center gap-6">
            <SignUpButton mode="modal">
              <button className="btn-primary">Get Started</button>
            </SignUpButton>
          </div>
        </div>
      </main>
      
      <footer className="border-t border-[var(--secondary)] px-6 py-4 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} BarberHub. All rights reserved.
      </footer>
    </div>
  );
}
