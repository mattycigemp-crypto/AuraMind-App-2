import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const json = (res: VercelResponse, status: number, body: Record<string, unknown>) => {
  res.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    return json(res, 500, { error: 'Stripe secret key not configured.' });
  }

  const stripe = new Stripe(stripeSecret);

  const { priceId, userId, email, returnUrl } = req.body || {};

  if (!priceId || !userId || !email) {
    return json(res, 400, { error: 'priceId, userId, and email are required.' });
  }

  const origin = returnUrl || req.headers.origin || 'https://www.auramind.app';

  try {
    // Check if Stripe customer already exists for this user
    const existingCustomers = await stripe.customers.list({ email, limit: 1 });
    let customerId: string | undefined;

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;

      // Check if they already have an active/trialing subscription
      const existingSubs = await stripe.subscriptions.list({
        customer: customerId,
        status: 'all',
        limit: 10,
      });

      const activeSub = existingSubs.data.find(
        (sub) => sub.status === 'active' || sub.status === 'trialing'
      );

      if (activeSub) {
        return json(res, 200, {
          alreadySubscribed: true,
          subscriptionId: activeSub.id,
          status: activeSub.status,
        });
      }
    }

    // Create Checkout Session with 7-day trial (card required)
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_collection: 'always',
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,
        metadata: { supabase_user_id: userId },
      },
      customer: customerId,
      customer_email: customerId ? undefined : email,
      metadata: { supabase_user_id: userId },
      success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}&payment=success`,
      cancel_url: `${origin}/subscribe?payment=cancelled`,
      allow_promotion_codes: true,
    });

    return json(res, 200, { url: session.url, sessionId: session.id });
  } catch (err: any) {
    console.error('Stripe Checkout error:', err);
    return json(res, 500, { error: err.message || 'Failed to create checkout session.' });
  }
}
