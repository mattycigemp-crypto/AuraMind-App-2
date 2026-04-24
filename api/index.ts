import type { VercelRequest, VercelResponse } from '@vercel/node';

const json = (res: VercelResponse, status: number, body: Record<string, unknown>) => {
  res.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { path } = req.query;
  
  if (!path || typeof path !== 'string') {
    return json(res, 400, { error: 'Invalid path' });
  }

  const [endpoint, action] = path.split('/');

  try {
    // Route to appropriate handler
    switch (endpoint) {
      case 'admin':
        return await handleAdmin(req, res, action);
      case 'coupons':
        return await handleCoupons(req, res, action);
      case 'users':
        return await handleUsers(req, res, action);
      case 'subscription':
        return await handleSubscription(req, res, action);
      case 'stripe':
        return await handleStripe(req, res, action);
      case 'email':
        return await handleEmail(req, res, action);
      case 'account':
        return await handleAccount(req, res, action);
      default:
        return json(res, 404, { error: 'Endpoint not found' });
    }
  } catch (err: any) {
    console.error('API Error:', err);
    return json(res, 500, { error: err.message || 'Internal server error' });
  }
}

// Admin endpoints
async function handleAdmin(req: VercelRequest, res: VercelResponse, action?: string) {
  const { createClient } = await import('@supabase/supabase-js');
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !supabaseServiceKey) {
    return json(res, 500, { error: 'Server configuration error' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const authHeader = req.headers.authorization;
  if (!authHeader) return json(res, 401, { error: 'Missing authorization' });

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return json(res, 401, { error: 'Invalid token' });

  const isRequestingUserAdmin = user.user_metadata?.is_admin || user.email === 'matty.cigemp@gmail.com';
  if (!isRequestingUserAdmin) return json(res, 403, { error: 'Forbidden' });

  switch (action) {
    case 'list':
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const mappedUsers = users.map((u: any) => ({
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
      return json(res, 200, { users: mappedUsers });

    case 'toggle':
      const { targetUserId, makeAdmin } = req.body || {};
      if (!targetUserId) return json(res, 400, { error: 'Missing targetUserId' });

      const { data: targetUser } = await supabase.auth.admin.getUserById(targetUserId);
      if (!targetUser?.user) return json(res, 404, { error: 'User not found' });

      await supabase.auth.admin.updateUserById(targetUserId, {
        user_metadata: {
          ...targetUser.user.user_metadata,
          is_admin: makeAdmin
        }
      });
      return json(res, 200, { success: true });

    case 'utility':
      return await handleAdminUtility(req, res, supabase, user);

    case 'test':
      return await handleAdminTest(req, res, supabase);

    default:
      return json(res, 400, { error: 'Invalid admin action' });
  }
}

async function handleAdminUtility(req: VercelRequest, res: VercelResponse, supabase: any, requestingUser: any) {
  const { action, targetUserId, targetEmail, testData } = req.body || {};

  switch (action) {
    case 'set_role': {
      if (!targetUserId) return json(res, 400, { error: 'targetUserId required' });
      const { role } = testData || {};
      const { data: userData } = await supabase.auth.admin.getUserById(targetUserId);
      if (!userData?.user) return json(res, 404, { error: 'User not found' });
      if (userData.user.email === 'matty.cigemp@gmail.com') return json(res, 403, { error: 'Cannot change owner' });

      await supabase.auth.admin.updateUserById(targetUserId, {
        user_metadata: {
          ...userData.user.user_metadata,
          role: role || 'user',
          is_admin: role === 'owner' || role === 'ceo' || role === 'admin'
        }
      });
      return json(res, 200, { success: true, role: role || 'user' });
    }

    case 'set_subscription': {
      if (!targetUserId) return json(res, 400, { error: 'targetUserId required' });
      const { status, plan } = testData || {};
      const { data: userData } = await supabase.auth.admin.getUserById(targetUserId);
      if (!userData?.user) return json(res, 404, { error: 'User not found' });

      await supabase.auth.admin.updateUserById(targetUserId, {
        user_metadata: {
          ...userData.user.user_metadata,
          subscription_status: status || 'active',
          plan: plan || 'Pro'
        }
      });
      return json(res, 200, { success: true });
    }

    case 'create_test_user': {
      const { email, password, makeAdmin = false, role = 'user' } = testData || {};
      if (!email || !password) return json(res, 400, { error: 'email and password required' });

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
      return json(res, 200, { success: true, user: { id: data.user.id, email: data.user.email, role } });
    }

    case 'get_user_details': {
      if (!targetUserId) return json(res, 400, { error: 'targetUserId required' });
      const { data: userData } = await supabase.auth.admin.getUserById(targetUserId);
      if (!userData?.user) return json(res, 404, { error: 'User not found' });
      return json(res, 200, { user: { id: userData.user.id, email: userData.user.email, metadata: userData.user.user_metadata } });
    }

    default:
      return json(res, 400, { error: 'Invalid utility action' });
  }
}

async function handleAdminTest(req: VercelRequest, res: VercelResponse, supabase: any) {
  const results = {
    timestamp: new Date().toISOString(),
    tests: [] as any[]
  };

  // Test Supabase
  try {
    const { data: { users } } = await supabase.auth.admin.listUsers();
    results.tests.push({ name: 'Supabase Connection', status: 'passed', message: `Found ${users.length} users` });
  } catch (err: any) {
    results.tests.push({ name: 'Supabase Connection', status: 'failed', message: err.message });
  }

  // Test Stripe
  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
    await stripe.prices.list({ limit: 1 });
    results.tests.push({ name: 'Stripe API', status: 'passed', message: 'Connected' });
  } catch (err: any) {
    results.tests.push({ name: 'Stripe API', status: 'failed', message: err.message });
  }

  return json(res, 200, results);
}

// Coupon endpoints
async function handleCoupons(req: VercelRequest, res: VercelResponse, action?: string) {
  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

  const authHeader = req.headers.authorization;
  if (!authHeader) return json(res, 401, { error: 'Missing authorization' });

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return json(res, 401, { error: 'Invalid token' });

  const isAdmin = user.user_metadata?.is_admin || user.email === 'matty.cigemp@gmail.com';
  if (!isAdmin) return json(res, 403, { error: 'Forbidden' });

  switch (action) {
    case 'list': {
      const coupons = await stripe.coupons.list({ limit: 100 });
      return json(res, 200, { coupons: coupons.data });
    }
    case 'create': {
      const { id, name, percent_off, amount_off, duration, duration_in_months } = req.body || {};
      const coupon = await stripe.coupons.create({
        id: id || undefined,
        name: name || 'Coupon',
        percent_off: percent_off ? parseFloat(percent_off) : undefined,
        amount_off: amount_off ? parseInt(amount_off) * 100 : undefined,
        duration: duration || 'once',
        duration_in_months: duration === 'repeating' ? parseInt(duration_in_months) : undefined,
      });
      return json(res, 200, { coupon });
    }
    case 'delete': {
      const { couponId } = req.body;
      await stripe.coupons.delete(couponId);
      return json(res, 200, { success: true });
    }
    default:
      return json(res, 400, { error: 'Invalid coupon action' });
  }
}

// User endpoints
async function handleUsers(req: VercelRequest, res: VercelResponse, action?: string) {
  // This is now handled in admin endpoint
  return json(res, 400, { error: 'Use /api/admin/list instead' });
}

// Subscription endpoints
async function handleSubscription(req: VercelRequest, res: VercelResponse, action?: string) {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const { userId } = req.body || {};
  if (!userId) return json(res, 400, { error: 'userId required' });

  const { data: userData } = await supabase.auth.admin.getUserById(userId);
  if (!userData?.user) return json(res, 404, { error: 'User not found' });

  const metadata = userData.user.user_metadata || {};
  return json(res, 200, {
    subscribed: metadata.subscription_status === 'active' || metadata.subscription_status === 'trialing',
    status: metadata.subscription_status || 'none',
    plan: metadata.plan || 'Starter'
  });
}

// Stripe endpoints
async function handleStripe(req: VercelRequest, res: VercelResponse, action?: string) {
  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

  switch (action) {
    case 'checkout': {
      const { priceId, userId, email } = req.body || {};
      if (!priceId || !userId || !email) return json(res, 400, { error: 'Missing required fields' });

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_collection: 'always',
        line_items: [{ price: priceId, quantity: 1 }],
        subscription_data: {
          trial_period_days: 7,
          metadata: { supabase_user_id: userId }
        },
        customer_email: email,
        metadata: { supabase_user_id: userId },
        success_url: `${req.headers.origin || 'https://auramind.app'}/dashboard?payment=success`,
        cancel_url: `${req.headers.origin || 'https://auramind.app'}/subscribe?payment=cancelled`
      });
      return json(res, 200, { url: session.url });
    }
    case 'portal': {
      const { customerId } = req.body || {};
      if (!customerId) return json(res, 400, { error: 'Missing customerId' });

      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${req.headers.origin || 'https://auramind.app'}/settings`
      });
      return json(res, 200, { url: session.url });
    }
    default:
      return json(res, 400, { error: 'Invalid stripe action' });
  }
}

// Email endpoints (placeholder - can be removed if not needed)
async function handleEmail(req: VercelRequest, res: VercelResponse, action?: string) {
  return json(res, 501, { error: 'Email endpoints not implemented in consolidated API' });
}

// Account endpoints
async function handleAccount(req: VercelRequest, res: VercelResponse, action?: string) {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  const authHeader = req.headers.authorization;
  if (!authHeader) return json(res, 401, { error: 'Missing authorization' });

  const token = authHeader.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return json(res, 401, { error: 'Invalid token' });

  switch (action) {
    case 'delete': {
      await supabase.auth.admin.deleteUser(user.id);
      return json(res, 200, { success: true });
    }
    default:
      return json(res, 400, { error: 'Invalid account action' });
  }
}