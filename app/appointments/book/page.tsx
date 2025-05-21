'use client';

import React, { useState, useEffect } from 'react';
import { DateTime, Info, IANAZone } from 'luxon';
import { useUser } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Debugging - check if env vars are properly loaded
console.log('Supabase URL loaded:', !!supabaseUrl);
console.log('Supabase key loaded:', !!supabaseAnonKey);

// Service types for the appointment
type ServiceType = 'Barber' | 'Salon';

interface Appointment {
  id: string;
  serviceType: ServiceType;
  date: string; // ISO date string
  time?: string; // Time in HH:MM format
  userId: string; // Add this field to track which user owns each appointment
}

interface CalendarDay {
  date: DateTime;
  isCurrentMonth: boolean;
}

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

// Service types available
const SERVICE_TYPES: ServiceType[] = ['Barber', 'Salon'];

// Generate time slots in 15-minute intervals
const generateTimeSlots = (): string[] => {
  const slots: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const formattedHour = hour.toString().padStart(2, '0');
      const formattedMinute = minute.toString().padStart(2, '0');
      slots.push(`${formattedHour}:${formattedMinute}`);
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

// This interface is intentionally empty and only used for typing
// We keep it for future extensibility
interface CalendarProps {
  /* This component currently doesn't require props */
}

const Calendar = ({}: CalendarProps) => {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [timezone, setTimezone] = useState<string>(DateTime.local().zoneName || 'UTC');
  const [currentDate, setCurrentDate] = useState<DateTime>(DateTime.local().setZone(timezone));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<DateTime | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceType>('Barber');
  const [selectedTime, setSelectedTime] = useState('09:00'); // Default to 9 AM
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Update date when timezone changes
  useEffect(() => {
    setCurrentDate(prev => prev.setZone(timezone));
    
    // If a date is selected, update its timezone too
    if (selectedDate) {
      setSelectedDate(selectedDate.setZone(timezone));
    }
  }, [timezone, selectedDate]);
  
  // Fetch appointments from Supabase when user is loaded
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
        
        // Updated query to fetch ALL appointments, not just the current user's
        const { data, error } = await supabase
          .from('appointments')
          .select('*');
          
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
          userId: item.user_id // Add this field to track which user owns each appointment
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
  }, [isUserLoaded, user]);
  
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
  
  // Get sorted appointments by time
  const getSortedAppointments = (appointmentList: Appointment[]): Appointment[] => {
    return [...appointmentList].sort((a, b) => {
      const timeA = a.time || '00:00';
      const timeB = b.time || '00:00';
      return timeA.localeCompare(timeB);
    });
  };
  
  const addAppointment = async () => {
    if (!user) {
      alert('You must be logged in to book an appointment');
      return;
    }
    
    if (selectedDate) {
      // Check if slot is available
      const dateString = selectedDate.toISODate() as string;
      const timeSlotAvailable = !appointments.some(
        appointment => appointment.date === dateString && appointment.time === selectedTime
      );
      
      if (timeSlotAvailable) {
        try {
          // Add to Supabase with pending status
          const { data, error } = await supabase
            .from('appointments')
            .insert([
              {
                user_id: user.id,
                service_type: selectedService,
                date: dateString,
                time: selectedTime,
                payment_status: 'pending'
              }
            ])
            .select('id');
            
          if (error) {
            console.error('Supabase error details:', error);
            alert(`Failed to save appointment: ${error.message || 'Unknown error'}`);
            return;
          }
          
          if (!data || data.length === 0) {
            console.error('No data returned from insert operation');
            alert('Failed to save appointment: No data returned');
            return;
          }
          
          const appointmentId = data[0].id;
          
          // Use your connected account ID here
          const connectedAccountId = 'acct_1RRK36RrE9xuSNyI';
          
          // Call our API with appointment ID and connected account
          const response = await fetch('/api/checkout_sessions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              appointmentId,
              connectedAccountId
            }),
          });
          
          const { url, error: checkoutError } = await response.json();
          
          if (url) {
            window.location.href = url;
          } else {
            console.error('Error creating checkout session:', checkoutError);
            alert(`Failed to create checkout session: ${checkoutError || 'Unknown error'}`);
          }
        } catch (err) {
          console.error('Error creating appointment:', err);
          alert(`Failed to create appointment: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      } else {
        alert('This time slot is already booked. Please select another time.');
      }
    }
  };
  
  // Delete appointment function
  const deleteAppointment = async (id: string) => {
    try {
      const appointment = appointments.find(app => app.id === id);
      
      // Check if appointment exists and belongs to current user
      if (!appointment || appointment.userId !== user?.id) {
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
  
  const handleDateClick = (date: DateTime) => {
    setSelectedDate(date);
    setShowModal(true);
  };
  
  // Get service type color
  const getServiceColor = (serviceType: ServiceType): string => {
    return serviceType === 'Barber' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
  };
  
  // Get icon class for service type
  const getServiceIcon = (serviceType: ServiceType): string => {
    return serviceType === 'Barber' ? '✂️' : '💇';
  };

  const calendarDays = generateCalendar();
  const weekdays = Info.weekdays('short');

  // Update the appointments list to include a delete button
  const appointmentsList = getSortedAppointments(getAppointmentsForDate(selectedDate || DateTime.now())).map(appointment => (
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
        {appointment.userId === user?.id && (
          <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Your booking</span>
        )}
      </div>
      {appointment.userId === user?.id && (
        <button 
          onClick={() => deleteAppointment(appointment.id)}
          className="text-red-600 hover:text-red-800"
        >
          Delete
        </button>
      )}
    </div>
  ));
  
  // Add error display to the component
  if (error) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <p className="text-sm mt-2">
            Please make sure your Supabase configuration is correct and try again.
          </p>
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

  // Add loading state to component render
  if (isLoading) {
    return <div className="p-4 max-w-4xl mx-auto">Loading appointments...</div>;
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
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
          else if (appointmentCount >= 3) bgColor = 'bg-blue-150';
          
          // Check if this is the current day in the selected timezone
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
              
              <div className="absolute bottom-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600">
                +
              </div>
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
            
            <div className="flex flex-col md:flex-row gap-6">
              {/* Left column - Time selection */}
              <div className="w-full md:w-1/3 order-2 md:order-1">
                <div className="border-t md:border-t-0 pt-4 md:pt-0 md:border-r pr-4">
                  <h4 className="font-medium mb-3 text-lg">Add New Appointment</h4>
                  <div className="flex flex-col space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Time:</label>
                      <select
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="w-full p-2 border rounded"
                      >
                        {TIME_SLOTS.map(time => {
                          // Check if this time slot is already booked
                          const isBooked = selectedDate ? getAppointmentsForDate(selectedDate)
                            .some(appointment => appointment.time === time) : false;
                          
                          return (
                            <option 
                              key={time} 
                              value={time} 
                              disabled={isBooked}
                            >
                              {time} {isBooked ? '(Booked)' : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Service:</label>
                      <select
                        value={selectedService}
                        onChange={(e) => setSelectedService(e.target.value as ServiceType)}
                        className="w-full p-2 border rounded"
                      >
                        {SERVICE_TYPES.map(service => (
                          <option key={service} value={service}>
                            {getServiceIcon(service)} {service}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <button 
                      className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full"
                      onClick={addAppointment}
                    >
                      Add Appointment
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Right column - Appointments list */}
              <div className="w-full md:w-2/3 order-1 md:order-2">
                <h4 className="font-medium mb-4 text-lg">Appointments</h4>
                {appointmentsList}
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

export default Calendar;
