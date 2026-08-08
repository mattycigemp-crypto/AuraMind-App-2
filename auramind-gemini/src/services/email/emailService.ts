/**
 * Email Service
 * Handles all email communications using Resend API
 */

const getEnv = (key: string): string => {
  try {
    return (import.meta as any).env?.[key] || '';
  } catch {
    return '';
  }
};

const RESEND_API_KEY = getEnv('VITE_RESEND_API_KEY');
const RESEND_FROM_EMAIL = getEnv('VITE_RESEND_FROM_EMAIL') || 'noreply@mail.auramind.app';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
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

/**
 * Send email using Resend API
 */
async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ''),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Email send failed:', error);
      return { success: false, error: `Failed to send email: ${error}` };
    }

    const data = await response.json();
    // Email sent successfully
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Welcome email for new users
 */
export const sendWelcomeEmail = async (options: WelcomeEmailOptions): Promise<{ success: boolean; error?: string }> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to AuraMind</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 40px 0; border-bottom: 1px solid #eee; }
        .content { padding: 40px 0; }
        .button { display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to AuraMind!</h1>
        </div>
        <div class="content">
          <p>Hi ${options.name},</p>
          <p>Thanks for signing up! Your account is ready to go.</p>
          <p><strong>Here's how to get started:</strong></p>
          <ol>
            <li>Click the button below to go to your dashboard</li>
            <li>Create your first deck of flashcards</li>
            <li>Start studying with our smart review system</li>
          </ol>
          <p><strong>What makes AuraMind different:</strong></p>
          <ul>
            <li><strong>AI-powered:</strong> Turn any text into flashcards instantly</li>
            <li><strong>Smart review:</strong> We show you cards at the right time</li>
            <li><strong>Track progress:</strong> See how much you've learned</li>
          </ul>
          <a href="${window.location.origin}/dashboard" class="button">Go to Dashboard</a>
          <p><strong>Need help?</strong> Just reply to this email and we'll assist you.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} AuraMind. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: options.email,
    subject: 'Welcome to AuraMind! Your account is ready',
    html,
  });
};

/**
 * New sign-in security alert
 */
export const sendSignInAlert = async (options: SignInAlertOptions): Promise<{ success: boolean; error?: string }> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Sign In to AuraMind</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="alert">
          <h2>New sign-in detected</h2>
        </div>
        <p>Hi ${options.name},</p>
        <p>Someone just signed into your AuraMind account. Here are the details:</p>
        <ul>
          <li><strong>When:</strong> ${options.timestamp}</li>
          ${options.location ? `<li><strong>Where:</strong> ${options.location}</li>` : ''}
          ${options.device ? `<li><strong>Device:</strong> ${options.device}</li>` : ''}
        </ul>
        <p><strong>Was this you?</strong></p>
        <p>If yes, you can ignore this email. Your account is secure.</p>
        <p><strong>If this wasn't you:</strong></p>
        <p>Someone else has access to your account. Please change your password immediately to protect your data.</p>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} AuraMind. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: options.email,
    subject: 'New sign-in to your AuraMind account',
    html,
  });
};

/**
 * Trial ending reminder
 */
export const sendTrialEndingEmail = async (options: TrialEndingOptions): Promise<{ success: boolean; error?: string }> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your AuraMind Trial is Ending</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="alert">
          <h2>Your free trial is ending soon</h2>
        </div>
        <p>Hi ${options.name},</p>
        <p>Your free trial ends in <strong>${options.daysRemaining} days</strong> on ${options.trialEnds}.</p>
        <p><strong>What happens when your trial ends:</strong></p>
        <p>You'll lose access to premium features like unlimited flashcard generation and advanced study tools.</p>
        <p><strong>Keep your access:</strong></p>
        <p>Upgrade to a paid plan to continue using all features without interruption.</p>
        <a href="${window.location.origin}/subscribe" class="button">Upgrade Now</a>
        <p><strong>Questions?</strong> Reply to this email and we'll help you out.</p>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} AuraMind. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: options.email,
    subject: `Your free trial ends in ${options.daysRemaining} days`,
    html,
  });
};

/**
 * Payment successful email
 */
export const sendPaymentSuccessEmail = async (options: PaymentSuccessOptions): Promise<{ success: boolean; error?: string }> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Successful - AuraMind</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .success { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="success">
          <h2>Payment successful</h2>
        </div>
        <p>Hi ${options.name},</p>
        <p>Great news! Your payment went through successfully.</p>
        <p><strong>Payment details:</strong></p>
        <ul>
          <li>Amount: ${options.amount}</li>
          <li>Plan: ${options.plan}</li>
          <li>Next billing date: ${options.nextBilling}</li>
        </ul>
        <p><strong>Your subscription is now active.</strong> You can start using all premium features right away.</p>
        <a href="${window.location.origin}/dashboard" style="color: #000; font-weight: bold;">Go to Dashboard →</a>
        <p>Thanks for being a valued member of AuraMind!</p>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} AuraMind. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: options.email,
    subject: 'Payment successful - Your AuraMind subscription is active',
    html,
  });
};

/**
 * Payment failed email
 */
export const sendPaymentFailedEmail = async (options: PaymentFailedOptions): Promise<{ success: boolean; error?: string }> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Payment Failed - AuraMind</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .alert { background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="alert">
          <h2>Payment failed</h2>
        </div>
        <p>Hi ${options.name},</p>
        <p>We couldn't process your payment of ${options.amount} on ${options.lastAttempt}.</p>
        <p><strong>Why this might have happened:</strong></p>
        <ul>
          <li>Not enough money in your account</li>
          <li>Your card has expired</li>
          <li>Your bank declined the transaction</li>
        </ul>
        <p><strong>What you need to do:</strong></p>
        <p>Update your payment method to keep your subscription active. If you don't, you'll lose access to premium features.</p>
        <a href="${window.location.origin}/subscribe" class="button">Update Payment Method</a>
        <p><strong>Need help?</strong> Reply to this email and we'll assist you.</p>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} AuraMind. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: options.email,
    subject: 'Payment failed - Please update your payment method',
    html,
  });
};

/**
 * Subscription cancelled email
 */
export const sendSubscriptionCancelledEmail = async (options: SubscriptionCancelledOptions): Promise<{ success: boolean; error?: string }> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Subscription Cancelled - AuraMind</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .info { background: #e2e3e5; border-left: 4px solid #6c757d; padding: 15px; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="info">
          <h2>Subscription cancelled</h2>
        </div>
        <p>Hi ${options.name},</p>
        <p>Your ${options.plan} subscription has been cancelled.</p>
        <p><strong>What this means:</strong></p>
        <p>You'll still have access to all features until ${options.effectiveDate}. After that date, your account will switch to the free plan.</p>
        <p><strong>Want to keep your subscription?</strong></p>
        <p>You can reactivate it anytime before or after the cancellation date.</p>
        <a href="${window.location.origin}/subscribe" class="button">Reactivate Subscription</a>
        <p>Thanks for trying AuraMind. We hope to see you again!</p>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} AuraMind. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: options.email,
    subject: 'Your AuraMind subscription has been cancelled',
    html,
  });
};

/**
 * Password reset email
 */
export const sendPasswordResetEmail = async (options: PasswordResetOptions): Promise<{ success: boolean; error?: string }> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password - AuraMind</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="alert">
          <h2>Reset your password</h2>
        </div>
        <p>Hi ${options.name},</p>
        <p>We received a request to reset your password for your AuraMind account.</p>
        <p><strong>To reset your password:</strong></p>
        <p>Click the button below. This will take you to a page where you can create a new password.</p>
        <a href="${options.resetLink}" class="button">Reset Password</a>
        <p><strong>Important:</strong> This link expires in ${options.expiresIn}. After that, you'll need to request a new password reset.</p>
        <p><strong>Didn't request this?</strong></p>
        <p>If you didn't ask to reset your password, you can safely ignore this email. Your account is still secure.</p>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} AuraMind. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: options.email,
    subject: 'Reset your AuraMind password',
    html,
  });
};

/**
 * Email verification email
 */
export const sendEmailVerificationEmail = async (options: EmailVerificationOptions): Promise<{ success: boolean; error?: string }> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - AuraMind</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .alert { background: #d1ecf1; border-left: 4px solid #17a2b8; padding: 15px; margin: 20px 0; }
        .button { display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 4px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="alert">
          <h2>Verify your email address</h2>
        </div>
        <p>Hi ${options.name},</p>
        <p>Please verify your email to complete your AuraMind account setup.</p>
        <p><strong>Why verify your email?</strong></p>
        <p>Verifying your email helps us:</p>
        <ul>
          <li>Keep your account secure</li>
          <li>Send you important updates about your account</li>
          <li>Recover your account if you forget your password</li>
        </ul>
        <p><strong>To verify your email:</strong></p>
        <p>Click the button below. It only takes a second.</p>
        <a href="${options.verificationLink}" class="button">Verify Email</a>
        <p><strong>Didn't create an account?</strong></p>
        <p>If you didn't sign up for AuraMind, you can safely ignore this email.</p>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} AuraMind. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: options.email,
    subject: 'Verify your email address',
    html,
  });
};

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



