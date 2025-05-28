'use client';

import React, { useState, useEffect, useRef } from 'react';
import { DateTime, Info, IANAZone } from 'luxon';
import { useUser } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Barber email for admin access
const BARBER_EMAIL = 'bushatia777@gmail.com';

// Service types for the appointment
type ServiceType = 'Barber' | 'Salon';

interface Appointment {
  id: string;
  serviceType: ServiceType;
  date: string; // ISO date string
  time?: string; // Time in HH:MM format
  userId: string;
}

interface CalendarDay {
  date: DateTime;
  isCurrentMonth: boolean;
}

// User details interface
interface UserDetails {
  firstName: string;
  lastName: string;
  email: string;
}

// User cache to avoid repeated API calls
const userCache = new Map<string, UserDetails | 'not_found' | 'error'>();
const pendingRequests = new Map<string, Promise<UserDetails | 'not_found' | 'error'>>();

// Rate limiting: delay between requests
const requestDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 100; // 100ms between requests

// Function to fetch user details with caching and rate limiting
const fetchUserDetailsWithCache = async (userId: string): Promise<UserDetails | 'not_found' | 'error'> => {
  // Check cache first
  if (userCache.has(userId)) {
    return userCache.get(userId)!;
  }

  // Check if request is already pending
  if (pendingRequests.has(userId)) {
    return pendingRequests.get(userId)!;
  }

  // Create new request with rate limiting
  const requestPromise = (async () => {
    try {
      // Rate limiting
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;
      if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        await requestDelay(MIN_REQUEST_INTERVAL - timeSinceLastRequest);
      }
      lastRequestTime = Date.now();

      console.log(`Fetching details for user: ${userId}`);
      const response = await fetch(`/api/users/${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`User details received for ${userId}:`, data);
        userCache.set(userId, data);
        return data;
      } else if (response.status === 404) {
        console.log(`User ${userId} not found`);
        userCache.set(userId, 'not_found');
        return 'not_found';
      } else if (response.status === 429) {
        console.log(`Rate limited for user ${userId}, will retry later`);
        // Don't cache rate limit errors, allow retry later
        return 'error';
      } else {
        console.error(`Failed to fetch user details for ${userId}:`, {
          status: response.status,
          statusText: response.statusText
        });
        userCache.set(userId, 'error');
        return 'error';
      }
    } catch (error) {
      console.error(`Network error fetching user details for ${userId}:`, error);
      userCache.set(userId, 'error');
      return 'error';
    } finally {
      pendingRequests.delete(userId);
    }
  })();

  pendingRequests.set(userId, requestPromise);
  return requestPromise;
};

// User info component with improved caching
const UserInfo = ({ userId, isBarber }: { userId: string; isBarber: boolean }) => {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!isBarber || !userId) {
      return;
    }

    const loadUserDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await fetchUserDetailsWithCache(userId);
        
        if (!mounted.current) return; // Component unmounted
        
        if (result === 'not_found') {
          setError('User not found');
        } else if (result === 'error') {
          setError('Error loading user');
        } else {
          setUserDetails(result);
        }
      } catch (err) {
        if (!mounted.current) return;
        console.error(`Error loading user ${userId}:`, err);
        setError('Network error');
      } finally {
        if (mounted.current) {
          setLoading(false);
        }
      }
    };

    loadUserDetails();
  }, [userId, isBarber]);

  if (!isBarber) {
    return null; // Regular users don't see other users' names
  }

  if (loading) {
    return <span className="ml-2 text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">Loading...</span>;
  }

  // If there was an error fetching user details
  if (error) {
    if (error.includes('not found')) {
      return (
        <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded" title={`User ${userId} not found in Clerk`}>
          Former User
        </span>
      );
    }
    
    return (
      <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded" title={error}>
        Error Loading User
      </span>
    );
  }

  if (!userDetails) {
    return (
      <span className="ml-2 text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
        User ID: {userId.substring(0, 8)}...
      </span>
    );
  }

  // Create full name, handling cases where lastName might be empty
  const fullName = `${userDetails.firstName}${userDetails.lastName ? ' ' + userDetails.lastName : ''}`.trim();
  const displayName = fullName || userDetails.email.split('@')[0] || 'Unknown User';

  return (
    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded" title={userDetails.email}>
      {displayName}
    </span>
  );
};

// Common timezones for the dropdown
const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
  'Pacific/Auckland'
];

const AppointmentsPage = () => {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timezone, setTimezone] = useState<string>(DateTime.local().zoneName || 'UTC');
  const [currentDate, setCurrentDate] = useState<DateTime>(DateTime.local().setZone(timezone));
  const [selectedDate, setSelectedDate] = useState<DateTime | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Check if current user is the barber
  const isBarber = user?.emailAddresses?.[0]?.emailAddress === BARBER_EMAIL;

  // Update date when timezone changes
  useEffect(() => {
    setCurrentDate(prev => prev.setZone(timezone));
    if (selectedDate) {
      setSelectedDate(selectedDate.setZone(timezone));
    }
  }, [timezone, selectedDate]);

  // Fetch appointments from Supabase
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!isUserLoaded) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        if (!user) {
          console.log('No user logged in - skipping appointment fetch');
          setIsLoading(false);
          return;
        }
        
        // Barber sees all appointments, regular users see only their own
        const query = supabase.from('appointments').select('*');
        
        if (!isBarber) {
          query.eq('user_id', user.id);
        }
          
        const { data, error } = await query;
          
        if (error) {
          console.error('Supabase error details:', error);
          setError(`Error fetching appointments: ${error.message}`);
          return;
        }
        
        console.log('Appointments fetched:', data?.length || 0);
        
        const formattedAppointments: Appointment[] = (data || []).map(item => ({
          id: item.id,
          serviceType: item.service_type as ServiceType,
          date: item.date,
          time: item.time ? item.time.substring(0, 5) : undefined,
          userId: item.user_id
        }));
        
        setAppointments(formattedAppointments);
      } catch (err) {
        console.error('Exception in fetchAppointments:', err);
        setError(`Failed to fetch appointments: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAppointments();
  }, [isUserLoaded, user, isBarber]);

  // Calendar generation functions
  const startOfMonth = currentDate.startOf('month');
  const endOfMonth = currentDate.endOf('month');
  const startDate = startOfMonth.startOf('week');
  const endDate = endOfMonth.endOf('week');

  const generateCalendar = (): CalendarDay[] => {
    const days: CalendarDay[] = [];
    let current = startDate;
    while (current <= endDate) {
      days.push({
        date: current,
        isCurrentMonth: current.month === currentDate.month,
      });
      current = current.plus({ days: 1 });
    }
    return days;
  };

  const prevMonth = () => setCurrentDate(currentDate.minus({ months: 1 }));
  const nextMonth = () => setCurrentDate(currentDate.plus({ months: 1 }));
  
  const handleTimezoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTimezone = e.target.value;
    if (IANAZone.isValidZone(newTimezone)) {
      setTimezone(newTimezone);
    }
  };
  
  const getAppointmentsForDate = (date: DateTime): Appointment[] => {
    const dateString = date.toISODate() as string;
    return appointments.filter(appointment => appointment.date === dateString);
  };
  
  const getSortedAppointments = (appointmentList: Appointment[]): Appointment[] => {
    return [...appointmentList].sort((a, b) => {
      const timeA = a.time || '00:00';
      const timeB = b.time || '00:00';
      return timeA.localeCompare(timeB);
    });
  };

  const handleDateClick = (date: DateTime) => {
    setSelectedDate(date);
    setShowModal(true);
  };
  
  const getServiceColor = (serviceType: ServiceType): string => {
    return serviceType === 'Barber' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
  };
  
  const getServiceIcon = (serviceType: ServiceType): string => {
    return serviceType === 'Barber' ? '✂️' : '💇';
  };

  // Delete appointment function (only for barber or own appointments)
  const deleteAppointment = async (id: string) => {
    try {
      const appointment = appointments.find(app => app.id === id);
      
      if (!appointment || (!isBarber && appointment.userId !== user?.id)) {
        alert('You can only delete your own appointments');
        return;
      }
      
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error('Error deleting appointment:', error);
        alert('Failed to delete appointment. Please try again.');
        return;
      }
      
      setAppointments(appointments.filter(app => app.id !== id));
    } catch (error) {
      console.error('Error in deleteAppointment:', error);
      alert('Failed to delete appointment. Please try again.');
    }
  };

  if (error) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-4 max-w-4xl mx-auto">Loading appointments...</div>;
  }

  const calendarDays = generateCalendar();
  const weekdays = Info.weekdays('short');

  // Show different views for barber vs regular users
  if (!isBarber) {
    // Original list view for regular users
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Your Appointments</h1>
          <Link href="/appointments/book" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Book New Appointment
          </Link>
        </div>

        {!user ? (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            <p>Please sign in to view your appointments.</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="bg-gray-100 border border-gray-300 p-6 rounded-lg text-center">
            <p className="text-gray-600 mb-4">You don&apos;t have any appointments yet.</p>
            <Link href="/appointments/book" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Book Your First Appointment
            </Link>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="divide-y">
              {getSortedAppointments(appointments).map(appointment => (
                <div key={appointment.id} className="p-4 flex items-center justify-between">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="text-gray-700 font-medium w-32">
                      {DateTime.fromISO(appointment.date).toFormat('dd MMM yyyy')}
                    </div>
                    {appointment.time && (
                      <div className="text-blue-600 font-medium w-20">
                        {appointment.time}
                      </div>
                    )}
                    <div className={`px-2 py-1 rounded inline-flex items-center ${getServiceColor(appointment.serviceType)}`}>
                      <span className="mr-1">{getServiceIcon(appointment.serviceType)}</span>
                      {appointment.serviceType}
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteAppointment(appointment.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Calendar view for barber
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">All Appointments (Barber View)</h1>
        <div className="flex gap-2">
          <Link href="/appointments/book" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Book New Appointment
          </Link>
          <div className="bg-green-100 text-green-800 px-3 py-2 rounded text-sm">
            Total: {appointments.length} appointments
          </div>
        </div>
      </div>

      <div className="flex flex-col mb-4">
        <div className="flex justify-between items-center mb-4">
          <button onClick={prevMonth} className="px-3 py-1.5 bg-gray-200 rounded hover:bg-gray-300">Prev</button>
          <h2 className="text-2xl font-semibold">{currentDate.toFormat('MMMM yyyy')}</h2>
          <button onClick={nextMonth} className="px-3 py-1.5 bg-gray-200 rounded hover:bg-gray-300">Next</button>
        </div>
        
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="timezone" className="text-sm font-medium text-gray-700">Timezone:</label>
          <select
            id="timezone"
            value={timezone}
            onChange={handleTimezoneChange}
            className="ml-2 px-2 py-1 border rounded text-sm"
          >
            {COMMON_TIMEZONES.map(zone => (
              <option key={zone} value={zone}>
                {zone.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
        
        <div className="text-sm text-gray-500 text-right">
          Current time: {DateTime.now().setZone(timezone).toFormat('dd MMM yyyy HH:mm')}
        </div>
      </div>

      <div className="grid grid-cols-7 text-center font-bold text-gray-600 mb-1">
        {weekdays.map((day) => (
          <div key={day} className="py-2">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {calendarDays.map(({ date, isCurrentMonth }) => {
          const dateAppointments = getAppointmentsForDate(date);
          const appointmentCount = dateAppointments.length;
          
          // Determine background color based on appointment count
          let bgColor = 'bg-white';
          if (appointmentCount === 1) bgColor = 'bg-blue-50';
          else if (appointmentCount === 2) bgColor = 'bg-blue-100';
          else if (appointmentCount >= 3) bgColor = 'bg-blue-200';
          
          // Check if this is the current day
          const isToday = date.hasSame(DateTime.now().setZone(timezone), 'day');
          const todayClass = isToday ? 'ring-2 ring-blue-500' : '';
          
          return (
            <div
              key={date.toISODate()}
              className={`p-3 border text-sm cursor-pointer flex flex-col h-32 relative
                ${isCurrentMonth ? 'text-black' : 'text-gray-400'}
                ${bgColor} hover:bg-gray-100 transition-colors ${todayClass}`}
              onClick={() => handleDateClick(date)}
            >
              <div className="flex justify-between mb-2">
                <span className="font-medium text-base">{date.day}</span>
                {appointmentCount > 0 && (
                  <span className="text-xs bg-blue-500 text-white rounded-full px-1.5 py-0.5">
                    {appointmentCount}
                  </span>
                )}
              </div>
              
              {appointmentCount > 0 && (
                <div className="flex-grow text-left">
                  {appointmentCount === 1 ? (
                    <div className="text-xs">
                      {dateAppointments[0].time && (
                        <span className="text-blue-600 font-medium mr-1">
                          {dateAppointments[0].time}
                        </span>
                      )}
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium inline-flex items-center ${getServiceColor(dateAppointments[0].serviceType)}`}>
                        {getServiceIcon(dateAppointments[0].serviceType)} {dateAppointments[0].serviceType}
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-center mt-2 font-medium text-blue-500">
                      {appointmentCount} appointments
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {showModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-1">
              {selectedDate.toFormat('dd MMMM yyyy')}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {selectedDate.toFormat('EEEE')} ({timezone})
            </p>
            
            <div className="w-full">
              <h4 className="font-medium mb-4 text-lg">Appointments for this day</h4>
              <div className="space-y-3">
                {getSortedAppointments(getAppointmentsForDate(selectedDate)).map(appointment => (
                  <div key={appointment.id} className="p-3 bg-gray-50 rounded-md border border-gray-200 flex items-center justify-between">
                    <div className="flex items-center">
                      {appointment.time && (
                        <div className="text-blue-600 font-medium mr-3 w-16">
                          {appointment.time}
                        </div>
                      )}
                      <div className={`px-2 py-1 rounded ${getServiceColor(appointment.serviceType)}`}>
                        <span className="mr-1">{getServiceIcon(appointment.serviceType)}</span>
                        {appointment.serviceType}
                      </div>
                      <UserInfo userId={appointment.userId} isBarber={isBarber} />
                    </div>
                    <button 
                      onClick={() => deleteAppointment(appointment.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                ))}
                {getAppointmentsForDate(selectedDate).length === 0 && (
                  <p className="text-gray-500 text-center py-4">No appointments for this day</p>
                )}
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <button 
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage;