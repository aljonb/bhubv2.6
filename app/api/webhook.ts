import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '../lib/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// This is your Stripe webhook secret for testing endpoint locally
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  let event;
  
  // Get the signature from the headers
  const signature = req.headers.get('stripe-signature');
  
  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: 'Missing signature or webhook secret' },
      { status: 400 }
    );
  }
  
  try {
    // Get the raw body
    const rawBody = await req.text();
    
    // Verify the event
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );
  } catch (err: unknown) {
    console.error('Webhook signature verification failed', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${errorMessage}` },
      { status: 400 }
    );
  }
  
  // Handle the event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    
    try {
      // Extract appointment ID from metadata (you'll need to add this when creating payment)
      const appointmentId = paymentIntent.metadata?.appointment_id;
      
      if (!appointmentId) {
        console.error('No appointment ID found in payment intent metadata');
        return NextResponse.json(
          { error: 'No appointment ID found in payment intent' },
          { status: 400 }
        );
      }
      
      // Update appointment status in database
      const { error } = await supabase
        .from('appointments')
        .update({ 
          payment_status: 'paid',
          payment_intent_id: paymentIntent.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);
      
      if (error) {
        console.error('Error updating appointment:', error);
        return NextResponse.json(
          { error: `Error updating appointment: ${error.message}` },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ status: 'success' });
    } catch (err: unknown) {
      console.error('Error processing payment intent succeeded event:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return NextResponse.json(
        { error: `Error processing payment: ${errorMessage}` },
        { status: 500 }
      );
    }
  }
  
  // Return a response to acknowledge receipt of the event
  return NextResponse.json({ received: true });
}

// Needed for Stripe webhook verification
export const config = {
  api: {
    bodyParser: false,
  },
};
