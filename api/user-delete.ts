import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Server configuration error: Missing Supabase Admin credentials' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Verify the JWT and get the user
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }

  const userId = user.id;

  try {
    // 1. Cancel Stripe subscriptions directly if exists
    if (stripeSecretKey) {
      try {
        const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' as any });
        if (user.email) {
          const customers = await stripe.customers.list({ email: user.email, limit: 1 });
          if (customers.data.length > 0) {
            const customerId = customers.data[0].id;
            const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: 'active' });
            for (const sub of subscriptions.data) {
              await stripe.subscriptions.cancel(sub.id);
            }
          }
        }
      } catch (e) {
        console.warn('Stripe cancellation failed:', e);
        // Continue deletion even if Stripe fails
      }
    }

    // 2. Delete data (Hard Delete via service role)
    await supabase.from('cards').delete().eq('user_id', userId);
    await supabase.from('decks').delete().eq('user_id', userId);

    // 3. Delete user from auth
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteError) {
      throw deleteError;
    }

    return res.status(200).json({ ok: true, message: 'Account deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to delete account' });
  }
}
