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
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeSecret || !supabaseUrl || !supabaseServiceKey) {
    return json(res, 500, { error: 'Server configuration missing.' });
  }

  const stripe = new Stripe(stripeSecret);
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { userId, email } = req.body || {};
  if (!userId) {
    return json(res, 400, { error: 'userId is required.' });
  }

  try {
    // First check Supabase user metadata (fast path)
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError || !userData?.user) {
      return json(res, 404, { error: 'User not found.' });
    }

    const metadata = userData.user.user_metadata || {};
    const cachedStatus = metadata.subscription_status;

    // If Supabase says active or trialing, trust it (webhook keeps it fresh)
    if (cachedStatus === 'active' || cachedStatus === 'trialing') {
      return json(res, 200, {
        subscribed: true,
        status: cachedStatus,
        plan: metadata.plan || 'Pro',
        trialEnd: metadata.trial_end || null,
      });
    }

    // Double-check with Stripe directly (in case webhook was missed)
    if (email) {
      const customers = await stripe.customers.list({ email, limit: 1 });

      if (customers.data.length > 0) {
        const subscriptions = await stripe.subscriptions.list({
          customer: customers.data[0].id,
          status: 'all',
          limit: 5,
        });

        const activeSub = subscriptions.data.find(
          (sub) => sub.status === 'active' || sub.status === 'trialing'
        );

        if (activeSub) {
          // Sync back to Supabase
          await supabase.auth.admin.updateUserById(userId, {
            user_metadata: {
              stripe_customer_id: customers.data[0].id,
              stripe_subscription_id: activeSub.id,
              subscription_status: activeSub.status,
              plan: 'Pro',
              trial_end: activeSub.trial_end
                ? new Date(activeSub.trial_end * 1000).toISOString()
                : null,
            },
          });

          return json(res, 200, {
            subscribed: true,
            status: activeSub.status,
            plan: 'Pro',
            trialEnd: activeSub.trial_end
              ? new Date(activeSub.trial_end * 1000).toISOString()
              : null,
          });
        }
      }
    }

    return json(res, 200, {
      subscribed: false,
      status: cachedStatus || 'none',
      plan: 'Starter',
    });
  } catch (err: any) {
    console.error('Subscription check error:', err);
    return json(res, 500, { error: err.message || 'Failed to check subscription.' });
  }
}
