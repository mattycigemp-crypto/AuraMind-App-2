import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const json = (res: VercelResponse, status: number, body: Record<string, unknown>) => {
  res.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  const { token, uid } = (req.body || {}) as { token?: string; uid?: string };

  if (!token || !uid) {
    return json(res, 400, { error: 'Missing restore token or user ID.' });
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return json(res, 500, { error: 'Server configuration error.' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Fetch user by ID using admin API
    const { data: { user }, error: fetchError } = await supabase.auth.admin.getUserById(uid);

    if (fetchError || !user) {
      return json(res, 404, { error: 'Account not found. It may have been permanently deleted.' });
    }

    const appMeta = user.app_metadata || {};

    // 2. Validate restore token
    if (!appMeta.deletion_requested || appMeta.restore_token !== token) {
      return json(res, 403, { error: 'Invalid or expired restore token.' });
    }

    // 3. Check if within 30-day window
    const expiry = appMeta.deletion_expiry ? new Date(appMeta.deletion_expiry) : null;
    if (expiry && new Date() > expiry) {
      return json(res, 410, { error: 'Restoration window has expired. Your account has been permanently deleted.' });
    }

    // 4. Unban the user
    const { error: unbanError } = await supabase.auth.admin.updateUserById(uid, {
      ban_duration: 'none',
    });

    if (unbanError) {
      throw new Error(`Failed to restore account: ${unbanError.message}`);
    }

    // 5. Clear deletion metadata
    const { error: metaError } = await supabase.auth.admin.updateUserById(uid, {
      app_metadata: {
        ...appMeta,
        deletion_requested: false,
        deletion_date: null,
        deletion_expiry: null,
        restore_token: null,
        deletion_reasons: null,
      },
    });

    if (metaError) {
      console.warn('Failed to clear deletion metadata:', metaError);
    }

    // 6. Send restoration confirmation email
    const apiKey = process.env.RESEND_API_KEY || process.env.RESEND_API_KEY2;
    const fromEmail = (process.env.RESEND_FROM_EMAIL || '').trim().toLowerCase();
    const userEmail = user.email || '';
    const userName = user.user_metadata?.full_name || userEmail.split('@')[0] || 'User';

    if (apiKey && fromEmail && userEmail) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `AuraMind <${fromEmail}>`,
            to: [userEmail],
            subject: 'Your AuraMind account has been restored!',
            html: `
              <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #080808; border-radius: 32px; color: #ffffff;">
                <div style="text-align: center; margin-bottom: 40px;">
                  <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #22c55e 0%, #15803d 100%); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  </div>
                  <h1 style="font-size: 28px; font-weight: 900; letter-spacing: -0.05em; margin: 0; text-transform: uppercase; color: #22c55e;">Account Restored</h1>
                </div>
                
                <p style="font-size: 16px; line-height: 1.6; color: rgba(255,255,255,0.8); margin-bottom: 16px;">
                  Welcome back, ${userName}!
                </p>
                
                <p style="font-size: 14px; line-height: 1.6; color: rgba(255,255,255,0.5); margin-bottom: 32px;">
                  Your AuraMind account has been successfully restored. All your decks, cards, and study progress are exactly as you left them.
                </p>

                <div style="text-align: center;">
                  <a href="https://www.auramind.app/auth" style="display: inline-block; padding: 16px 32px; background: #ffffff; color: #000000; text-decoration: none; border-radius: 16px; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em;">Sign In Now</a>
                </div>

                <p style="font-size: 11px; color: rgba(255,255,255,0.25); text-align: center; margin-top: 40px;">
                  We're glad to have you back. If you have any questions, contact support.
                </p>
              </div>
            `,
          }),
        });
      } catch (e) {
        console.warn('Restoration email failed:', e);
      }
    }

    return json(res, 200, { ok: true, message: 'Account restored successfully! You can sign in now.' });
  } catch (err: any) {
    return json(res, 500, { error: err.message || 'Failed to restore account' });
  }
}
