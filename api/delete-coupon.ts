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

  const { couponId } = req.body || {};

  if (!couponId) {
    return res.status(400).json({ error: 'couponId is required.' });
  }

  try {
    const deleted = await stripe.coupons.del(couponId);
    return res.status(200).json({ status: deleted.deleted ? 'deleted' : 'not_found' });
  } catch (err: any) {
    console.error('Delete Coupon error:', err);
    return res.status(500).json({ error: err.message || 'Failed to delete coupon.' });
  }
}
