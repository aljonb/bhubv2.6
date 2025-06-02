'use client';

import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { DashboardCard } from "../components/DashboardCard";
import { AppointmentCard } from "../components/AppointmentCard";
import AdminDashboard from "../admin/page";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Define admin email addresses (same as in your API route)
const ADMIN_EMAILS = [
  'bushatia777@gmail.com', // Replace with actual barber email
  // Add more admin emails as needed
];

// Interface for appointment data from database
interface DatabaseAppointment {
  id: string;
  user_id: string;
  service_type: string;
  date: string;
  time: string;
  payment_status: string;
  created_at: string;
  updated_at: string;
}

// Interface for formatted appointment data
interface FormattedAppointment {
  id: string;
  service: string;
  barberName: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  barberImage: string;
}

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [appointments, setAppointments] = useState<FormattedAppointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null);
  const [showUpcoming, setShowUpcoming] = useState(true);

  useEffect(() => {
    if (isLoaded && user) {
      const userEmail = user.emailAddresses[0]?.emailAddress;
      setIsAdmin(userEmail ? ADMIN_EMAILS.includes(userEmail) : false);
    }
  }, [isLoaded, user]);

  // Fetch user's appointments
  useEffect(() => {
    const fetchUserAppointments = async () => {
      if (!isLoaded || !user) {
        setIsLoadingAppointments(false);
        return;
      }

      setIsLoadingAppointments(true);
      setAppointmentsError(null);

      try {
        // Fetch appointments for the current user
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: true })
          .order('time', { ascending: true });

        if (error) {
          console.error('Error fetching appointments:', error);
          setAppointmentsError(`Error fetching appointments: ${error.message}`);
          return;
        }

        // Format appointments for display
        const formattedAppointments: FormattedAppointment[] = (data || []).map((appointment: DatabaseAppointment) => {
          // Format date from YYYY-MM-DD to MM/DD/YYYY
          const dateObj = new Date(appointment.date);
          const formattedDate = dateObj.toLocaleDateString('en-US');
          
          // Format time from HH:MM:SS to HH:MM AM/PM
          const timeObj = new Date(`2000-01-01T${appointment.time}`);
          const formattedTime = timeObj.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          });

          // Determine status based on payment_status and date
          let status: 'confirmed' | 'pending' | 'cancelled' = 'pending';
          if (appointment.payment_status === 'paid') {
            status = 'confirmed';
          } else if (appointment.payment_status === 'cancelled') {
            status = 'cancelled';
          }

          return {
            id: appointment.id,
            service: appointment.service_type === 'Barber' ? 'Haircut & Beard Trim' : 'Hair Styling',
            barberName: 'Professional Barber', // You can make this dynamic later
            date: formattedDate,
            time: formattedTime,
            status,
            barberImage: 'https://randomuser.me/api/portraits/men/32.jpg' // Default image
          };
        });

        setAppointments(formattedAppointments);
      } catch (err) {
        console.error('Exception in fetchUserAppointments:', err);
        setAppointmentsError(`Failed to fetch appointments: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setIsLoadingAppointments(false);
      }
    };

    fetchUserAppointments();
  }, [isLoaded, user]);

  // Filter appointments based on upcoming/past
  const filteredAppointments = appointments.filter(appointment => {
    const appointmentDate = new Date(appointment.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    if (showUpcoming) {
      return appointmentDate >= today;
    } else {
      return appointmentDate < today;
    }
  });

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
            <button 
              className={`btn-sm ${showUpcoming ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setShowUpcoming(true)}
            >
              Upcoming
            </button>
            <button 
              className={`btn-sm ${!showUpcoming ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setShowUpcoming(false)}
            >
              Past
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {isLoadingAppointments ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your appointments...</p>
            </div>
          ) : appointmentsError ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p>{appointmentsError}</p>
              <p className="text-sm mt-2">
                Please make sure your database connection is working and try refreshing the page.
              </p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">
                {showUpcoming ? 'No upcoming appointments.' : 'No past appointments.'} 
                {showUpcoming && (
                  <span className="block mt-2">
                    <a href="/appointments/book" className="text-blue-600 hover:text-blue-800 underline">
                      Book your first appointment
                    </a>
                  </span>
                )}
              </p>
            </div>
          ) : (
            filteredAppointments.map((appointment) => (
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
          )}
        </div>
      </div>
    </div>
  );
} 