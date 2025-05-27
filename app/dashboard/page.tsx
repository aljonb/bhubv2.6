'use client';

import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { DashboardCard } from "../components/DashboardCard";
import { AppointmentCard } from "../components/AppointmentCard";
import AdminDashboard from "../admin/page";

// Define admin email addresses (same as in your API route)
const ADMIN_EMAILS = [
  'bushatia777@gmail.com', // Replace with actual barber email
  // Add more admin emails as needed
];

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      const userEmail = user.emailAddresses[0]?.emailAddress;
      setIsAdmin(userEmail ? ADMIN_EMAILS.includes(userEmail) : false);
    }
  }, [isLoaded, user]);

  // Show loading state while checking authentication
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // If user is admin/barber, show admin dashboard
  if (isAdmin) {
    return <AdminDashboard />;
  }

  // Regular client dashboard
  const upcomingAppointments = [
    {
      id: '1',
      service: 'Haircut & Beard Trim',
      barberName: 'Mike Johnson',
      date: '12/9/2023',
      time: '10:00 AM',
      status: 'confirmed' as const,
      barberImage: 'https://randomuser.me/api/portraits/men/32.jpg'
    },
    {
      id: '2',
      service: 'Hair Coloring',
      barberName: 'David Smith',
      date: '12/17/2023',
      time: '2:30 PM',
      status: 'pending' as const,
      barberImage: 'https://randomuser.me/api/portraits/men/44.jpg'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard
          title="Book Appointment"
          description="Schedule your next service"
          href="/appointments/book"
          icon="/icons/book.svg"
        />
        <DashboardCard
          title="Message Barber"
          description="Contact your barber"
          href="/messages"
          icon="/icons/chat.svg"
        />
        <DashboardCard
          title="Payment History"
          description="View past payments"
          href="/payments"
          icon="/icons/credit-card.svg"
        />
      </div>

      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Appointments</h2>
          <div className="flex gap-2">
            <button className="btn-primary btn-sm">Upcoming</button>
            <button className="btn-secondary btn-sm">Past</button>
          </div>
        </div>

        <div className="space-y-4">
          {upcomingAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              service={appointment.service}
              barberName={appointment.barberName}
              date={appointment.date}
              time={appointment.time}
              status={appointment.status}
              barberImage={appointment.barberImage}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 