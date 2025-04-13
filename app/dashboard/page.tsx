'use client';

import { DashboardCard } from "../components/DashboardCard";
import { AppointmentCard } from "../components/AppointmentCard";

export default function Dashboard() {
  // This would come from your API in a real app
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