// Secure barber configuration - move to environment variables in production
export interface BarberConfig {
    id: string;
    name: string;
    email: string;
    stripeAccountId: string;
    services: string[];
    isActive: boolean;
  }
  
// Environment variable validation
if (!process.env.BARBER_STRIPE_ACCOUNT_ID) {
  throw new Error('BARBER_STRIPE_ACCOUNT_ID environment variable is required');
}
  
// This should be moved to environment variables or database in production
export const BARBER_CONFIGS: BarberConfig[] = [
    {
      id: 'barber_001',
      name: 'Professional Barber',
      email: 'bushatia777@gmail.com',
      stripeAccountId: process.env.BARBER_STRIPE_ACCOUNT_ID, // Using environment variable
      services: ['Barber', 'Salon'],
      isActive: true
    }
    // Add more barbers here as needed
  ];
  
  // Validation functions
  export function getBarberByAccountId(accountId: string): BarberConfig | null {
    return BARBER_CONFIGS.find(barber => 
      barber.stripeAccountId === accountId && barber.isActive
    ) || null;
  }
  
  export function getBarberById(barberId: string): BarberConfig | null {
    return BARBER_CONFIGS.find(barber => 
      barber.id === barberId && barber.isActive
    ) || null;
  }
  
  export function getDefaultBarber(): BarberConfig {
    const defaultBarber = BARBER_CONFIGS.find(barber => barber.isActive);
    if (!defaultBarber) {
      throw new Error('No active barbers configured');
    }
    return defaultBarber;
  }
  
  export function validateBarberForService(barberId: string, serviceType: string): boolean {
    const barber = getBarberById(barberId);
    return barber ? barber.services.includes(serviceType) : false;
  }