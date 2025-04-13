'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AppointmentCard } from '../components/AppointmentCard';

export default function AppointmentsPage() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  
  // This would come from your API in a real app
  const appointments = {
    upcoming: [
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
    ],
    past: [
      {
        id: '3',
        service: 'Haircut',
        barberName: 'Mike Johnson',
        date: '11/20/2023',
        time: '3:00 PM',
        status: 'confirmed' as const,
        barberImage: 'https://randomuser.me/api/portraits/men/32.jpg'
      },
      {
        id: '4',
        service: 'Beard Trim',
        barberName: 'David Smith',
        date: '11/12/2023',
        time: '11:30 AM',
        status: 'confirmed' as const,
        barberImage: 'https://randomuser.me/api/portraits/men/44.jpg'
      }
    ]
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Appointments</h1>
        <Link href="/appointments/book">
          <button className="btn-primary">Book Appointment</button>
        </Link>
      </div>

      <div className="flex border-b border-[var(--secondary)]">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'upcoming'
              ? 'border-b-2 border-[var(--primary)] text-[var(--primary)]'
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'past'
              ? 'border-b-2 border-[var(--primary)] text-[var(--primary)]'
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('past')}
        >
          Past
        </button>
      </div>

      <div className="space-y-4">
        {appointments[activeTab].length > 0 ? (
          appointments[activeTab].map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              service={appointment.service}
              barberName={appointment.barberName}
              date={appointment.date}
              time={appointment.time}
              status={appointment.status}
              barberImage={appointment.barberImage}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No {activeTab} appointments</p>
            {activeTab === 'upcoming' && (
              <Link href="/appointments/book">
                <button className="btn-primary mt-4">Book an Appointment</button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 