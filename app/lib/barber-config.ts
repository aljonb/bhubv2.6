import { createClient } from '@supabase/supabase-js';

// Secure barber configuration - move to environment variables in production
export interface BarberConfig {
    id: string;
    name: string;
    email: string;
    stripeAccountId: string;
    services: string[];
    isActive: boolean;
  }
  
// Use service role for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Cache for barber configurations (refresh every 5 minutes)
let barberCache: BarberConfig[] = [];
let cacheExpiry = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch all active barbers from database with caching
 */
async function fetchBarbers(): Promise<BarberConfig[]> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (barberCache.length > 0 && now < cacheExpiry) {
    return barberCache;
  }

  try {
    const { data, error } = await supabase
      .from('barbers')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching barbers:', error);
      // Return cached data if available, otherwise throw
      if (barberCache.length > 0) {
        console.warn('Using cached barber data due to database error');
        return barberCache;
      }
      throw new Error('Failed to fetch barber configurations');
    }

    // Transform database format to BarberConfig interface
    barberCache = data.map(barber => ({
      id: barber.id,
      name: barber.name,
      email: barber.email,
      stripeAccountId: barber.stripe_account_id,
      services: barber.services || [],
      isActive: barber.is_active
    }));

    cacheExpiry = now + CACHE_DURATION;
    return barberCache;
  } catch (error) {
    console.error('Database error fetching barbers:', error);
    
    // Fallback to cached data if available
    if (barberCache.length > 0) {
      console.warn('Using cached barber data due to database error');
      return barberCache;
    }
    
    throw new Error('No barber configurations available');
  }
}

/**
 * Get barber by Stripe account ID
 */
export async function getBarberByAccountId(accountId: string): Promise<BarberConfig | null> {
  const barbers = await fetchBarbers();
  return barbers.find(barber => barber.stripeAccountId === accountId) || null;
}

/**
 * Get barber by ID
 */
export async function getBarberById(barberId: string): Promise<BarberConfig | null> {
  const barbers = await fetchBarbers();
  return barbers.find(barber => barber.id === barberId) || null;
}

/**
 * Get default/first active barber
 */
export async function getDefaultBarber(): Promise<BarberConfig> {
  const barbers = await fetchBarbers();
  
  if (barbers.length === 0) {
    throw new Error('No active barbers configured');
  }
  
  return barbers[0];
}

/**
 * Validate if barber can provide specific service
 */
export async function validateBarberForService(barberId: string, serviceType: string): Promise<boolean> {
  const barber = await getBarberById(barberId);
  return barber ? barber.services.includes(serviceType) : false;
}

/**
 * Get all active barbers (for admin/selection purposes)
 */
export async function getAllActiveBarbers(): Promise<BarberConfig[]> {
  return await fetchBarbers();
}