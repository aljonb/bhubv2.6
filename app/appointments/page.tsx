'use client';

import React, { useState, useEffect } from 'react';
import { DateTime } from 'luxon';
import { useUser } from '@clerk/nextjs';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Service types for the appointment
type ServiceType = 'Barber' | 'Salon';

interface Appointment {
  id: string;
  serviceType: ServiceType;
  date: string; // ISO date string
  time?: string; // Time in HH:MM format
  userId: string;
}

const AppointmentsPage = () => {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's appointments from Supabase
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
        
        // Only fetch the current user's appointments
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('user_id', user.id);
          
        if (error) {
          console.error('Supabase error details:', error);
          setError(`Error fetching appointments: ${error.message}`);
          return;
        }
        
        console.log('User appointments fetched:', data?.length || 0);
        
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
  }, [isUserLoaded, user]);

  // Get service type color
  const getServiceColor = (serviceType: ServiceType): string => {
    return serviceType === 'Barber' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
  };
  
  // Get icon class for service type
  const getServiceIcon = (serviceType: ServiceType): string => {
    return serviceType === 'Barber' ? '✂️' : '💇';
  };
  
  // Get sorted appointments by date, then time
  const getSortedAppointments = (): Appointment[] => {
    return [...appointments].sort((a, b) => {
      // First sort by date
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      
      // If dates are equal, sort by time
      const timeA = a.time || '00:00';
      const timeB = b.time || '00:00';
      return timeA.localeCompare(timeB);
    });
  };

  // Delete appointment function
  const deleteAppointment = async (id: string) => {
    try {
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
    return <div className="p-4 max-w-4xl mx-auto">Loading your appointments...</div>;
  }

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
            {getSortedAppointments().map(appointment => (
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
};

export default AppointmentsPage; 