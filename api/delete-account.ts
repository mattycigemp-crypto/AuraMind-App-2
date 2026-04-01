import type { VercelRequest, VercelResponse } from '@vercel/node';

type DeleteAccountPayload = {
  email?: string;
  reasons?: string[];
  otherReason?: string;
};

type ResendErrorPayload = {
  message?: string;
  error?: unknown;
};

const json = (res: VercelResponse, status: number, body: Record<string, unknown>) => {
  res.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  const { email, reasons, otherReason } = (req.body || {}) as DeleteAccountPayload;
  const trimmedEmail = (email || '').trim();
  const reasonList = Array.isArray(reasons) ? reasons.filter(Boolean) : [];

  if (!trimmedEmail || reasonList.length === 0) {
    return json(res, 400, { error: 'Email and at least one reason are required.' });
  }

  if (reasonList.includes('Other') && !otherReason?.trim()) {
    return json(res, 400, { error: 'Please provide the other reason.' });
  }

  const apiKey = process.env.RESEND_API_KEY || process.env.RESEND_API_KEY2;
  const fromEmail = (process.env.RESEND_FROM_EMAIL || '').trim().toLowerCase();
  const adminEmail = process.env.RESEND_ADMIN_EMAIL;
  const allowedSenderDomain = '@mail.auramind.app';

  if (!apiKey) {
    return json(res, 500, { error: 'Missing RESEND_API_KEY (or RESEND_API_KEY2).' });
  }

  if (!fromEmail) {
    return json(res, 500, { error: 'Missing RESEND_FROM_EMAIL.' });
  }

  if (!fromEmail.endsWith(allowedSenderDomain)) {
    return json(res, 500, { error: `RESEND_FROM_EMAIL must end with ${allowedSenderDomain}.` });
  }

  const reasonText = reasonList
    .map((reason) => (reason === 'Other' && otherReason ? `Other: ${otherReason}` : reason))
    .join(', ');

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111;">
      <h2>Account Deletion Request</h2>
      <p>We received a request to delete your AuraMind account.</p>
      <p><strong>Reasons:</strong> ${reasonText}</p>
      <p>If this was not you, please ignore this email. If you confirm, reply to this message or contact support to proceed.</p>
    </div>
  `;

  const payload = {
    from: `AuraMind <${fromEmail}>`,
    to: [trimmedEmail],
    subject: 'Confirm your AuraMind account deletion',
    html,
  };

  const sendViaResend = async (body: Record<string, unknown>) => {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const raw = await response.text();
      let parsed: ResendErrorPayload = {};
      try {
        parsed = raw ? JSON.parse(raw) : {};
      } catch {
        parsed = { message: raw };
      }

      if (!response.ok) {
        const resendMessage = parsed?.message || `Resend request failed (${response.status}).`;
        const hint = resendMessage.includes('testing emails')
          ? 'Resend is treating this as sandbox mode. Use an API key from the same Resend workspace where mail.auramind.app is verified, and set RESEND_FROM_EMAIL to an address on that domain.'
          : undefined;
        return { ok: false as const, status: response.status, error: resendMessage, hint };
      }

      return { ok: true as const };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown network error';
      return { ok: false as const, status: 502, error: `Network error calling Resend: ${message}` };
    }
  };

  const primarySend = await sendViaResend(payload);
  if (!primarySend.ok) {
    return json(res, primarySend.status, { error: primarySend.error, hint: primarySend.hint });
  }

  if (adminEmail) {
    const adminSend = await sendViaResend({
      from: `AuraMind <${fromEmail}>`,
      to: [adminEmail],
      subject: 'New deletion request',
      html: `
        <div style="font-family: Arial, sans-serif; color: #111;">
          <h2>Deletion Request Received</h2>
          <p><strong>User email:</strong> ${trimmedEmail}</p>
          <p><strong>Reasons:</strong> ${reasonText}</p>
        </div>
      `,
    });

    if (!adminSend.ok) {
      return json(res, adminSend.status, { error: adminSend.error, hint: adminSend.hint });
    }
  }

  return json(res, 200, { ok: true });
}
