import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const json = (res: VercelResponse, status: number, body: Record<string, unknown>) => {
  res.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return json(res, 500, { error: 'Server configuration missing.' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { userId } = req.body || {};
  if (!userId) {
    return json(res, 400, { error: 'userId is required.' });
  }

  try {
    // Check Supabase user metadata (Single source of truth for Lemon Squeezy integration)
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError || !userData?.user) {
      return json(res, 404, { error: 'User not found.' });
    }

    const metadata = userData.user.user_metadata || {};
    const status = metadata.subscription_status || 'none';

    return json(res, 200, {
      subscribed: status === 'active' || status === 'trialing',
      status: status,
      plan: metadata.plan || 'Starter',
      trialEnd: metadata.trial_end || null,
      lastUpdated: metadata.last_updated || null
    });
  } catch (err: any) {
    console.error('Subscription check error:', err);
    return json(res, 500, { error: err.message || 'Failed to check subscription.' });
  }
}
