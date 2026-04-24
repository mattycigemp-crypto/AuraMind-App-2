import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
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

  try {
    // 3. Fetch users
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      throw listError;
    }

    // Map to a cleaner format
    const mappedUsers = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.user_metadata?.full_name || u.email?.split('@')[0],
      isAdmin: u.user_metadata?.is_admin || u.email === 'matty.cigemp@gmail.com',
      role: u.user_metadata?.role || (u.email === 'matty.cigemp@gmail.com' ? 'owner' : 'user'),
      avatar: u.user_metadata?.avatar_url,
      lastSignIn: u.last_sign_in_at,
      created: u.created_at,
      plan: u.user_metadata?.plan || 'Starter'
    }));

    return res.status(200).json({ ok: true, users: mappedUsers });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to list users' });
  }
}
