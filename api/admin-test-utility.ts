import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const json = (res: VercelResponse, status: number, body: Record<string, unknown>) => {
  res.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return json(res, 401, { error: 'Missing authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !supabaseServiceKey) {
    return json(res, 500, { error: 'Server configuration error: Missing Supabase Admin credentials' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Verify the requesting user is an admin
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return json(res, 401, { error: 'Invalid or expired token.' });
  }

  const isRequestingUserAdmin = user.user_metadata?.is_admin || user.email === 'matty.cigemp@gmail.com';
  if (!isRequestingUserAdmin) {
    return json(res, 403, { error: 'Forbidden: Only admins can perform this action.' });
  }

  const { action, targetEmail, targetUserId, testData } = req.body || {};

  try {
    switch (action) {
      case 'grant_admin': {
        if (!targetEmail && !targetUserId) {
          return json(res, 400, { error: 'targetEmail or targetUserId required' });
        }

        let targetUser;
        if (targetUserId) {
          const { data: userData } = await supabase.auth.admin.getUserById(targetUserId);
          targetUser = userData?.user;
        } else if (targetEmail) {
          const { data: { users } } = await supabase.auth.admin.listUsers();
          targetUser = users.find(u => u.email === targetEmail);
        }

        if (!targetUser) {
          return json(res, 404, { error: 'Target user not found' });
        }

        const { error: updateError } = await supabase.auth.admin.updateUserById(targetUser.id, {
          user_metadata: {
            ...targetUser.user_metadata,
            is_admin: true
          }
        });

        if (updateError) throw updateError;

        return json(res, 200, { 
          success: true, 
          message: `Admin access granted to ${targetUser.email}`,
          user: {
            id: targetUser.id,
            email: targetUser.email,
            isAdmin: true
          }
        });
      }

      case 'revoke_admin': {
        if (!targetEmail && !targetUserId) {
          return json(res, 400, { error: 'targetEmail or targetUserId required' });
        }

        let targetUser;
        if (targetUserId) {
          const { data: userData } = await supabase.auth.admin.getUserById(targetUserId);
          targetUser = userData?.user;
        } else if (targetEmail) {
          const { data: { users } } = await supabase.auth.admin.listUsers();
          targetUser = users.find(u => u.email === targetEmail);
        }

        if (!targetUser) {
          return json(res, 404, { error: 'Target user not found' });
        }

        // Prevent revoking the last admin or the owner
        if (targetUser.email === 'matty.cigemp@gmail.com') {
          return json(res, 403, { error: 'Cannot revoke owner admin access' });
        }

        const { error: updateError } = await supabase.auth.admin.updateUserById(targetUser.id, {
          user_metadata: {
            ...targetUser.user_metadata,
            is_admin: false
          }
        });

        if (updateError) throw updateError;

        return json(res, 200, { 
          success: true, 
          message: `Admin access revoked from ${targetUser.email}`,
          user: {
            id: targetUser.id,
            email: targetUser.email,
            isAdmin: false
          }
        });
      }

      case 'set_subscription': {
        if (!targetUserId) {
          return json(res, 400, { error: 'targetUserId required' });
        }

        const { status, plan } = testData || {};
        
        const { data: userData } = await supabase.auth.admin.getUserById(targetUserId);
        if (!userData?.user) {
          return json(res, 404, { error: 'Target user not found' });
        }

        const { error: updateError } = await supabase.auth.admin.updateUserById(targetUserId, {
          user_metadata: {
            ...userData.user.user_metadata,
            subscription_status: status || 'active',
            plan: plan || 'Pro'
          }
        });

        if (updateError) throw updateError;

        return json(res, 200, { 
          success: true, 
          message: `Subscription updated for ${userData.user.email}`,
          subscription: {
            status: status || 'active',
            plan: plan || 'Pro'
          }
        });
      }

      case 'create_test_user': {
        const { email, password, makeAdmin = false, role = 'user' } = testData || {};
        
        if (!email || !password) {
          return json(res, 400, { error: 'email and password required' });
        }

        const { data, error } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: email.split('@')[0],
            is_admin: makeAdmin || role === 'owner' || role === 'ceo' || role === 'admin',
            role: role,
            plan: 'Starter',
            subscription_status: 'none',
            joined_date: Date.now().toString()
          }
        });

        if (error) throw error;

        return json(res, 200, { 
          success: true, 
          message: 'Test user created',
          user: {
            id: data.user.id,
            email: data.user.email,
            isAdmin: makeAdmin || role === 'owner' || role === 'ceo' || role === 'admin',
            role: role
          }
        });
      }

      case 'get_user_details': {
        if (!targetUserId) {
          return json(res, 400, { error: 'targetUserId required' });
        }

        const { data: userData } = await supabase.auth.admin.getUserById(targetUserId);
        if (!userData?.user) {
          return json(res, 404, { error: 'User not found' });
        }

        return json(res, 200, { 
          success: true, 
          user: {
            id: userData.user.id,
            email: userData.user.email,
            metadata: userData.user.user_metadata,
            createdAt: userData.user.created_at,
            lastSignIn: userData.user.last_sign_in_at,
            emailConfirmed: !!userData.user.email_confirmed_at
          }
        });
      }

      case 'set_role': {
        if (!targetUserId) {
          return json(res, 400, { error: 'targetUserId required' });
        }

        const { role } = testData || {};
        
        const { data: userData } = await supabase.auth.admin.getUserById(targetUserId);
        if (!userData?.user) {
          return json(res, 404, { error: 'Target user not found' });
        }

        // Prevent changing owner role
        if (userData.user.email === 'matty.cigemp@gmail.com') {
          return json(res, 403, { error: 'Cannot change owner role' });
        }

        const { error: updateError } = await supabase.auth.admin.updateUserById(targetUserId, {
          user_metadata: {
            ...userData.user.user_metadata,
            role: role || 'user',
            is_admin: role === 'owner' || role === 'ceo' || role === 'admin'
          }
        });

        if (updateError) throw updateError;

        return json(res, 200, { 
          success: true, 
          message: `Role updated to ${role || 'user'} for ${userData.user.email}`,
          role: role || 'user'
        });
      }

      default:
        return json(res, 400, { error: 'Invalid action. Supported: grant_admin, revoke_admin, set_subscription, create_test_user, get_user_details, set_role' });
    }
  } catch (err: any) {
    return json(res, 500, { error: err.message || 'Operation failed' });
  }
}