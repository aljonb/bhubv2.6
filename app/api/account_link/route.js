import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '../../lib/stripe'

export async function POST(req) {
  try {
    const { account } = await req.json();
    const headersList = headers();
    const origin = headersList.get('origin');

    const accountLink = await stripe.accountLinks.create({
      account: account,
      refresh_url: `${origin}/refresh/${account}`,
      return_url: `${origin}/return/${account}`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      url: accountLink.url,
    });
  } catch (error) {
    console.error(
      "An error occurred when calling the Stripe API to create an account link:",
      error
    );
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}