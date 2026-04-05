import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

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

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Server configuration error: Missing Supabase Admin credentials (SUPABASE_SERVICE_ROLE_KEY)' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // 1. Verify the JWT and get the requesting user
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }

  // 2. Ensure they are an admin!
  const isRequestingUserAdmin = user.user_metadata?.is_admin || user.email === 'matty.cigemp@gmail.com';
  if (!isRequestingUserAdmin) {
    return res.status(403).json({ error: 'Forbidden: Only admins can perform this action.' });
  }

  const { targetUserId, makeAdmin } = req.body || {};

  if (!targetUserId) {
    return res.status(400).json({ error: 'Missing targetUserId.' });
  }

  try {
    // 3. Update the target user's metadata using the service role client
    // Since we are using the admin client, we can grab their user metadata first to preserve it.
    const { data: targetUserObj, error: targetError } = await supabase.auth.admin.getUserById(targetUserId);

    if (targetError || !targetUserObj?.user) {
      return res.status(404).json({ error: 'Target user not found.' });
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(targetUserId, {
      user_metadata: {
        ...targetUserObj.user.user_metadata,
        is_admin: makeAdmin
      }
    });

    if (updateError) {
      throw updateError;
    }

    return res.status(200).json({ ok: true, message: `User admin status updated to ${makeAdmin}` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update user' });
  }
}
