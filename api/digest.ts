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

  const { email, weeklyMastery, totalReviews, streak } = req.body || {};
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
        <h1 style="font-size: 14px; font-weight: 800; letter-spacing: 0.2em; margin: 0; color: #3b82f6; text-transform: uppercase;">AuraMind Digest</h1>
        <p style="margin: 8px 0 0 0; font-size: 28px; font-weight: 900; color: #ffffff;">Weekly Academic Report</p>
      </div>
      
      <div style="display: flex; gap: 12px; margin-bottom: 32px;">
        <div style="flex: 1; background: rgba(255,255,255,0.03); padding: 24px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); text-align: center;">
          <p style="margin: 0; font-size: 10px; font-weight: 800; color: rgba(255,255,255,0.4); text-transform: uppercase;">Mastery</p>
          <p style="margin: 8px 0 0 0; font-size: 24px; font-weight: 900; color: #ffffff;">${weeklyMastery || '0'}%</p>
        </div>
        <div style="flex: 1; background: rgba(255,255,255,0.03); padding: 24px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); text-align: center;">
          <p style="margin: 0; font-size: 10px; font-weight: 800; color: rgba(255,255,255,0.4); text-transform: uppercase;">Reviews</p>
          <p style="margin: 8px 0 0 0; font-size: 24px; font-weight: 900; color: #ffffff;">${totalReviews || '0'}</p>
        </div>
        <div style="flex: 1; background: rgba(255,255,255,0.03); padding: 24px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); text-align: center;">
          <p style="margin: 0; font-size: 10px; font-weight: 800; color: rgba(255,255,255,0.4); text-transform: uppercase;">Streak</p>
          <p style="margin: 8px 0 0 0; font-size: 24px; font-weight: 900; color: #3b82f6;">${streak || '0'}d</p>
        </div>
      </div>
      
      <div style="background: rgba(59,130,246,0.05); padding: 32px; border-radius: 24px; margin-bottom: 32px; border: 1px solid rgba(59,130,246,0.1);">
        <p style="margin: 0; font-size: 16px; line-height: 1.6; color: rgba(255,255,255,0.8);">
          "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice."
        </p>
        <p style="margin: 16px 0 0 0; font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.4); text-transform: uppercase;">— COGNITIVE INSIGHT</p>
      </div>
      
      <div style="text-align: center;">
        <a href="https://auramind.ai" style="display: inline-block; padding: 16px 32px; background: #ffffff; color: #000000; text-decoration: none; border-radius: 16px; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em;">Analytic Dashboard</a>
      </div>
      
      <p style="font-size: 12px; color: rgba(255,255,255,0.2); text-align: center; margin-top: 48px;">
        Sent automatically by AuraMind Intelligence.
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
          from: `AuraMind Reports <${fromEmail}>`,
          to: [recipientEmail],
          subject: `Weekly Academic Performance: ${weeklyMastery}% Mastery`,
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
      const resendMessage = data?.message || 'Failed to send digest email.';
      const hint = resendMessage.includes('testing emails')
        ? 'Resend is treating this as sandbox mode. Use an API key from the same Resend workspace where mail.auramind.app is verified, and set RESEND_FROM_EMAIL to an address on that domain.'
        : undefined;
      return json(res, response.status, { error: resendMessage, hint });
    }

    return json(res, 200, { ok: true, to: recipientEmail, messageId: data?.id || null });
  } catch (err: any) {
    return json(res, 500, { error: `Internal server error: ${err.message || 'Unknown error'}` });
  }
}
