import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import crypto from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const appUrl = process.env.APP_URL || 'https://www.auramind.app';

type DeletePayload = {
  reasons?: string[];
  otherReason?: string;
};

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

  if (!supabaseUrl || !supabaseServiceKey) {
    return json(res, 500, { error: 'Server configuration error: Missing Supabase Admin credentials' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return json(res, 401, { error: 'Invalid or expired token.' });
  }

  const userId = user.id;
  const userEmail = user.email || '';
  const userName = user.user_metadata?.full_name || userEmail.split('@')[0] || 'User';

  const { reasons, otherReason } = (req.body || {}) as DeletePayload;
  const reasonList = Array.isArray(reasons) ? reasons.filter(Boolean) : [];
  const reasonText = reasonList
    .map((r) => (r === 'Other' && otherReason ? `Other: ${otherReason}` : r))
    .join(', ') || 'No reason provided';

  try {
    // 1. Generate a unique restore token
    const restoreToken = crypto.randomBytes(32).toString('hex');
    const deletionDate = new Date().toISOString();
    const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

    // 2. Store restore token and deletion metadata in user's app_metadata
    const { error: metaError } = await supabase.auth.admin.updateUserById(userId, {
      app_metadata: {
        ...(user.app_metadata || {}),
        deletion_requested: true,
        deletion_date: deletionDate,
        deletion_expiry: expiryDate,
        restore_token: restoreToken,
        deletion_reasons: reasonText,
      },
    });

    if (metaError) {
      console.warn('Failed to store deletion metadata:', metaError);
    }

    // 3. Ban user for 30 days (soft-delete — data is preserved)
    const { error: banError } = await supabase.auth.admin.updateUserById(userId, {
      ban_duration: '720h', // 30 days
    });

    if (banError) {
      throw new Error(`Failed to deactivate account: ${banError.message}`);
    }

    // 4. Cancel Stripe subscriptions if exists
    if (stripeSecretKey && userEmail) {
      try {
        const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' as any });
        const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
        if (customers.data.length > 0) {
          const customerId = customers.data[0].id;
          const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: 'active' });
          for (const sub of subscriptions.data) {
            await stripe.subscriptions.cancel(sub.id);
          }
        }
      } catch (e) {
        console.warn('Stripe cancellation failed:', e);
      }
    }

    // 5. Send deletion confirmation email with restore link
    const apiKey = process.env.RESEND_API_KEY || process.env.RESEND_API_KEY2;
    const fromEmail = (process.env.RESEND_FROM_EMAIL || '').trim().toLowerCase();

    if (apiKey && fromEmail) {
      const restoreUrl = `${appUrl}/restore-account?token=${restoreToken}&uid=${userId}`;

      const userHtml = `
        <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #080808; border-radius: 32px; color: #ffffff;">
          <div style="text-align: center; margin-bottom: 40px;">
            <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #ef4444 0%, #991b1b 100%); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </div>
            <h1 style="font-size: 28px; font-weight: 900; letter-spacing: -0.05em; margin: 0; text-transform: uppercase; color: #ef4444;">Account Deactivated</h1>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6; color: rgba(255,255,255,0.8); margin-bottom: 16px;">
            Hi ${userName},
          </p>
          
          <p style="font-size: 14px; line-height: 1.6; color: rgba(255,255,255,0.5); margin-bottom: 24px;">
            Your AuraMind account has been deactivated per your request. Your data is preserved for <strong style="color: rgba(255,255,255,0.7);">30 days</strong> in case you change your mind.
          </p>

          <div style="background: rgba(255,255,255,0.05); padding: 24px; border-radius: 16px; margin-bottom: 24px; border: 1px solid rgba(255,255,255,0.1);">
            <p style="margin: 0 0 8px; color: rgba(255,255,255,0.4); font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">Reason for leaving</p>
            <p style="margin: 0; color: rgba(255,255,255,0.7); font-size: 14px;">${reasonText}</p>
          </div>

          <div style="background: rgba(239, 68, 68, 0.1); padding: 24px; border-radius: 16px; margin-bottom: 32px; border: 1px solid rgba(239, 68, 68, 0.2);">
            <p style="margin: 0 0 8px; color: #ef4444; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">⚠ Deleted this by accident?</p>
            <p style="margin: 0 0 16px; color: rgba(255,255,255,0.6); font-size: 13px; line-height: 1.5;">
              Click the button below to instantly restore your account. This link expires in 30 days — after that, all data is permanently deleted.
            </p>
            <div style="text-align: center;">
              <a href="${restoreUrl}" style="display: inline-block; padding: 14px 32px; background: #ef4444; color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em;">Restore My Account</a>
            </div>
          </div>

          <p style="font-size: 11px; color: rgba(255,255,255,0.25); text-align: center; margin-top: 32px; line-height: 1.6;">
            If you did not request this deletion, please restore your account immediately using the link above or contact support.
          </p>
        </div>
      `;

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
            subject: 'Your AuraMind account has been deactivated',
            html: userHtml,
          }),
        });
      } catch (e) {
        console.warn('User deletion email failed:', e);
      }

      // Send admin notification
      const adminEmail = process.env.RESEND_ADMIN_EMAIL;
      if (adminEmail) {
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: `AuraMind <${fromEmail}>`,
              to: [adminEmail],
              subject: `Account deletion: ${userEmail}`,
              html: `
                <div style="font-family: 'Inter', system-ui, sans-serif; padding: 24px; color: #111;">
                  <h2 style="margin: 0 0 16px;">Account Deletion Request</h2>
                  <p><strong>User:</strong> ${userName} (${userEmail})</p>
                  <p><strong>User ID:</strong> ${userId}</p>
                  <p><strong>Date:</strong> ${deletionDate}</p>
                  <p><strong>Expires:</strong> ${expiryDate}</p>
                  <p><strong>Reasons:</strong> ${reasonText}</p>
                  <p style="margin-top: 16px; color: #666;">Account is soft-deleted (banned for 30 days). Data is preserved. User has a restore link in their email.</p>
                </div>
              `,
            }),
          });
        } catch (e) {
          console.warn('Admin email failed:', e);
        }
      }
    }

    return json(res, 200, { ok: true, message: 'Account deactivated. Check your email for restoration instructions.' });
  } catch (err: any) {
    return json(res, 500, { error: err.message || 'Failed to deactivate account' });
  }
}
