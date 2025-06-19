'use client';

import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { DashboardCard } from "../components/DashboardCard";
import { AppointmentCard } from "../components/AppointmentCard";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Get barber email from environment variable
const BARBER_EMAIL = process.env.NEXT_PUBLIC_BARBER_EMAIL;

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
  originalDate: string;
  userId?: string;
  userName?: string; // Add user name for admin view
}

// Interface for user details from Clerk
interface UserDetails {
  firstName: string;
  lastName: string;
  email: string;
}

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [appointments, setAppointments] = useState<FormattedAppointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null);
  const [showUpcoming, setShowUpcoming] = useState(true);
  const [userCache, setUserCache] = useState<Map<string, UserDetails>>(new Map());

  useEffect(() => {
    if (isLoaded && user) {
      const userEmail = user.emailAddresses[0]?.emailAddress;
      const isUserAdmin = userEmail === BARBER_EMAIL;
      setIsAdmin(isUserAdmin);
    }
  }, [isLoaded, user]);

  // Function to fetch user details from Clerk with caching
  const fetchUserDetails = async (userId: string): Promise<UserDetails | null> => {
    // Check cache first
    if (userCache.has(userId)) {
      return userCache.get(userId) || null;
    }

    try {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        // Return a fallback user details
        const fallbackUser = {
          firstName: 'Unknown',
          lastName: 'User',
          email: 'unknown@email.com'
        };
        userCache.set(userId, fallbackUser);
        return fallbackUser;
      }
      const userDetails = await response.json();
      // Cache the result
      userCache.set(userId, userDetails);
      return userDetails;
    } catch (error) {
      // Return a fallback user details
      const fallbackUser = {
        firstName: 'Unknown',
        lastName: 'User',
        email: 'unknown@email.com'
      };
      userCache.set(userId, fallbackUser);
      return fallbackUser;
    }
  };

  // Fetch appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!isLoaded || !user) {
        setIsLoadingAppointments(false);
        return;
      }

      setIsLoadingAppointments(true);
      setAppointmentsError(null);

      try {
        // Check if user is admin
        const userEmail = user.emailAddresses[0]?.emailAddress;
        const isUserAdmin = userEmail === BARBER_EMAIL;
        
        // Build query - ALL appointments for admin, user-specific for regular users
        let query = supabase
          .from('appointments')
          .select('*');
        
        // If not admin, filter by user_id
        if (!isUserAdmin) {
          query = query.eq('user_id', user.id);
        }
        
        const { data, error } = await query
          .order('date', { ascending: true })
          .order('time', { ascending: true });

        if (error) {
          console.error('Error fetching appointments');
          setAppointmentsError(`Error fetching appointments: ${error.message}`);
          return;
        }

        // First, format appointments without user names
        const formattedAppointments: FormattedAppointment[] = (data || []).map((appointment: DatabaseAppointment) => {
          // Parse date properly to avoid timezone issues
          const [year, month, day] = appointment.date.split('-').map(Number);
          const dateObj = new Date(year, month - 1, day); // month is 0-indexed
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
            barberName: isUserAdmin ? 'Loading...' : 'Professional Barber', // Show loading for admin initially
            date: formattedDate,
            time: formattedTime,
            status,
            barberImage: 'https://randomuser.me/api/portraits/men/32.jpg',
            originalDate: appointment.date,
            userId: appointment.user_id,
            userName: undefined // Will be populated later for admin
          };
        });
        
        // Set appointments immediately so they show up quickly
        setAppointments(formattedAppointments);

        // If admin, fetch user names in the background
        if (isUserAdmin && formattedAppointments.length > 0) {
          
          // Get unique user IDs
          const uniqueUserIds = [...new Set(formattedAppointments.map(apt => apt.userId).filter(Boolean))];

          // Fetch user details for all unique user IDs in parallel
          const userDetailsPromises = uniqueUserIds.map(userId => 
            fetchUserDetails(userId as string)
          );

          try {
            const userDetailsResults = await Promise.all(userDetailsPromises);
            
            // Create a map of userId to user details
            const userDetailsMap = new Map<string, UserDetails>();
            uniqueUserIds.forEach((userId, index) => {
              const userDetails = userDetailsResults[index];
              if (userDetails && userId) {
                userDetailsMap.set(userId, userDetails);
              }
            });

            // Update appointments with user names
            const appointmentsWithNames = formattedAppointments.map(appointment => {
              if (appointment.userId && userDetailsMap.has(appointment.userId)) {
                const userDetails = userDetailsMap.get(appointment.userId)!;
                const userName = `${userDetails.firstName} ${userDetails.lastName}`.trim() || userDetails.email;
                return { 
                  ...appointment, 
                  userName,
                  barberName: userName // Use customer name as barberName for admin
                };
              }
              return appointment;
            });

            setAppointments(appointmentsWithNames);
          } catch (userFetchError) {
            // Keep the appointments without user names
          }
        }
        
      } catch (err) {
        console.error('Failed to fetch appointments');
        setAppointmentsError(`Failed to fetch appointments: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setIsLoadingAppointments(false);
      }
    };

    fetchAppointments();
  }, [isLoaded, user?.id]);

  // Filter appointments based on upcoming/past
  const filteredAppointments = appointments.filter(appointment => {
    const appointmentDate = new Date(appointment.originalDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
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

  return (
    <div className="space-y-8">
      {/* Show admin indicator */}
      {isAdmin && (
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          <p className="font-semibold">Admin Dashboard</p>
          <p className="text-sm">You are viewing all appointments from all users.</p>
        </div>
      )}

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
          <h2 className="text-2xl font-semibold">
            {isAdmin ? 'All Appointments' : 'Your Appointments'}
          </h2>
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
              <p className="text-gray-600">Loading appointments...</p>
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
                {showUpcoming && !isAdmin && (
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
              <div key={appointment.id}>
                <AppointmentCard
                  service={appointment.service}
                  barberName={appointment.barberName}
                  date={appointment.date}
                  time={appointment.time}
                  status={appointment.status}
                  barberImage={appointment.barberImage}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}