import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@clerk/nextjs/server'
import { stripe } from '../../lib/stripe'
import { getAppointmentById, validateAppointmentOwnership, validateAppointmentStatus } from '../../lib/appointment-utils'
import { getDefaultBarber, getBarberById, validateBarberForService } from '../../lib/barber-config'

export async function POST(req) {
  try {
    // Get the authenticated user from Clerk
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the request body
    const body = await req.json();
    const { appointmentId, barberId } = body;
    
    // Validate required fields
    if (!appointmentId) {
      return NextResponse.json(
        { error: 'Missing appointment ID' },
        { status: 400 }
      );
    }

    // SECURITY: Validate appointment exists and get details
    const appointment = await getAppointmentById(appointmentId);
    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // SECURITY: Validate appointment ownership
    const isValidOwnership = await validateAppointmentOwnership(appointmentId, userId);
    if (!isValidOwnership) {
      return NextResponse.json(
        { error: 'Invalid appointment or access denied' },
        { status: 403 }
      );
    }

    // SECURITY: Validate appointment status (prevent double payment)
    const isValidStatus = await validateAppointmentStatus(appointmentId);
    if (!isValidStatus) {
      return NextResponse.json(
        { error: 'Appointment is not available for payment' },
        { status: 400 }
      );
    }

    // SECURITY: Determine barber configuration server-side
    let barberConfig;
    if (barberId) {
      // Validate provided barber ID
      barberConfig = getBarberById(barberId);
      if (!barberConfig) {
        return NextResponse.json(
          { error: 'Invalid barber ID' },
          { status: 400 }
        );
      }
      
      // Validate barber can provide this service
      if (!validateBarberForService(barberId, appointment.service_type)) {
        return NextResponse.json(
          { error: 'Barber cannot provide this service type' },
          { status: 400 }
        );
      }
    } else {
      // Use default barber if none specified
      try {
        barberConfig = getDefaultBarber();
      } catch (error) {
        return NextResponse.json(
          { error: 'No barbers available' },
          { status: 500 }
        );
      }
    }

    const headersList = await headers()
    const origin = headersList.get('origin')

    // SECURITY: Use server-validated Stripe account ID
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Barber Appointment',
              description: `${appointment.service_type} service with ${barberConfig.name}`,
            },
            unit_amount: 4000, // $40.00 - consider making this configurable per service
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/appointments?canceled=true`,
      metadata: {
        appointment_id: appointmentId,
        barber_id: barberConfig.id,
      },
      payment_intent_data: {
        metadata: {
          appointment_id: appointmentId,
          user_id: userId,
          service_type: appointment.service_type,
          barber_name: barberConfig.name,
          barber_id: barberConfig.id,
        },
        transfer_data: {
          destination: barberConfig.stripeAccountId, // SECURITY: Server-controlled destination
        },
        application_fee_amount: 400, // Consider making this configurable
      },
    });
    
    return NextResponse.json({ 
      url: session.url,
      barber: {
        id: barberConfig.id,
        name: barberConfig.name
      }
    });
  } catch (err) {
    console.error('Checkout session creation error:', err);
    
    // SECURITY: Don't expose internal error details
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

// SECURITY: Remove the GET method entirely as it bypasses all security checks