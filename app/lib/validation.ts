// Input validation utilities
export function validateAppointmentId(appointmentId: string): boolean {
    // UUID v4 format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(appointmentId);
  }
  
  export function validateServiceType(serviceType: string): boolean {
    const validServices = ['Barber', 'Salon'];
    return validServices.includes(serviceType);
  }
  
  export function sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }
  
  export function validateUserId(userId: string): boolean {
    // Clerk user IDs typically start with 'user_' followed by alphanumeric characters
    return /^user_[a-zA-Z0-9]+$/.test(userId);
  }