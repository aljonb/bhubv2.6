import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignOutButton, UserButton } from '@clerk/nextjs';

interface SidebarProps {
  userType: 'client' | 'barber' | 'owner';
}

export default function Sidebar({ userType }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen flex-col border-r border-[var(--secondary)] bg-[var(--background)] w-64">
      <div className="flex items-center p-6">
        <Link href="/dashboard" className="text-2xl font-bold text-[var(--primary)]">
          BarberHub
        </Link>
      </div>
      
      <div className="mx-3 mb-2">
        <div className="rounded-md bg-[var(--accent)] px-3 py-2">
          <span className="text-sm font-medium capitalize">{userType}</span>
        </div>
      </div>
      
      <nav className="space-y-1 px-3">
        <Link 
          href="/dashboard" 
          className={`nav-link ${pathname === '/dashboard' ? 'active' : ''}`}
        >
          <Image src="/icons/dashboard.svg" alt="Dashboard" width={20} height={20} />
          <span>Dashboard</span>
        </Link>
        
        <Link 
          href="/appointments" 
          className={`nav-link ${pathname.startsWith('/appointments') ? 'active' : ''}`}
        >
          <Image src="/icons/appointment.svg" alt="Appointments" width={20} height={20} />
          <span>Appointments</span>
        </Link>
        
        <Link 
          href="/messages" 
          className={`nav-link ${pathname.startsWith('/messages') ? 'active' : ''}`}
        >
          <Image src="/icons/message.svg" alt="Messages" width={20} height={20} />
          <span>Messages</span>
        </Link>
        
        <Link 
          href="/payments" 
          className={`nav-link ${pathname.startsWith('/payments') ? 'active' : ''}`}
        >
          <Image src="/icons/payment.svg" alt="Payments" width={20} height={20} />
          <span>Payments</span>
        </Link>
        
        <Link 
          href="/profile" 
          className={`nav-link ${pathname.startsWith('/profile') ? 'active' : ''}`}
        >
          <Image src="/icons/profile.svg" alt="Profile" width={20} height={20} />
          <span>Profile</span>
        </Link>
      </nav>
      
      <div className="mt-auto flex items-center justify-between p-4 border-t border-[var(--secondary)]">
        <div className="flex items-center gap-2">
          <UserButton />
          <div className="text-sm">
            <p className="font-medium">John Doe</p>
          </div>
        </div>
        
        <SignOutButton>
          <button className="rounded-full p-1 hover:bg-[var(--accent)]">
            <Image src="/icons/logout.svg" alt="Logout" width={20} height={20} />
          </button>
        </SignOutButton>
      </div>
    </div>
  );
} 