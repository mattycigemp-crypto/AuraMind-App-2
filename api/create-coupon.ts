import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripeSecret = process.env.STRIPE_SECRET_KEY || '';
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');

  if (!stripeSecret || !supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }

  // Admin Verification
  const isRequestingUserAdmin = user.user_metadata?.is_admin || user.email === 'matty.cigemp@gmail.com';
  if (!isRequestingUserAdmin) {
    return res.status(403).json({ error: 'Forbidden: Admin access required.' });
  }

  const stripe = new Stripe(stripeSecret);

  const { id, name, percent_off, amount_off, currency, duration, duration_in_months } = req.body || {};

  if (!percent_off && !amount_off) {
    return res.status(400).json({ error: 'Either percent_off or amount_off must be provided.' });
  }

  try {
    const params: Stripe.CouponCreateParams = {
      id: id || undefined,
      name: name || undefined,
      percent_off: percent_off || undefined,
      amount_off: amount_off || undefined,
      currency: amount_off ? (currency || 'usd') : undefined,
      duration: duration || 'once',
      duration_in_months: duration === 'repeating' ? duration_in_months : undefined,
    };

    const coupon = await stripe.coupons.create(params);
    return res.status(201).json({ coupon });
  } catch (err: any) {
    console.error('Create Coupon error:', err);
    return res.status(500).json({ error: err.message || 'Failed to create coupon.' });
  }
}
