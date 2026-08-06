import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyMiddleware } from './middleware.js';
import { handleChatStream } from './chatHandler.js';
import { z } from 'zod';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';

const json = (res: VercelResponse, status: number, body: Record<string, unknown>) => {
  res.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
};

// --- Zod Validation Schemas ---

const StripeCheckoutSchema = z.object({
  priceId: z.string().min(1, 'priceId is required'),
  userId: z.string().uuid('userId must be a valid UUID'),
  email: z.string().email('email must be valid'),
});

const StripePortalSchema = z.object({
  customerId: z.string().min(1, 'customerId is required'),
});

const AdminToggleSchema = z.object({
  targetUserId: z.string().uuid('targetUserId must be a valid UUID'),
  makeAdmin: z.boolean(),
});

const AdminSetRoleSchema = z.object({
  targetUserId: z.string().uuid(),
  testData: z.object({
    role: z.enum(['user', 'employee', 'admin', 'ceo', 'owner']).optional(),
  }).optional(),
});

const AdminSetSubscriptionSchema = z.object({
  targetUserId: z.string().uuid(),
  testData: z.object({
    status: z.enum(['active', 'trialing', 'past_due', 'canceled', 'none']).optional(),
    plan: z.string().optional(),
  }).optional(),
});

const CreateTestUserSchema = z.object({
  testData: z.object({
    email: z.string().email(),
    password: z.string().min(8, 'password must be at least 8 characters'),
    makeAdmin: z.boolean().optional(),
    role: z.enum(['user', 'employee', 'admin', 'ceo', 'owner']).optional(),
  }),
});

const CouponCreateSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'name is required'),
  percent_off: z.union([z.string(), z.number()]).optional(),
  amount_off: z.union([z.string(), z.number()]).optional(),
  duration: z.enum(['once', 'repeating', 'forever']).optional(),
  duration_in_months: z.union([z.string(), z.number()]).optional(),
});

const CouponDeleteSchema = z.object({
  couponId: z.string().min(1, 'couponId is required'),
});

const SubscriptionVerifySchema = z.object({
  userId: z.string().uuid('userId must be a valid UUID'),
});

const AdminQuerySchema = z.object({
  query: z.string().min(1, 'Query is required').max(5000, 'Query too long'),
});

const AuditListSchema = z.object({
  limit: z.number().min(1).max(500).optional().default(100),
  offset: z.number().min(0).optional().default(0),
  category: z.enum(['user', 'subscription', 'admin', 'database', 'system', 'security']).optional(),
  severity: z.enum(['info', 'warning', 'critical']).optional(),
});

const AuditCreateSchema = z.object({
  action: z.string().min(1, 'action is required'),
  category: z.enum(['user', 'subscription', 'admin', 'database', 'system', 'security']),
  actorEmail: z.string().email('actorEmail must be valid'),
  targetId: z.string().optional(),
  targetEmail: z.string().optional(),
  details: z.string().optional(),
  severity: z.enum(['info', 'warning', 'critical']).optional().default('info'),
});

const BulkRoleChangeSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1, 'At least one userId is required').max(100, 'Max 100 users at a time'),
  role: z.enum(['user', 'employee', 'admin']),
});

const BulkEmailSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1).max(100),
  subject: z.string().min(1, 'Subject is required').max(200),
  body: z.string().min(1, 'Body is required').max(50000),
});

const ExportCSVSchema = z.object({
  columns: z.array(z.string()).optional(),
  format: z.enum(['csv', 'json']).optional().default('csv'),
});

// Allowed SQL prefixes for read-only queries
const ALLOWED_QUERY_PREFIXES = ['SELECT', 'EXPLAIN', 'SHOW', 'DESCRIBE', 'DESC', 'WITH'];
const BLOCKED_KEYWORDS = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE', 'TRUNCATE', 'GRANT', 'REVOKE', 'EXEC', 'EXECUTE', 'CALL', 'DO', 'MERGE', 'UPSERT', 'COPY'];

/**
 * Validates req.body against a Zod schema. Returns parsed data or sends 400 error.
 */
function validateBody<T extends z.ZodTypeAny>(
  res: VercelResponse,
  schema: T,
  body: unknown
): { ok: true; data: z.infer<T> } | { ok: false } {
  const result = schema.safeParse(body);
  if (!result.success) {
    json(res, 400, {
      error: 'Validation failed',
      details: (result as any).error?.flatten?.().fieldErrors ?? {},
    });
    return { ok: false };
  }
  return { ok: true, data: result.data };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { path } = req.query;
  
  if (!path || typeof path !== 'string') {
    return json(res, 400, { error: 'Invalid path' });
  }

  const [endpoint, action] = path.split('/');

  // Apply security headers and rate limiting. Returns false if already responded.
  if (!applyMiddleware(req, res, { rateLimitType: endpoint === 'stripe' ? 'auth' : 'default' })) {
    return;
  }

  try {
    // Route to appropriate handler
    switch (endpoint) {
      case 'admin':
        return await handleAdmin(req, res, action);
      case 'coupons':
        return await handleCoupons(req, res, action);
      case 'subscription':
        return await handleSubscription(req, res, action);
      case 'chat':
        return await handleChat(req, res, action);
      case 'stripe':
        return await handleStripe(req, res, action);
      case 'account':
        return await handleAccount(req, res, action);
      case 'audit':
        return await handleAudit(req, res, action);
      case 'integrations':
        return await handleIntegrations(req, res, action);
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

  const isRequestingUserAdmin = user.user_metadata?.is_admin || (ADMIN_EMAIL && user.email === ADMIN_EMAIL);
  if (!isRequestingUserAdmin) return json(res, 403, { error: 'Forbidden' });

  switch (action) {
    case 'list':
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const mappedUsers = users.map((u: any) => ({
        id: u.id,
        email: u.email,
        name: u.user_metadata?.full_name || u.email?.split('@')[0],
        isAdmin: u.user_metadata?.is_admin || (ADMIN_EMAIL && u.email === ADMIN_EMAIL),
        role: u.user_metadata?.role || (ADMIN_EMAIL && u.email === ADMIN_EMAIL ? 'owner' : 'user'),
        avatar: u.user_metadata?.avatar_url,
        lastSignIn: u.last_sign_in_at,
        created: u.created_at,
        plan: u.user_metadata?.plan || 'Starter'
      }));
      return json(res, 200, { users: mappedUsers });

    case 'toggle': {
      const parsed = validateBody(res, AdminToggleSchema, req.body);
      if (!parsed.ok) return;
      const { targetUserId, makeAdmin } = parsed.data;

      const { data: targetUser } = await supabase.auth.admin.getUserById(targetUserId);
      if (!targetUser?.user) return json(res, 404, { error: 'User not found' });

      const oldRole = targetUser.user.user_metadata?.role || 'user';
      await supabase.auth.admin.updateUserById(targetUserId, {
        user_metadata: {
          ...targetUser.user.user_metadata,
          is_admin: makeAdmin,
          role: makeAdmin ? 'admin' : 'user'
        }
      });

      await logAuditEvent(supabase, {
        actorEmail: user.email || 'admin',
        action: makeAdmin ? 'User promoted to admin' : 'Admin demoted to user',
        category: 'admin',
        targetId: targetUserId,
        targetEmail: targetUser.user.email,
        details: `Changed role from "${oldRole}" to "${makeAdmin ? 'admin' : 'user'}" for ${targetUser.user.email}`,
        severity: 'info',
      });
      return json(res, 200, { success: true });
    }

    case 'utility':
      return await handleAdminUtility(req, res, supabase, user);

    case 'test':
      return await handleAdminTest(req, res, supabase);

    case 'health':
      return await handleAdminHealth(req, res, supabase);

    case 'query':
      return await handleAdminQuery(req, res, supabase);

    case 'revenue':
      return await handleAdminRevenue(req, res);

    case 'bulk':
      return await handleAdminBulk(req, res, supabase, user);

    case 'audit':
      return await handleAdminAudit(req, res, supabase, user);

    default:
      return json(res, 400, { error: 'Invalid admin action' });
  }
}

async function handleAdminUtility(req: VercelRequest, res: VercelResponse, supabase: any, requestingUser: any) {
  const { action } = req.body || {};

  switch (action) {
    case 'set_role': {
      const parsed = validateBody(res, AdminSetRoleSchema, req.body);
      if (!parsed.ok) return;
      const { targetUserId, testData } = parsed.data;
      const role = testData?.role;
      const { data: userData } = await supabase.auth.admin.getUserById(targetUserId);
      if (!userData?.user) return json(res, 404, { error: 'User not found' });
      if (userData.user.email === ADMIN_EMAIL) return json(res, 403, { error: 'Cannot change owner' });

      const oldRole = userData.user.user_metadata?.role || 'user';
      await supabase.auth.admin.updateUserById(targetUserId, {
        user_metadata: {
          ...userData.user.user_metadata,
          role: role || 'user',
          is_admin: role === 'owner' || role === 'ceo' || role === 'admin'
        }
      });

      await logAuditEvent(supabase, {
        actorEmail: requestingUser.email || 'admin',
        action: 'User role updated',
        category: 'admin',
        targetId: targetUserId,
        targetEmail: userData.user.email,
        details: `Changed role from "${oldRole}" to "${role || 'user'}" for ${userData.user.email}`,
        severity: 'info',
      });
      return json(res, 200, { success: true, role: role || 'user' });
    }

    case 'set_subscription': {
      const parsed = validateBody(res, AdminSetSubscriptionSchema, req.body);
      if (!parsed.ok) return;
      const { targetUserId, testData } = parsed.data;
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

      await logAuditEvent(supabase, {
        actorEmail: requestingUser.email || 'admin',
        action: 'Subscription updated',
        category: 'subscription',
        targetId: targetUserId,
        targetEmail: userData.user.email,
        details: `Set subscription to status="${status || 'active'}", plan="${plan || 'Pro'}" for ${userData.user.email}`,
        severity: 'info',
      });
      return json(res, 200, { success: true });
    }

    case 'create_test_user': {
      const parsed = validateBody(res, CreateTestUserSchema, req.body);
      if (!parsed.ok) return;
      const { email, password, makeAdmin = false, role = 'user' } = parsed.data.testData;

      const userPayload = {
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
      };

      let { data, error } = await supabase.auth.admin.createUser(userPayload);

      // If user already exists from a previous scan, delete and retry once
      if (error && (error.message?.includes('already') || error.status === 422)) {
        try {
          const { data: existingUsers } = await supabase.auth.admin.listUsers();
          const existing = existingUsers?.users?.find((u: any) => u.email === email);
          if (existing) await supabase.auth.admin.deleteUser(existing.id);
        } catch { /* best effort */ }
        const retry = await supabase.auth.admin.createUser(userPayload);
        data = retry.data;
        error = retry.error;
      }

      if (error) throw error;

      await logAuditEvent(supabase, {
        actorEmail: requestingUser.email || 'admin',
        action: 'Test user created',
        category: 'user',
        targetId: data.user.id,
        targetEmail: email,
        details: `Created test user ${email} with role "${role}"${makeAdmin ? ' (admin)' : ''}`,
        severity: 'info',
      });
      return json(res, 200, { success: true, user: { id: data.user.id, email: data.user.email, role } });
    }

    case 'get_user_details': {
      const parsed = validateBody(res, z.object({ targetUserId: z.string().uuid() }), req.body);
      if (!parsed.ok) return;
      const { targetUserId } = parsed.data;
      const { data: userData } = await supabase.auth.admin.getUserById(targetUserId);
      if (!userData?.user) return json(res, 404, { error: 'User not found' });
      return json(res, 200, { user: { id: userData.user.id, email: userData.user.email, metadata: userData.user.user_metadata } });
    }

    case 'delete_user': {
      const parsed = validateBody(res, z.object({ targetUserId: z.string().uuid() }), req.body);
      if (!parsed.ok) return;
      const { targetUserId } = parsed.data;
      if (targetUserId === requestingUser.id) return json(res, 403, { error: 'Cannot delete your own account' });
      const { data: userData } = await supabase.auth.admin.getUserById(targetUserId);
      if (!userData?.user) return json(res, 404, { error: 'User not found' });
      if (userData.user.email === ADMIN_EMAIL) return json(res, 403, { error: 'Cannot delete the owner account' });

      const targetEmail = userData.user.email;

      // Clean up user's data in public schema before deleting auth record
      try {
        await supabase.from('cards').delete().eq('user_id', targetUserId);
        await supabase.from('decks').delete().eq('user_id', targetUserId);
        await supabase.from('learning_path_enrollments').delete().eq('user_id', targetUserId);
        await supabase.from('fact_check_history').delete().eq('user_id', targetUserId);
        await supabase.from('chat_logs').delete().eq('user_id', targetUserId);
      } catch (cleanupErr: any) {
        console.warn('Partial cleanup during user deletion:', cleanupErr.message);
      }

      await supabase.auth.admin.deleteUser(targetUserId);

      await logAuditEvent(supabase, {
        actorEmail: requestingUser.email || 'admin',
        action: 'User permanently deleted',
        category: 'user',
        targetId: targetUserId,
        targetEmail: targetEmail,
        details: `Admin "${requestingUser.email}" permanently deleted user "${targetEmail}" and all associated data`,
        severity: 'warning',
      });
      return json(res, 200, { success: true });
    }

    default:
      return json(res, 400, { error: 'Invalid utility action' });
  }
}

// SQL Query endpoint for DatabaseExplorer
async function handleAdminQuery(req: VercelRequest, res: VercelResponse, supabase: any) {
  const parsed = validateBody(res, AdminQuerySchema, req.body);
  if (!parsed.ok) return;
  const { query } = parsed.data;

  // Validate query safety - only allow read operations
  const trimmed = query.trim();
  const upperQuery = trimmed.toUpperCase();
  const isAllowed = ALLOWED_QUERY_PREFIXES.some(prefix => upperQuery.startsWith(prefix));
  if (!isAllowed) {
    return json(res, 403, { error: 'Only SELECT, EXPLAIN, SHOW, DESCRIBE, and WITH queries are allowed' });
  }

  const hasBlocked = BLOCKED_KEYWORDS.some(kw => {
    const regex = new RegExp(`\\b${kw}\\b`, 'i');
    return regex.test(trimmed);
  });
  if (hasBlocked) {
    return json(res, 403, { error: 'Write operations (INSERT, UPDATE, DELETE, DROP, etc.) are not allowed' });
  }

  try {
    // Use Supabase's rpc to call a database function for raw SQL execution
    const { data, error } = await supabase.rpc('execute_sql', { query_text: trimmed });
    if (error) throw error;
    return json(res, 200, { rows: data || [], columns: data && data.length > 0 ? Object.keys(data[0]) : [] });
  } catch (err: any) {
    console.error('SQL query error:', err.message);
    return json(res, 500, { error: err.message || 'Query execution failed', details: err.hint || '' });
  }
}

// ── Health Check: Stripe payments deep test ──
async function handleAdminHealth(req: VercelRequest, res: VercelResponse, supabase: any) {
  // URL is /api/admin/health/payments → path = 'admin/health/payments', subAction = 'payments'
  const subAction = ((req.query.path as string) || '').split('/')[2];

  if (subAction === 'payments') {
    const results: any = {
      configOk: false,
      apiOk: false,
      prices: [],
      products: [],
      webhookConfigured: false,
      testPaymentIntentCreated: false,
      errors: [] as string[],
    };

    try {
      const Stripe = (await import('stripe')).default;
      const secretKey = process.env.STRIPE_SECRET_KEY || '';
      if (!secretKey) {
        results.errors.push('STRIPE_SECRET_KEY not configured');
        return json(res, 200, results);
      }
      results.configOk = true;

      const stripe = new Stripe(secretKey);

      // Test 1: List prices (basic API connectivity)
      try {
        const prices = await stripe.prices.list({ limit: 10, active: true });
        results.apiOk = true;
        results.prices = prices.data.map(p => ({
          id: p.id,
          nickname: p.nickname || p.id,
          currency: p.currency,
          unitAmount: p.unit_amount ? (p.unit_amount / 100).toFixed(2) : '0.00',
          interval: p.recurring?.interval || 'one-time',
          active: p.active,
        }));
      } catch (err: any) {
        results.errors.push(`Prices list failed: ${err.message}`);
      }

      // Test 2: List products
      try {
        const products = await stripe.products.list({ limit: 10, active: true });
        results.products = products.data.map(p => ({
          id: p.id,
          name: p.name,
          active: p.active,
        }));
      } catch (err: any) {
        results.errors.push(`Products list failed: ${err.message}`);
      }

      // Test 3: Check webhook endpoint exists
      try {
        const webhooks = await stripe.webhookEndpoints.list({ limit: 10 });
        const auramindWebhook = webhooks.data.find(
          (w: any) => w.url?.includes('auramind') || w.url?.includes('stripe-webhook'),
        );
        results.webhookConfigured = !!auramindWebhook;
        if (auramindWebhook) {
          results.webhookUrl = auramindWebhook.url;
          results.webhookEnabled = auramindWebhook.enabled_events?.length > 0;
        }
      } catch (err: any) {
        results.errors.push(`Webhook check failed: ${err.message}`);
      }

      // Test 4: Create a test payment intent (unconfirmed — no charge)
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: 100, // $1.00 — test amount
          currency: 'usd',
          payment_method_types: ['card'],
          description: 'AuraMind health check — test payment (not charged)',
          metadata: { source: 'health_check', timestamp: new Date().toISOString() },
        });
        results.testPaymentIntentCreated = paymentIntent.status === 'requires_payment_method';
        results.testPaymentIntentId = paymentIntent.id;
        results.testPaymentIntentStatus = paymentIntent.status;
        results.testPaymentAmount = `1.00 USD`;

        // Immediately cancel the test payment intent to clean up
        await stripe.paymentIntents.cancel(paymentIntent.id).catch(() => {});
      } catch (err: any) {
        results.errors.push(`Test payment intent failed: ${err.message}`);
      }

    } catch (err: any) {
      results.errors.push(`Stripe init failed: ${err.message}`);
    }

    return json(res, 200, results);
  }

  return json(res, 400, { error: 'Invalid health action. Use: payments' });
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

  // Test Resend Email
  try {
    const resendKey = process.env.RESEND_API_KEY || '';
    const resendFrom = process.env.RESEND_FROM_EMAIL || '';
    if (!resendKey) {
      results.tests.push({ name: 'Resend Email', status: 'failed', message: 'RESEND_API_KEY not configured' });
    } else {
      // Verify the API key works by checking Resend's health endpoint
      const res = await fetch('https://api.resend.com/emails', {
        method: 'GET',
        headers: { Authorization: `Bearer ${resendKey}` },
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok || res.status === 405) {
        // 200 or 405 (Method Not Allowed) both mean we authenticated successfully
        results.tests.push({ name: 'Resend Email', status: 'passed', message: `Configured (from: ${resendFrom || 'default'})` });
      } else {
        results.tests.push({ name: 'Resend Email', status: 'failed', message: `API returned ${res.status}` });
      }
    }
  } catch (err: any) {
    results.tests.push({ name: 'Resend Email', status: 'failed', message: err.message });
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

  const isAdmin = user.user_metadata?.is_admin || (ADMIN_EMAIL && user.email === ADMIN_EMAIL);
  if (!isAdmin) return json(res, 403, { error: 'Forbidden' });

  switch (action) {
    case 'list': {
      const coupons = await stripe.coupons.list({ limit: 100 });
      return json(res, 200, { coupons: coupons.data });
    }
    case 'create': {
      const parsed = validateBody(res, CouponCreateSchema, req.body);
      if (!parsed.ok) return;
      const { id, name, percent_off, amount_off, duration, duration_in_months } = parsed.data;
      const coupon = await stripe.coupons.create({
        id: id || undefined,
        name: name || 'Coupon',
        percent_off: percent_off ? parseFloat(String(percent_off)) : undefined,
        amount_off: amount_off ? parseInt(String(amount_off)) * 100 : undefined,
        duration: duration || 'once',
        duration_in_months: duration === 'repeating' ? parseInt(String(duration_in_months)) : undefined,
      });
      return json(res, 200, { coupon });
    }
    case 'delete': {
      const parsed = validateBody(res, CouponDeleteSchema, req.body);
      if (!parsed.ok) return;
      const { couponId } = parsed.data;
      await stripe.coupons.del(couponId);
      return json(res, 200, { success: true });
    }
    default:
      return json(res, 400, { error: 'Invalid coupon action' });
  }
}

// Subscription endpoints
async function handleSubscription(req: VercelRequest, res: VercelResponse, action?: string) {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const parsed = validateBody(res, SubscriptionVerifySchema, req.body);
  if (!parsed.ok) return;
  const { userId } = parsed.data;

  const { data: userData } = await supabase.auth.admin.getUserById(userId);
  if (!userData?.user) return json(res, 404, { error: 'User not found' });

  const metadata = userData.user.user_metadata || {};
  return json(res, 200, {
    subscribed: metadata.subscription_status === 'active' || metadata.subscription_status === 'trialing',
    status: metadata.subscription_status || 'none',
    plan: metadata.plan || 'Starter'
  });
}

// Chat endpoints
async function handleChat(req: VercelRequest, res: VercelResponse, action?: string) {
  if (action === 'stream') {
    await handleChatStream(
      req,
      res,
      { message: req.query.message as string | undefined, token: req.query.token as string | undefined },
    );
    return;
  }
  return json(res, 400, { error: 'Invalid chat action' });
}

// Stripe endpoints
async function handleStripe(req: VercelRequest, res: VercelResponse, action?: string) {
  const secretKey = process.env.STRIPE_SECRET_KEY || '';
  if (!secretKey) {
    return json(res, 500, { error: 'Stripe secret key not configured. Add STRIPE_SECRET_KEY to environment variables.' });
  }

  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(secretKey);

  switch (action) {
    case 'checkout': {
      const parsed = validateBody(res, StripeCheckoutSchema, req.body);
      if (!parsed.ok) return;
      const { priceId, userId, email } = parsed.data;

      try {
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

        // Immediately mark user as trialing so they don't get stuck in a redirect loop
        // (the webhook is async and may not have fired by the time they return from Stripe)
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
          const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
          if (supabaseUrl && supabaseServiceKey) {
            const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
            const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
            if (userData?.user) {
              await supabaseAdmin.auth.admin.updateUserById(userId, {
                user_metadata: {
                  ...userData.user.user_metadata,
                  subscription_status: 'trialing',
                  plan: 'Pro',
                },
              });
            }
          }
        } catch (metaErr: any) {
          console.warn('Failed to update user metadata after checkout:', metaErr.message);
          // Non-fatal — the webhook will eventually update it
        }

        return json(res, 200, { url: session.url });
      } catch (err: any) {
        console.error('Stripe checkout error:', err.message);
        return json(res, 500, { error: err.message || 'Failed to create checkout session' });
      }
    }
    case 'portal': {
      const parsed = validateBody(res, StripePortalSchema, req.body);
      if (!parsed.ok) return;
      const { customerId } = parsed.data;

      try {
        const session = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: `${req.headers.origin || 'https://auramind.app'}/settings`
        });
        return json(res, 200, { url: session.url });
      } catch (err: any) {
        console.error('Stripe portal error:', err.message);
        return json(res, 500, { error: err.message || 'Failed to create billing portal session' });
      }
    }
    default:
      return json(res, 400, { error: 'Invalid stripe action' });
  }
}

// Integration endpoints
async function handleIntegrations(req: VercelRequest, res: VercelResponse, action?: string) {
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
    case 'notion/connect': {
      const { accessToken, workspaceId, workspaceName } = req.body || {};
      if (!accessToken) return json(res, 400, { error: 'Missing accessToken' });

      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          integrations: {
            ...user.user_metadata.integrations,
            notion: {
              connected: true,
              accessToken,
              workspaceId,
              workspaceName,
              connectedAt: Date.now()
            }
          }
        }
      });
      return json(res, 200, { success: true });
    }

    case 'notion/disconnect': {
      const metadata = user.user_metadata || {};
      const integrations = metadata.integrations || {};
      delete integrations.notion;

      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...metadata,
          integrations
        }
      });
      return json(res, 200, { success: true });
    }

    case 'anki/update': {
      const { importCount } = req.body || {};
      const metadata = user.user_metadata || {};
      const integrations = metadata.integrations || {};

      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...metadata,
          integrations: {
            ...integrations,
            anki: {
              connected: true,
              lastImportAt: Date.now(),
              importCount: (integrations.anki?.importCount || 0) + (importCount || 0)
            }
          }
        }
      });
      return json(res, 200, { success: true });
    }

    case 'obsidian/connect': {
      const { vaultPaths } = req.body || {};
      const metadata = user.user_metadata || {};
      const integrations = metadata.integrations || {};

      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...metadata,
          integrations: {
            ...integrations,
            obsidian: {
              connected: true,
              vaultPaths,
              lastImportAt: Date.now()
            }
          }
        }
      });
      return json(res, 200, { success: true });
    }

    case 'obsidian/disconnect': {
      const metadata = user.user_metadata || {};
      const integrations = metadata.integrations || {};
      delete integrations.obsidian;

      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...metadata,
          integrations
        }
      });
      return json(res, 200, { success: true });
    }

    case 'schoology/connect': {
      const { consumerKey, accessToken } = req.body || {};
      const metadata = user.user_metadata || {};
      const integrations = metadata.integrations || {};

      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...metadata,
          integrations: {
            ...integrations,
            schoology: {
              connected: true,
              consumerKey,
              accessToken,
              connectedAt: Date.now()
            }
          }
        }
      });
      return json(res, 200, { success: true });
    }

    case 'schoology/disconnect': {
      const metadata = user.user_metadata || {};
      const integrations = metadata.integrations || {};
      delete integrations.schoology;

      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...metadata,
          integrations
        }
      });
      return json(res, 200, { success: true });
    }

    default:
      return json(res, 400, { error: 'Invalid integration action' });
  }
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
      // Capture why the user left before their record is gone, so we can
      // learn from churn. Destructure defensively: a missing/malformed body
      // must not block the deletion itself.
      const { reason = '', feedback = '' } = (req.body || {}) as {
        reason?: string;
        feedback?: string;
      };

      // Persist the reason for the maintainer (post-launch, this could feed
      // a support ticker or a churn report). Best-effort — never block the
      // user's own deletion on a logging failure.
      try {
        const reasonText = [reason, feedback].filter(Boolean).join(' — ').slice(0, 2000);
        if (reasonText) {
          await logAuditEvent(supabase, {
            actorEmail: user.email || 'unknown',
            action: 'Account deleted (user-initiated)',
            category: 'user',
            details: reasonText,
            severity: 'info',
          });
        }
      } catch (err) {
        console.warn('[account/delete] failed to log deletion reason:', err.message);
      }

      // Clean up public-schema data first (decks, cards, etc.) then the auth
      // record, mirroring the admin delete path.
      try {
        const cleanups = ['cards', 'decks', 'study_sessions', 'chat_logs', 'card_reviews'];
        for (const table of cleanups) {
          await supabase.from(table).delete().eq('user_id', user.id).catch(() => {});
        }
      } catch { /* best-effort cleanup */ }

      await supabase.auth.admin.deleteUser(user.id);
      return json(res, 200, { success: true });
    }
    default:
      return json(res, 400, { error: 'Invalid account action' });
  }
}

// --- Audit Log Helper ---

async function logAuditEvent(supabase: any, event: {
  actorEmail: string;
  action: string;
  category: 'user' | 'subscription' | 'admin' | 'database' | 'system' | 'security';
  targetId?: string;
  targetEmail?: string;
  details?: string;
  severity?: 'info' | 'warning' | 'critical';
}) {
  try {
    await supabase.from('audit_events').insert({
      actor_email: event.actorEmail,
      action: event.action,
      category: event.category,
      target_id: event.targetId || null,
      target_email: event.targetEmail || null,
      details: event.details || null,
      severity: event.severity || 'info',
      created_at: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Failed to log audit event:', err.message);
  }
}

// --- Audit Endpoints ---

// Shared audit list query logic
async function handleAuditList(req: VercelRequest, res: VercelResponse, supabase: any) {
  const parsed = validateBody(res, AuditListSchema, req.body || {});
  if (!parsed.ok) return;
  const { limit, offset, category, severity } = parsed.data;

  let query = supabase.from('audit_events').select('*', { count: 'exact' });
  if (category) query = query.eq('category', category);
  if (severity) query = query.eq('severity', severity);
  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) throw error;

  const events = (data || []).map((e: any) => ({
    id: e.id,
    action: e.action,
    category: e.category,
    actor: e.actor_email?.split('@')[0] || 'Unknown',
    actorEmail: e.actor_email,
    target: e.target_id,
    targetEmail: e.target_email,
    details: e.details,
    severity: e.severity,
    timestamp: new Date(e.created_at).getTime(),
  }));

  // Also fetch unfiltered per-category counts for the badge pills
  let categoryCounts: Record<string, number> = {};
  try {
    const { data: catData } = await supabase
      .from('audit_events')
      .select('category')
      .limit(10000);
    if (catData) {
      catData.forEach((e: any) => {
        categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
      });
    }
  } catch { /* ignore count errors */ }

  return json(res, 200, { events, total: count || 0, categoryCounts });
}

// Admin audit sub-endpoint (delegates to shared logic)
async function handleAdminAudit(req: VercelRequest, res: VercelResponse, supabase: any, _user: any) {
  // Delegate to the standalone audit handler's list logic
  const { action } = req.body || {};
  if (action === 'list') {
    return await handleAuditList(req, res, supabase);
  }
  return json(res, 400, { error: 'Invalid audit action. Use: list' });
}

// Standalone audit endpoint (public read + create for admins)
async function handleAudit(req: VercelRequest, res: VercelResponse, action?: string) {
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
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return json(res, 401, { error: 'Invalid token' });

  const isAdmin = user.user_metadata?.is_admin || (ADMIN_EMAIL && user.email === ADMIN_EMAIL);
  if (!isAdmin) return json(res, 403, { error: 'Forbidden' });

  switch (action) {
    case 'list': {
      return await handleAuditList(req, res, supabase);
    }

    case 'create': {
      const parsed = validateBody(res, AuditCreateSchema, req.body);
      if (!parsed.ok) return;
      const event = parsed.data;

      await logAuditEvent(supabase, event as { actorEmail: string; action: string; category: 'user' | 'admin' | 'subscription' | 'database' | 'system' | 'security'; targetId?: string; targetEmail?: string; details?: string; severity?: 'info' | 'warning' | 'critical' });
      return json(res, 200, { success: true });
    }

    default:
      return json(res, 400, { error: 'Invalid audit action' });
  }
}

// --- Stripe Revenue/Metrics Endpoint ---

async function handleAdminRevenue(req: VercelRequest, res: VercelResponse) {
  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

    // Fetch active subscriptions (limit 1000 for scale)
    const activeSubscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 1000,
    });

    const trialingSubscriptions = await stripe.subscriptions.list({
      status: 'trialing',
      limit: 100,
    });

    // Calculate MRR from active subscriptions
    let mrr = 0;
    const planCounts: Record<string, number> = {};
    const currencyBreakdown: Record<string, number> = {};

    activeSubscriptions.data.forEach((sub: any) => {
      const items = sub.items?.data || [];
      items.forEach((item: any) => {
        const unitAmount = item.price?.unit_amount || 0;
        const quantity = item.quantity || 1;
        const interval = item.price?.recurring?.interval;
        const planName = item.price?.nickname || item.price?.id || 'Unknown';

        // Normalize to monthly
        let monthlyAmount = 0;
        if (interval === 'month') monthlyAmount = (unitAmount / 100) * quantity;
        else if (interval === 'year') monthlyAmount = ((unitAmount / 100) * quantity) / 12;
        else if (interval === 'week') monthlyAmount = ((unitAmount / 100) * quantity) * 4.33;

        mrr += monthlyAmount;
        planCounts[planName] = (planCounts[planName] || 0) + 1;

        const currency = item.price?.currency || 'usd';
        currencyBreakdown[currency] = (currencyBreakdown[currency] || 0) + monthlyAmount;
      });
    });

    mrr = Math.round(mrr);

    // Fetch revenue from recent successful charges (last 30 days)
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 86400;
    const recentCharges = await stripe.charges.list({
      limit: 100,
      created: { gte: thirtyDaysAgo },
    });

    const recentRevenue = recentCharges.data
      .filter((c: any) => c.paid)
      .reduce((sum: number, c: any) => sum + c.amount, 0);

    return json(res, 200, {
      mrr,
      arr: mrr * 12,
      activeSubscriptions: activeSubscriptions.data.length,
      trialingSubscriptions: trialingSubscriptions.data.length,
      totalCustomers: String(activeSubscriptions.data.length),
      planBreakdown: planCounts,
      currencyBreakdown,
      recentRevenue: Math.round(recentRevenue / 100),
      revenuePeriod: '30d',
    });
  } catch (err: any) {
    console.error('Revenue fetch error:', err);
    // Return partial data on failure instead of 500
    return json(res, 200, {
      mrr: 0,
      arr: 0,
      activeSubscriptions: 0,
      trialingSubscriptions: 0,
      totalCustomers: '0',
      planBreakdown: {},
      currencyBreakdown: {},
      recentRevenue: 0,
      revenuePeriod: '30d',
      error: err.message,
    });
  }
}

// --- Bulk Admin Operations ---

async function handleAdminBulk(req: VercelRequest, res: VercelResponse, supabase: any, user: any) {
  const { action } = req.body || {};

  switch (action) {
    case 'role': {
      const parsed = validateBody(res, BulkRoleChangeSchema, req.body);
      if (!parsed.ok) return;
      const { userIds, role } = parsed.data;

      const results: { success: string[]; failed: { id: string; error: string }[] } = { success: [], failed: [] };

      for (const uid of userIds) {
        try {
          const { data: userData } = await supabase.auth.admin.getUserById(uid);
          if (!userData?.user) {
            results.failed.push({ id: uid, error: 'User not found' });
            continue;
          }
          if (userData.user.email === ADMIN_EMAIL) {
            results.failed.push({ id: uid, error: 'Cannot change owner' });
            continue;
          }
          await supabase.auth.admin.updateUserById(uid, {
            user_metadata: {
              ...userData.user.user_metadata,
              role,
              is_admin: role === 'admin',
            },
          });
          results.success.push(uid);
          await logAuditEvent(supabase, {
            actorEmail: user.email || 'admin',
            action: `Bulk role change: set to ${role}`,
            category: 'admin',
            targetId: uid,
            targetEmail: userData.user.email,
            details: `Changed role to "${role}" as part of bulk operation (${userIds.length} users)`,
          });
        } catch (err: any) {
          results.failed.push({ id: uid, error: err.message });
        }
      }

      return json(res, 200, { success: true, results });
    }

    case 'email': {
      const parsed = validateBody(res, BulkEmailSchema, req.body);
      if (!parsed.ok) return;
      const { userIds, subject, body } = parsed.data;

      // In production, this would use Resend or similar to actually send emails
      // For now, log and return success
      const emails: string[] = [];
      for (const uid of userIds) {
        const { data: userData } = await supabase.auth.admin.getUserById(uid);
        if (userData?.user?.email) emails.push(userData.user.email);
      }

      await logAuditEvent(supabase, {
        actorEmail: user.email || 'admin',
        action: `Bulk email sent: "${subject}"`,
        category: 'system',
        details: `Sent bulk email to ${emails.length} users. Subject: "${subject}". Body length: ${body.length} chars`,
      });

      return json(res, 200, {
        success: true,
        sent: emails.length,
        recipients: emails,
        message: 'Bulk email logged. Implement actual email sending via Resend for production.',
      });
    }

    case 'export': {
      const parsed = validateBody(res, ExportCSVSchema, req.body);
      if (!parsed.ok) return;
      const { columns, format: fmt } = parsed.data;

      const { data: { users: allUsers } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const defaultColumns = ['id', 'email', 'name', 'role', 'plan', 'joined', 'lastSignIn'];
      const selectedColumns = columns?.length ? columns : defaultColumns;

      let output: string;
      if (fmt === 'csv') {
        const header = selectedColumns.join(',');
        const rows = allUsers.map((u: any) =>
          selectedColumns.map((col: string) => {
            switch (col) {
              case 'id': return `"${u.id}"`;
              case 'email': return `"${u.email}"`;
              case 'name': return `"${u.user_metadata?.full_name || u.email?.split('@')[0]}"`;
              case 'role': return `"${u.user_metadata?.role || 'user'}"`;
              case 'plan': return `"${u.user_metadata?.plan || 'Starter'}"`;
              case 'joined': return `"${u.created_at}"`;
              case 'lastSignIn': return `"${u.last_sign_in_at || ''}"`;
              default: return '""';
            }
          }).join(',')
        ).join('\n');
        output = `${header}\n${rows}`;
      } else {
        const jsonUsers = allUsers.map((u: any) => {
          const obj: Record<string, any> = {};
          selectedColumns.forEach((col: string) => {
            switch (col) {
              case 'id': obj.id = u.id; break;
              case 'email': obj.email = u.email; break;
              case 'name': obj.name = u.user_metadata?.full_name || u.email?.split('@')[0]; break;
              case 'role': obj.role = u.user_metadata?.role || 'user'; break;
              case 'plan': obj.plan = u.user_metadata?.plan || 'Starter'; break;
              case 'joined': obj.joined = u.created_at; break;
              case 'lastSignIn': obj.lastSignIn = u.last_sign_in_at || null; break;
              default: obj[col] = null;
            }
          });
          return obj;
        });
        output = JSON.stringify(jsonUsers, null, 2);
      }

      await logAuditEvent(supabase, {
        actorEmail: user.email || 'admin',
        action: `Exported ${allUsers.length} users as ${fmt.toUpperCase()}`,
        category: 'admin',
        details: `Exported ${allUsers.length} users in ${fmt.toUpperCase()} format with columns: ${selectedColumns.join(', ')}`,
      });

      return json(res, 200, {
        success: true,
        format: fmt,
        filename: `auramind-users-export-${new Date().toISOString().slice(0, 10)}.${fmt}`,
        data: output,
        count: allUsers.length,
      });
    }

    default:
      return json(res, 400, { error: 'Invalid bulk action. Use: role, email, or export' });
  }
}