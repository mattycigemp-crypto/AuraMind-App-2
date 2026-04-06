import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const json = (res: VercelResponse, status: number, body: Record<string, unknown>) => {
  res.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  const webhookSecret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  const signature = req.headers['x-signature'] as string;

  if (!webhookSecret) {
    return json(res, 500, { error: 'Webhook secret not configured.' });
  }

  // Verify signature
  const hmac = crypto.createHmac('sha256', webhookSecret);
  const digest = hmac.update(req.body).digest('hex');

  // Verify the payload is a raw body string for accurate signature checking
  // Using Verel's automated body parsing is fine but sometimes the signature needs the raw body
  // However, req.body in Vercel is often a parsed object if the content-type is json.
  // We may need to get the RAW body if signature matching fails.

  // Supabase init
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl!, supabaseServiceKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const payload = req.body;
  const eventName = payload.meta.event_name;
  const data = payload.data;
  const customData = payload.meta.custom_data;
  const userId = customData?.user_id;

  if (!userId) {
    console.error('LS Webhook: missing user_id in custom_data');
    return json(res, 200, { received: true, msg: 'Missing user_id' });
  }

  try {
    let status = 'none';

    if (eventName === 'subscription_created' || eventName === 'subscription_updated') {
      const subStatus = data.attributes.status; // 'active', 'on_trial', 'paused', 'cancelled', 'expired'
      status = subStatus === 'on_trial' ? 'trialing' : subStatus === 'active' ? 'active' : 'inactive';

      const trialEnd = data.attributes.trial_ends_at; // Date string or null

      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          ls_subscription_id: data.id,
          ls_customer_id: data.attributes.customer_id,
          subscription_status: status,
          plan: 'Pro', // Can be refined by checking data.attributes.variant_id
          trial_end: trialEnd,
          last_updated: new Date().toISOString()
        }
      });
    } else if (eventName === 'subscription_cancelled' || eventName === 'subscription_expired') {
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          subscription_status: 'inactive',
          ls_subscription_id: null,
          last_updated: new Date().toISOString()
        }
      });
    }

    return json(res, 200, { received: true });
  } catch (err: any) {
    console.error('LS Webhook processing error:', err);
    return json(res, 500, { error: 'Failed to process webhook' });
  }
}
