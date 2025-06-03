import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface AppointmentData {
  id: string;
  user_id: string;
  service_type: string;
  date: string;
  time: string;
  timezone?: string;
  payment_status?: string;
  payment_intent_id?: string;
  created_at: string;
  updated_at?: string;
}

export async function getAppointmentById(appointmentId: string): Promise<AppointmentData | null> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (error) {
      console.error('Error fetching appointment:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception in getAppointmentById:', error);
    return null;
  }
}

export async function validateAppointmentOwnership(appointmentId: string, userId: string): Promise<boolean> {
  const appointment = await getAppointmentById(appointmentId);
  return appointment ? appointment.user_id === userId : false;
}

export async function validateAppointmentStatus(appointmentId: string): Promise<boolean> {
  const appointment = await getAppointmentById(appointmentId);
  // Only allow payment for pending appointments
  return appointment ? (appointment.payment_status === 'pending' || !appointment.payment_status) : false;
}