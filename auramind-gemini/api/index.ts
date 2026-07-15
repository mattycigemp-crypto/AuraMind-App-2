import type { VercelRequest, VercelResponse } from '@vercel/node';
import { withErrorHandler, type MiddlewareContext } from './middleware';
import { loadEnv } from './lib/env';
import { sendSuccess, sendError } from './lib/response';
import { validateBody } from './lib/validate';
import { BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError } from './lib/errors';
import { z } from 'zod';
import { logger } from './lib/logger';

async function handler(req: VercelRequest, res: VercelResponse, ctx: MiddlewareContext) {
  const { path } = req.query;

  if (!path || typeof path !== 'string') {
    throw new BadRequestError('Invalid path');
  }

  // Health check
  if (path === 'health') {
    return sendSuccess(res, {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }

  const [endpoint, action] = path.split('/');

  switch (endpoint) {
    case 'admin':
      return await handleAdmin(req, res, ctx, action);
    case 'coupons':
      return await handleCoupons(req, res, ctx, action);
    case 'users':
      return await handleUsers(req, res, action);
    case 'subscription':
      return await handleSubscription(req, res, action);
    case 'stripe':
      return await handleStripe(req, res, ctx, action);
    case 'account':
      return await handleAccount(req, res, ctx, action);
    case 'integrations':
      return await handleIntegrations(req, res, ctx, action);
    case 'fetch-url':
      return await handleFetchUrl(req, res);
    case 'fetch-youtube-transcript':
      return await handleFetchYouTubeTranscript(req, res);
    default:
      throw new NotFoundError('Endpoint not found');
  }
}

export default withErrorHandler(handler);

async function createSupabaseAdmin() {
  const { createClient } = await import('@supabase/supabase-js');
  const env = loadEnv();
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
}

async function getAuthedUser(req: VercelRequest) {
  const supabase = await createSupabaseAdmin();
  const authHeader = req.headers.authorization;
  if (!authHeader) throw new UnauthorizedError('Missing authorization');

  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) throw new UnauthorizedError('Invalid token');
  return { supabase, user: data.user };
}

function isAdmin(user: { email?: string | null; user_metadata?: Record<string, unknown> }): boolean {
  const isDev = process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'development';
  if (isDev) return true;
  return !!(user.user_metadata?.is_admin || user.email === 'matty.cigemp@gmail.com');
}

async function handleAdmin(req: VercelRequest, res: VercelResponse, ctx: MiddlewareContext, action?: string) {
  const { supabase, user } = await getAuthedUser(req);
  if (!isAdmin(user)) throw new ForbiddenError('Admin access required');

  switch (action) {
    case 'list': {
      const { data: { users } } = await supabase.auth.admin.listUsers();
      const mappedUsers = users.map((u: any) => ({
        id: u.id,
        email: u.email,
        name: u.user_metadata?.full_name || u.email?.split('@')[0],
        isAdmin: isAdmin(u),
        role: u.user_metadata?.role || (u.email === 'matty.cigemp@gmail.com' ? 'owner' : 'user'),
        avatar: u.user_metadata?.avatar_url,
        lastSignIn: u.last_sign_in_at,
        created: u.created_at,
        plan: u.user_metadata?.plan || 'Starter',
      }));
      return sendSuccess(res, { users: mappedUsers });
    }

    case 'toggle': {
      const { targetUserId, makeAdmin } = validateBody(
        z.object({ targetUserId: z.string().min(1), makeAdmin: z.boolean() }),
        req,
      );
      const { data: targetUser } = await supabase.auth.admin.getUserById(targetUserId);
      if (!targetUser?.user) throw new NotFoundError('User not found');
      await supabase.auth.admin.updateUserById(targetUserId, {
        user_metadata: { ...targetUser.user.user_metadata, is_admin: makeAdmin },
      });
      return sendSuccess(res, { success: true });
    }

    case 'utility':
      return await handleAdminUtility(req, res, ctx, supabase, user);

    case 'test':
      return await handleAdminTest(res, supabase);

    default:
      throw new BadRequestError('Invalid admin action');
  }
}

async function handleAdminUtility(
  req: VercelRequest,
  res: VercelResponse,
  _ctx: MiddlewareContext,
  supabase: any,
  _requestingUser: any,
) {
  const { action, targetUserId, testData } = req.body || {};

  switch (action) {
    case 'set_role': {
      if (!targetUserId) throw new BadRequestError('targetUserId required');
      const { role } = testData || {};
      const { data: userData } = await supabase.auth.admin.getUserById(targetUserId);
      if (!userData?.user) throw new NotFoundError('User not found');
      if (userData.user.email === 'matty.cigemp@gmail.com') throw new ForbiddenError('Cannot change owner');
      await supabase.auth.admin.updateUserById(targetUserId, {
        user_metadata: { ...userData.user.user_metadata, role: role || 'user', is_admin: ['owner', 'ceo', 'admin'].includes(role) },
      });
      return sendSuccess(res, { role: role || 'user' });
    }

    case 'set_subscription': {
      if (!targetUserId) throw new BadRequestError('targetUserId required');
      const { status, plan } = testData || {};
      const { data: userData } = await supabase.auth.admin.getUserById(targetUserId);
      if (!userData?.user) throw new NotFoundError('User not found');
      await supabase.auth.admin.updateUserById(targetUserId, {
        user_metadata: { ...userData.user.user_metadata, subscription_status: status || 'active', plan: plan || 'Pro' },
      });
      return sendSuccess(res, { success: true });
    }

    case 'create_test_user': {
      const { email, password, makeAdmin = false, role = 'user' } = testData || {};
      if (!email || !password) throw new BadRequestError('email and password required');

      const userPayload = {
        email, password, email_confirm: true,
        user_metadata: {
          full_name: email.split('@')[0],
          is_admin: makeAdmin || ['owner', 'ceo', 'admin'].includes(role),
          role, plan: 'Starter', subscription_status: 'none', joined_date: Date.now().toString(),
        },
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
      return sendSuccess(res, { user: { id: data.user.id, email: data.user.email, role } });
    }

    case 'get_user_details': {
      if (!targetUserId) throw new BadRequestError('targetUserId required');
      const { data: userData } = await supabase.auth.admin.getUserById(targetUserId);
      if (!userData?.user) throw new NotFoundError('User not found');
      return sendSuccess(res, { user: { id: userData.user.id, email: userData.user.email, metadata: userData.user.user_metadata } });
    }

    default:
      throw new BadRequestError('Invalid utility action');
  }
}

async function handleAdminTest(res: VercelResponse, supabase: any) {
  const results: any[] = [];
  try {
    const { data: { users } } = await supabase.auth.admin.listUsers();
    results.push({ name: 'Supabase Connection', status: 'passed', message: `Found ${users.length} users` });
  } catch (err: any) {
    results.push({ name: 'Supabase Connection', status: 'failed', message: err.message });
  }
  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
    await stripe.prices.list({ limit: 1 });
    results.push({ name: 'Stripe API', status: 'passed', message: 'Connected' });
  } catch (err: any) {
    results.push({ name: 'Stripe API', status: 'failed', message: err.message });
  }
  return sendSuccess(res, { timestamp: new Date().toISOString(), tests: results });
}

async function handleCoupons(req: VercelRequest, res: VercelResponse, ctx: MiddlewareContext, action?: string) {
  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
  const { supabase, user } = await getAuthedUser(req);
  if (!isAdmin(user)) throw new ForbiddenError('Admin access required');

  switch (action) {
    case 'list': {
      const coupons = await stripe.coupons.list({ limit: 100 });
      return sendSuccess(res, { coupons: coupons.data });
    }
    case 'create': {
      const body = validateBody(
        z.object({
          name: z.string().optional(),
          percent_off: z.number().optional(),
          amount_off: z.number().optional(),
          duration: z.string().optional(),
          duration_in_months: z.number().optional(),
          id: z.string().optional(),
        }),
        req,
      );
      const coupon = await stripe.coupons.create({
        id: body.id || undefined,
        name: body.name || 'Coupon',
        percent_off: body.percent_off,
        amount_off: body.amount_off ? body.amount_off * 100 : undefined,
        duration: body.duration || 'once',
        duration_in_months: body.duration === 'repeating' ? body.duration_in_months : undefined,
      });
      return sendSuccess(res, { coupon });
    }
    case 'delete': {
      const { couponId } = validateBody(z.object({ couponId: z.string().min(1) }), req);
      await stripe.coupons.delete(couponId);
      return sendSuccess(res, { success: true });
    }
    default:
      throw new BadRequestError('Invalid coupon action');
  }
}

async function handleUsers(_req: VercelRequest, res: VercelResponse, _action?: string) {
  return sendError(res, 400, 'Use /api/admin/list instead');
}

async function handleSubscription(req: VercelRequest, res: VercelResponse, _action?: string) {
  if (req.method !== 'POST') return sendError(res, 405, 'Method not allowed');

  const supabase = await createSupabaseAdmin();
  const { userId } = validateBody(z.object({ userId: z.string().min(1) }), req);

  const { data: userData } = await supabase.auth.admin.getUserById(userId);
  if (!userData?.user) throw new NotFoundError('User not found');

  const metadata = userData.user.user_metadata || {};
  const subscriptionStatus = metadata.subscription_status;

  if (subscriptionStatus === 'active' || subscriptionStatus === 'trialing') {
    return sendSuccess(res, { subscribed: true, status: subscriptionStatus, plan: metadata.plan || 'Starter' });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('trial_end')
    .eq('id', userId)
    .single();

  if (profile?.trial_end && new Date(profile.trial_end) > new Date()) {
    return sendSuccess(res, { subscribed: true, status: 'trialing', plan: 'Starter' });
  }

  return sendSuccess(res, { subscribed: false, status: 'none', plan: metadata.plan || 'Starter' });
}

async function handleStripe(req: VercelRequest, res: VercelResponse, ctx: MiddlewareContext, action?: string) {
  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

  switch (action) {
    case 'checkout': {
      const { priceId, userId, email } = validateBody(
        z.object({ priceId: z.string().min(1), userId: z.string().min(1), email: z.string().email() }),
        req,
      );
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_collection: 'always',
        line_items: [{ price: priceId, quantity: 1 }],
        subscription_data: { trial_period_days: 7, metadata: { supabase_user_id: userId } },
        customer_email: email,
        metadata: { supabase_user_id: userId },
        success_url: `${req.headers.origin || 'https://auramind.app'}/dashboard?payment=success`,
        cancel_url: `${req.headers.origin || 'https://auramind.app'}/subscribe?payment=cancelled`,
      });

      // Immediately mark user as trialing to prevent redirect loop after Stripe redirect
      try {
        const supabase = await createSupabaseAdmin();
        const { data: userData } = await supabase.auth.admin.getUserById(userId);
        if (userData?.user) {
          await supabase.auth.admin.updateUserById(userId, {
            user_metadata: {
              ...userData.user.user_metadata,
              subscription_status: 'trialing',
              plan: 'Pro',
            },
          });
        }
      } catch (metaErr: any) {
        logger.warn('Failed to update user metadata after checkout', { error: metaErr.message });
      }

      return sendSuccess(res, { url: session.url });
    }
    case 'portal': {
      const { customerId } = validateBody(z.object({ customerId: z.string().min(1) }), req);
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${req.headers.origin || 'https://auramind.app'}/settings`,
      });
      return sendSuccess(res, { url: session.url });
    }
    default:
      throw new BadRequestError('Invalid stripe action');
  }
}

async function handleAccount(req: VercelRequest, res: VercelResponse, ctx: MiddlewareContext, action?: string) {
  const { supabase, user } = await getAuthedUser(req);

  switch (action) {
    case 'delete': {
      await supabase.auth.admin.deleteUser(user.id);
      logger.info('Account deleted', { requestId: ctx.requestId, userId: user.id });
      return sendSuccess(res, { success: true });
    }
    default:
      throw new BadRequestError('Invalid account action');
  }
}

async function handleIntegrations(req: VercelRequest, res: VercelResponse, _ctx: MiddlewareContext, action?: string) {
  const { supabase, user } = await getAuthedUser(req);
  const metadata = user.user_metadata || {};
  const integrations = metadata.integrations || {};

  switch (action) {
    case 'notion/connect': {
      const { accessToken, workspaceId, workspaceName } = validateBody(
        z.object({ accessToken: z.string().min(1), workspaceId: z.string().optional(), workspaceName: z.string().optional() }),
        req,
      );
      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: { ...metadata, integrations: { ...integrations, notion: { connected: true, accessToken, workspaceId, workspaceName, connectedAt: Date.now() } } },
      });
      return sendSuccess(res, { success: true });
    }
    case 'notion/disconnect': {
      const updated = { ...integrations };
      delete updated.notion;
      await supabase.auth.admin.updateUserById(user.id, { user_metadata: { ...metadata, integrations: updated } });
      return sendSuccess(res, { success: true });
    }
    case 'anki/update': {
      const { importCount } = validateBody(z.object({ importCount: z.number().optional() }), req);
      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: { ...metadata, integrations: { ...integrations, anki: { connected: true, lastImportAt: Date.now(), importCount: (integrations.anki?.importCount || 0) + (importCount || 0) } } },
      });
      return sendSuccess(res, { success: true });
    }
    case 'obsidian/connect': {
      const { vaultPaths } = req.body || {};
      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: { ...metadata, integrations: { ...integrations, obsidian: { connected: true, vaultPaths, lastImportAt: Date.now() } } },
      });
      return sendSuccess(res, { success: true });
    }
    case 'obsidian/disconnect': {
      const updated = { ...integrations };
      delete updated.obsidian;
      await supabase.auth.admin.updateUserById(user.id, { user_metadata: { ...metadata, integrations: updated } });
      return sendSuccess(res, { success: true });
    }
    case 'schoology/connect': {
      const { consumerKey, accessToken } = req.body || {};
      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: { ...metadata, integrations: { ...integrations, schoology: { connected: true, consumerKey, accessToken, connectedAt: Date.now() } } },
      });
      return sendSuccess(res, { success: true });
    }
    case 'schoology/disconnect': {
      const updated = { ...integrations };
      delete updated.schoology;
      await supabase.auth.admin.updateUserById(user.id, { user_metadata: { ...metadata, integrations: updated } });
      return sendSuccess(res, { success: true });
    }
    default:
      throw new BadRequestError('Invalid integration action');
  }
}

async function handleFetchUrl(req: VercelRequest, res: VercelResponse) {
  const { url } = validateBody(z.object({ url: z.string().url() }), req);

  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AuraMind/1.0)' },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new BadRequestError(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();

  // Strip HTML tags and scripts
  const withoutScripts = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  const withoutStyles = withoutScripts.replace(/<style[\s\S]*?<\/style>/gi, '');
  const text = withoutStyles
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[^;]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 50000);

  // Try to extract a title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';

  return sendSuccess(res, { title, text, url });
}

function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

async function handleFetchYouTubeTranscript(req: VercelRequest, res: VercelResponse) {
  const { url } = validateBody(z.object({ url: z.string().min(1) }), req);

  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    throw new BadRequestError('Invalid YouTube URL');
  }

  // Fetch video page to get the title
  const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AuraMind/1.0)' },
    signal: AbortSignal.timeout(10000),
  });
  const pageHtml = await pageRes.text();
  const titleMatch = pageHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(' - YouTube', '').trim() : '';

  // Try youtube-transcript API (no key needed)
  try {
    const transcriptRes = await fetch(
      `https://youtubetranscript.com/?v=${videoId}&format=json`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!transcriptRes.ok) {
      return sendSuccess(res, {
        title,
        text: '',
        videoId,
        error: 'Transcript not available for this video',
      });
    }

    const data = await transcriptRes.json() as { text: string; duration: number }[];
    const fullText = data.map((seg) => seg.text).join(' ').trim();
    const text = fullText.slice(0, 50000);

    return sendSuccess(res, { title, text: text || '', videoId });
  } catch {
    return sendSuccess(res, {
      title,
      text: '',
      videoId,
      error: 'Transcript not available for this video',
    });
  }
}
