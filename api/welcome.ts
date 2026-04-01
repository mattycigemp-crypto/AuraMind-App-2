import type { VercelRequest, VercelResponse } from '@vercel/node';

const json = (res: VercelResponse, status: number, body: Record<string, unknown>) => {
  res.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
};

const extractValidEmail = (input: unknown): string | null => {
  const raw = String(input ?? '').trim();
  if (!raw) return null;
  const angleMatch = raw.match(/<([^>]+)>/);
  const candidate = (angleMatch ? angleMatch[1] : raw).trim().replace(/^"+|"+$/g, '');
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(candidate);
  return isValid ? candidate.toLowerCase() : null;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  const { email, name } = req.body || {};
  if (!email) {
    return json(res, 400, { error: 'Email is required' });
  }
  const preferredRecipient = process.env.RESEND_TEST_RECIPIENT || email;
  const hardcodedFallbackRecipient = 'matty.cigemp@gmail.com';
  let recipientEmail = extractValidEmail(preferredRecipient);
  if (!recipientEmail) {
    recipientEmail = extractValidEmail(process.env.RESEND_ADMIN_EMAIL);
  }
  if (!recipientEmail) {
    recipientEmail = extractValidEmail(hardcodedFallbackRecipient);
  }
  if (!recipientEmail) {
    return json(res, 400, {
      error: 'Recipient email is invalid. Set RESEND_TEST_RECIPIENT or RESEND_ADMIN_EMAIL to a valid address.',
      debug: {
        hasResendTestRecipient: Boolean(process.env.RESEND_TEST_RECIPIENT),
        hasResendAdminEmail: Boolean(process.env.RESEND_ADMIN_EMAIL),
      },
    });
  }

  const apiKey = process.env.RESEND_API_KEY || process.env.RESEND_API_KEY2;
  const fromEmail = (process.env.RESEND_FROM_EMAIL || 'no-reply@mail.auramind.app').trim().toLowerCase();
  const allowedSenderDomain = '@mail.auramind.app';

  if (!apiKey) {
    return json(res, 500, { error: 'Missing RESEND_API_KEY (or RESEND_API_KEY2).' });
  }

  if (!fromEmail.endsWith(allowedSenderDomain)) {
    return json(res, 500, { error: `RESEND_FROM_EMAIL must end with ${allowedSenderDomain}.` });
  }

  const html = `
    <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #080808; border-radius: 32px; color: #ffffff;">
      <div style="text-align: center; margin-bottom: 40px;">
        <div style="width: 64px; height: 64px; background: linear-gradient(to bottom right, #7c3aed, #0f766e); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <h1 style="font-size: 32px; font-weight: 900; letter-spacing: -0.05em; margin: 0; text-transform: uppercase;">Welcome to AuraMind</h1>
      </div>
      
      <p style="font-size: 18px; line-height: 1.6; color: rgba(255,255,255,0.8); margin-bottom: 24px;">
        Hi ${name || 'Academic'},
      </p>
      
      <p style="font-size: 16px; line-height: 1.6; color: rgba(255,255,255,0.6); margin-bottom: 32px;">
        Your gateway to faster learning is now open. We've unlocked your workspace and initialized your AI study assistant.
      </p>
      
      <div style="background: rgba(255,255,255,0.05); padding: 32px; border-radius: 24px; margin-bottom: 32px; border: 1px solid rgba(255,255,255,0.1);">
        <h3 style="margin-top: 0; color: #3b82f6; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">First Steps</h3>
        <ul style="padding-left: 20px; color: rgba(255,255,255,0.8); margin: 16px 0 0 0;">
          <li style="margin-bottom: 8px;">Upload your first course PDF</li>
          <li style="margin-bottom: 8px;">Generate your first deck with AI</li>
          <li style="margin-bottom: 0;">Start your daily review streak</li>
        </ul>
      </div>
      
      <div style="text-align: center;">
        <a href="https://www.auramind.app/dashboard" style="display: inline-block; padding: 16px 32px; background: #ffffff; color: #000000; text-decoration: none; border-radius: 16px; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em;">Enter Workspace</a>
      </div>
      
      <p style="font-size: 12px; color: rgba(255,255,255,0.3); text-align: center; margin-top: 48px;">
        If you didn't sign up for AuraMind, please ignore this email.
      </p>
    </div>
  `;

  try {
    let response: Response;
    try {
      response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `AuraMind <${fromEmail}>`,
          to: [recipientEmail],
          subject: 'Your AuraMind session is ready',
          html,
        }),
      });
    } catch (networkError: any) {
      return json(res, 502, { error: `Network error calling Resend: ${networkError?.message || 'Unknown network error'}` });
    }

    const raw = await response.text();
    let data: any = {};
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = { message: raw };
    }

    if (!response.ok) {
      const resendMessage = data?.message || 'Failed to send welcome email.';
      const hint = resendMessage.includes('testing emails')
        ? 'Resend is treating this as sandbox mode. Use an API key from the same Resend workspace where mail.auramind.app is verified, and set RESEND_FROM_EMAIL to an address on that domain.'
        : undefined;
      return json(res, response.status, { error: resendMessage, hint });
    }

    return json(res, 200, { ok: true, to: recipientEmail, messageId: data?.id || null });
  } catch (err: any) {
    return json(res, 500, {
      error: `Internal server error: ${err.message || 'Unknown error'
        } `
    });
  }
}
