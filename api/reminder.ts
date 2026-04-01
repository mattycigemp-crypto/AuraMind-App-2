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

  const { email, cardsDue, deckTitle } = req.body || {};
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
        <div style="width: 64px; height: 64px; background: rgba(59,130,246,0.1); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; border: 1px solid rgba(59,130,246,0.2);">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <h1 style="font-size: 24px; font-weight: 800; letter-spacing: -0.02em; margin: 0; color: #ffffff;">Study Session Reminder</h1>
      </div>
      
      <p style="font-size: 16px; line-height: 1.6; color: rgba(255,255,255,0.7); text-align: center; margin-bottom: 32px;">
        Your cognitive review cycle needs attention. You have <strong>${cardsDue || 'several'} items</strong> waiting for mastery.
      </p>
      
      <div style="background: linear-gradient(to bottom right, rgba(59,130,246,0.1), transparent); padding: 32px; border-radius: 24px; margin-bottom: 32px; text-align: center; border: 1px solid rgba(59,130,246,0.1);">
        <p style="margin: 0 0 8px 0; color: rgba(255,255,255,0.4); font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.2em;">Active Deck</p>
        <p style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff;">${deckTitle || 'Course Materials'}</p>
        <div style="margin-top: 24px; display: inline-block; background: #3b82f6; color: #ffffff; padding: 4px 12px; rounded-full font-size: 12px; font-weight: 900; border-radius: 100px;">
          ${cardsDue || '10+'} CARDS DUE
        </div>
      </div>
      
      <div style="text-align: center;">
        <a href="https://auramind.ai" style="display: inline-block; padding: 16px 32px; background: #ffffff; color: #000000; text-decoration: none; border-radius: 16px; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em;">Start Review Session</a>
      </div>
      
      <p style="font-size: 12px; color: rgba(255,255,255,0.2); text-align: center; margin-top: 48px;">
        To manage notification preferences, visit your AuraMind settings.
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
          from: `AuraMind Reminders <${fromEmail}>`,
          to: [recipientEmail],
          subject: `Review Due: ${cardsDue} cards in ${deckTitle}`,
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
      const resendMessage = data?.message || 'Failed to send reminder email.';
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
