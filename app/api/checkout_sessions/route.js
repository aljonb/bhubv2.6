import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@clerk/nextjs/server'

import { stripe } from '../../lib/stripe'

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
    const { appointmentId, connectedAccountId, serviceType, barberName } = body;
    
    if (!appointmentId) {
      return NextResponse.json(
        { error: 'Missing appointment ID' },
        { status: 400 }
      );
    }
    
    const headersList = await headers()
    const origin = headersList.get('origin')

    // Create Checkout Sessions with appointment metadata
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Barber Appointment',
              description: 'Booking fee for your barber appointment',
            },
            unit_amount: 4000, // $40.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/appointments?canceled=true`,
      metadata: {
        appointment_id: appointmentId,
      },
      payment_intent_data: {
        metadata: {
          appointment_id: appointmentId,
          user_id: userId,
          service_type: serviceType || 'Barber Service',
          barber_name: barberName || 'Professional Barber',
        },
        transfer_data: {
          destination: connectedAccountId,
        },
        application_fee_amount: 400,
      },
    });
    
    return NextResponse.json({ url: session.url });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: err.statusCode || 500 }
    )
  }
}

// Also add a GET method to support direct URL access with query parameters
export async function GET(req) {
  try {
    const url = new URL(req.url);
    const appointmentId = url.searchParams.get('appointment_id');
    
    if (!appointmentId) {
      return NextResponse.json(
        { error: 'Missing appointment ID' },
        { status: 400 }
      );
    }
    
    const headersList = await headers()
    const origin = headersList.get('origin') || 'http://localhost:3000'

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Barber Appointment',
              description: 'Booking fee for your barber appointment',
            },
            unit_amount: 4000, // $40.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/appointments?canceled=true`,
      metadata: {
        appointment_id: appointmentId,
      },
    });
    
    return NextResponse.redirect(session.url, 303);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: err.statusCode || 500 }
    )
  }
}