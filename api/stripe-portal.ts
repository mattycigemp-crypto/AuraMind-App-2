import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const json = (res: VercelResponse, status: number, body: Record<string, unknown>) => {
  res.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!stripeSecret || !supabaseUrl || !supabaseAnonKey) {
    return json(res, 500, { error: 'Server configuration missing.' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return json(res, 401, { error: 'No authorization header provided.' });
  }

  const token = authHeader.split(' ')[1];
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return json(res, 401, { error: 'Invalid or expired session.' });
  }

  const stripe = new Stripe(stripeSecret);
  const email = user.email;
  let customerId = user.user_metadata?.stripe_customer_id;

  try {
    if (!customerId && email) {
      // Fallback: look up by email if not in metadata
      const customers = await stripe.customers.list({ email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }
    }

    if (!customerId) {
      return json(res, 400, { error: 'No active Stripe customer found for this account. Please subscribe first.' });
    }

    const origin = req.headers.origin || 'https://www.auramind.app';

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/settings`,
    });

    return json(res, 200, { url: session.url });
  } catch (err: any) {
    console.error('Stripe Portal error:', err);
    return json(res, 500, { error: err.message || 'Failed to create billing portal session.' });
  }
}
