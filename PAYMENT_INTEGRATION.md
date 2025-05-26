# Stripe Payment Integration Guide

## Overview

This document outlines the complete Stripe payment integration for the BarberHub application. The integration uses Stripe as the single source of truth for payment data, with Clerk for authentication and minimal Supabase usage for appointment management.

## Architecture

### Data Flow
1. **User books appointment** → Supabase (appointment record with pending status)
2. **Payment processing** → Stripe Checkout Session with metadata
3. **Payment completion** → Stripe webhook updates appointment status
4. **Payment history** → Fetched directly from Stripe API

### Key Components

#### API Routes
- `GET /api/payments` - Fetch user's payment history from Stripe
- `GET /api/payments/[id]` - Fetch specific payment details
- `POST /api/checkout_sessions` - Create Stripe checkout session (updated with user metadata)
- `POST /api/webhook` - Handle Stripe webhook events

#### Utility Functions (`app/lib/stripe-utils.ts`)
- `getPaymentsByMetadata()` - Fetch payments by Clerk user ID
- `getPaymentIntent()` - Get specific payment details
- `transformToPaymentHistory()` - Convert Stripe data to app format
- `calculatePaymentStats()` - Generate payment statistics

#### React Components
- `PaymentCard` - Display individual payment records
- `usePayments` hook - Manage payment data fetching and state

## Implementation Details

### 1. Stripe Metadata Strategy

When creating checkout sessions, we store essential user and appointment data in Stripe metadata:

```javascript
payment_intent_data: {
  metadata: {
    appointment_id: appointmentId,
    user_id: userId,           // Clerk user ID
    service_type: serviceType, // 'Barber' or 'Salon'
    barber_name: barberName,   // Professional name
  }
}
```

### 2. Payment Data Transformation

Stripe payment intents are transformed into a consistent format:

```typescript
interface PaymentHistoryItem {
  id: string;                    // Stripe payment intent ID
  date: string;                  // Formatted date
  service: string;               // From metadata.service_type
  barberName: string;            // From metadata.barber_name
  amount: number;                // Amount in dollars (converted from cents)
  tip?: number;                  // Future enhancement
  total: number;                 // amount + tip
  paymentMethod: PaymentMethod;  // Derived from Stripe payment method
  status: PaymentStatus;         // Stripe payment status
  receiptUrl?: string;           // Stripe receipt URL
  appointmentId?: string;        // From metadata.appointment_id
  stripePaymentIntentId: string; // Stripe payment intent ID
  barberImage?: string;          // Default or dynamic image
}
```

### 3. User Authentication Integration

The system uses Clerk's `auth()` function to:
- Authenticate API requests
- Filter payments by user ID in metadata
- Ensure users only see their own payment data

### 4. Error Handling

Comprehensive error handling includes:
- API authentication errors (401)
- Stripe API errors (500)
- Data transformation errors
- Network connectivity issues
- Loading and empty states in UI

## Setup Instructions

### 1. Environment Variables

Ensure these environment variables are set:

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase (for appointments only)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 2. Stripe Webhook Configuration

Configure your Stripe webhook endpoint to listen for:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

Webhook URL: `https://yourdomain.com/api/webhook`

### 3. Testing

To test the integration:

1. **Create a test appointment** via `/appointments/book`
2. **Complete payment** through Stripe Checkout
3. **Verify webhook** updates appointment status in Supabase
4. **Check payment history** at `/payments`

## File Structure

```
app/
├── api/
│   ├── payments/
│   │   ├── route.ts              # Main payments API
│   │   └── [id]/route.ts         # Individual payment details
│   ├── checkout_sessions/
│   │   └── route.js              # Updated with user metadata
│   └── webhook.ts                # Stripe webhook handler
├── lib/
│   ├── stripe-utils.ts           # Stripe utility functions
│   ├── payment-types.ts          # TypeScript interfaces
│   └── stripe.js                 # Stripe client configuration
├── hooks/
│   └── usePayments.ts            # React hook for payment data
├── components/
│   └── PaymentCard.tsx           # Payment display component
└── payments/
    └── page.tsx                  # Main payments page
```

## Key Features

### ✅ Implemented
- Real-time payment data from Stripe
- User-specific payment filtering
- Payment method detection and display
- Receipt URL integration
- Payment status tracking
- Comprehensive error handling
- Loading states and empty states
- Payment statistics calculation

### 🚧 Future Enhancements
- Tip tracking and management
- Payment refund handling
- Advanced filtering (date ranges, amounts)
- Payment export functionality
- Email receipt integration
- Payment dispute management

## Security Considerations

1. **API Authentication**: All payment APIs require Clerk authentication
2. **Data Isolation**: Users can only access their own payment data
3. **Webhook Verification**: Stripe webhook signatures are verified
4. **Metadata Validation**: Payment metadata is validated before processing
5. **Error Information**: Sensitive error details are not exposed to clients

## Troubleshooting

### Common Issues

1. **No payments showing**: Check Clerk user ID in Stripe metadata
2. **Webhook failures**: Verify webhook secret and endpoint URL
3. **Authentication errors**: Ensure Clerk is properly configured
4. **Payment method icons**: Verify icon files exist in `/public/icons/`

### Debug Steps

1. Check browser console for API errors
2. Verify Stripe dashboard for payment intent metadata
3. Check webhook delivery logs in Stripe dashboard
4. Validate environment variables are loaded correctly

## Performance Considerations

- Payment data is fetched on-demand, not cached
- Stripe API calls are limited to 100 payments per request
- Consider implementing pagination for users with many payments
- Payment statistics are calculated server-side for efficiency

## Compliance Notes

- PCI compliance is handled by Stripe
- No sensitive payment data is stored in your database
- User data is handled according to Clerk's privacy policies
- Webhook data should be processed securely and not logged in production 