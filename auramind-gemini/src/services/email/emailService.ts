/**
 * Email Service (client)
 *
 * Transactional emails are sent through the serverless API (`/api/email`).
 * The Resend API key lives server-side only — never read it from a VITE_*
 * variable, because Vite inlines those into the public bundle.
 *
 * The endpoint requires a signed-in session and only allows sending to the
 * caller's own address, so this is safe to call from anywhere in the app.
 */
import { requireSupabase } from '../database/supabase';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, '') ?? '';

type EmailType =
  | 'welcome'
  | 'signInAlert'
  | 'trialEnding'
  | 'paymentSuccess'
  | 'paymentFailed'
  | 'subscriptionCancelled'
  | 'passwordReset'
  | 'emailVerification';

interface EmailSendResult {
  success: boolean;
  error?: string;
}

async function sendEmail(type: EmailType, to: string, params: Record<string, unknown>): Promise<EmailSendResult> {
  try {
    const { data } = await requireSupabase().auth.getSession();
    const token = data.session?.access_token;
    if (!token) return { success: false, error: 'Not signed in' };

    const response = await fetch(`${API_BASE}/api/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        type,
        to,
        origin: typeof window !== 'undefined' ? window.location.origin : undefined,
        ...params,
      }),
    });

    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      return { success: false, error: body?.error ?? `Email request failed (${response.status})` };
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

interface WelcomeEmailOptions {
  name: string;
  email: string;
}

interface SignInAlertOptions {
  name: string;
  email: string;
  timestamp: string;
  location?: string;
  device?: string;
}

interface TrialEndingOptions {
  name: string;
  email: string;
  trialEnds: string;
  daysRemaining: number;
}

interface PaymentSuccessOptions {
  name: string;
  email: string;
  amount: string;
  plan: string;
  nextBilling: string;
}

interface PaymentFailedOptions {
  name: string;
  email: string;
  amount: string;
  lastAttempt: string;
}

interface SubscriptionCancelledOptions {
  name: string;
  email: string;
  plan: string;
  effectiveDate: string;
}

interface PasswordResetOptions {
  name: string;
  email: string;
  resetLink: string;
  expiresIn: string;
}

interface EmailVerificationOptions {
  name: string;
  email: string;
  verificationLink: string;
}

export const sendWelcomeEmail = (options: WelcomeEmailOptions): Promise<EmailSendResult> =>
  sendEmail('welcome', options.email, { name: options.name });

export const sendSignInAlert = (options: SignInAlertOptions): Promise<EmailSendResult> =>
  sendEmail('signInAlert', options.email, {
    name: options.name,
    timestamp: options.timestamp,
    location: options.location,
    device: options.device,
  });

export const sendTrialEndingEmail = (options: TrialEndingOptions): Promise<EmailSendResult> =>
  sendEmail('trialEnding', options.email, {
    name: options.name,
    trialEnds: options.trialEnds,
    daysRemaining: options.daysRemaining,
  });

export const sendPaymentSuccessEmail = (options: PaymentSuccessOptions): Promise<EmailSendResult> =>
  sendEmail('paymentSuccess', options.email, {
    name: options.name,
    amount: options.amount,
    plan: options.plan,
    nextBilling: options.nextBilling,
  });

export const sendPaymentFailedEmail = (options: PaymentFailedOptions): Promise<EmailSendResult> =>
  sendEmail('paymentFailed', options.email, {
    name: options.name,
    amount: options.amount,
    lastAttempt: options.lastAttempt,
  });

export const sendSubscriptionCancelledEmail = (options: SubscriptionCancelledOptions): Promise<EmailSendResult> =>
  sendEmail('subscriptionCancelled', options.email, {
    name: options.name,
    plan: options.plan,
    effectiveDate: options.effectiveDate,
  });

export const sendPasswordResetEmail = (options: PasswordResetOptions): Promise<EmailSendResult> =>
  sendEmail('passwordReset', options.email, {
    name: options.name,
    resetLink: options.resetLink,
    expiresIn: options.expiresIn,
  });

export const sendEmailVerificationEmail = (options: EmailVerificationOptions): Promise<EmailSendResult> =>
  sendEmail('emailVerification', options.email, {
    name: options.name,
    verificationLink: options.verificationLink,
  });

export const emailService = {
  sendWelcomeEmail,
  sendSignInAlert,
  sendTrialEndingEmail,
  sendPaymentSuccessEmail,
  sendPaymentFailedEmail,
  sendSubscriptionCancelledEmail,
  sendPasswordResetEmail,
  sendEmailVerificationEmail,
};
