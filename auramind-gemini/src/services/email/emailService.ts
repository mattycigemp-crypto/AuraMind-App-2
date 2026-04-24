/**
 * Email Service
 * Handles all email communications using Resend API
 */

const getEnv = (key: string): string => {
  return (import.meta as any).env?.[key] || (process as any).env?.[key] || '';
};

const RESEND_API_KEY = getEnv('RESEND_API_KEY');
const RESEND_FROM_EMAIL = getEnv('RESEND_FROM_EMAIL') || 'noreply@mail.auramind.app';

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
    console.log('Email sent successfully:', data);
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
          <h1>Welcome to AuraMind</h1>
        </div>
        <div class="content">
          <p>Hi ${options.name},</p>
          <p>Welcome to AuraMind! We're excited to help you master any subject with our AI-powered study tools.</p>
          <p>Here's what you can do:</p>
          <ul>
            <li>✨ Generate flashcards from your notes</li>
            <li>🎯 Study with spaced repetition</li>
            <li>🤖 Get help from our AI study assistant</li>
            <li>📊 Track your learning progress</li>
          </ul>
          <a href="${window.location.origin}/dashboard" class="button">Get Started</a>
          <p>If you have any questions, just reply to this email. We're here to help!</p>
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
    subject: 'Welcome to AuraMind! 🎉',
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
          <h2>🔐 Security Alert: New Sign In</h2>
        </div>
        <p>Hi ${options.name},</p>
        <p>We detected a new sign-in to your AuraMind account:</p>
        <ul>
          <li><strong>Time:</strong> ${options.timestamp}</li>
          ${options.location ? `<li><strong>Location:</strong> ${options.location}</li>` : ''}
          ${options.device ? `<li><strong>Device:</strong> ${options.device}</li>` : ''}
        </ul>
        <p>If this was you, no action is needed. If you didn't sign in, please secure your account immediately.</p>
        <p>Stay safe,<br>The AuraMind Team</p>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} AuraMind. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: options.email,
    subject: 'Security Alert: New Sign In to Your AuraMind Account',
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
          <h2>⚠️ Your Trial is Ending Soon</h2>
        </div>
        <p>Hi ${options.name},</p>
        <p>Your AuraMind free trial will end on <strong>${options.trialEnds}</strong> (${options.daysRemaining} days from now).</p>
        <p>Don't lose access to your AI-powered study tools! Upgrade now to continue:</p>
        <ul>
          <li>✨ Unlimited flashcard generation</li>
          <li>🎯 Advanced spaced repetition algorithms</li>
          <li>🤖 Priority AI support</li>
          <li>📊 Detailed learning analytics</li>
        </ul>
        <a href="${window.location.origin}/settings" class="button">Upgrade Your Account</a>
        <p>If you have any questions, just reply to this email.</p>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} AuraMind. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: options.email,
    subject: `Your AuraMind Trial Ends in ${options.daysRemaining} Days`,
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
          <h2>✅ Payment Successful</h2>
        </div>
        <p>Hi ${options.name},</p>
        <p>Your payment of <strong>${options.amount}</strong> for the <strong>${options.plan}</strong> plan was successful!</p>
        <p>Your subscription is now active. Your next billing date is <strong>${options.nextBilling}</strong>.</p>
        <p>Thank you for choosing AuraMind. Happy studying!</p>
        <a href="${window.location.origin}/dashboard" style="color: #000;">Go to Dashboard →</a>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} AuraMind. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: options.email,
    subject: 'Payment Successful - AuraMind Subscription',
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
          <h2>❌ Payment Failed</h2>
        </div>
        <p>Hi ${options.name},</p>
        <p>We were unable to process your payment of <strong>${options.amount}</strong> on <strong>${options.lastAttempt}</strong>.</p>
        <p>This could be due to:</p>
        <ul>
          <li>Insufficient funds</li>
          <li>Expired card</li>
          <li>Card declined by bank</li>
        </ul>
        <p>Please update your payment method to avoid service interruption.</p>
        <a href="${window.location.origin}/settings" class="button">Update Payment Method</a>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} AuraMind. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: options.email,
    subject: 'Action Required: Payment Failed - AuraMind',
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
          <h2>📋 Subscription Cancelled</h2>
        </div>
        <p>Hi ${options.name},</p>
        <p>Your <strong>${options.plan}</strong> subscription has been cancelled.</p>
        <p>Your access will continue until <strong>${options.effectiveDate}</strong>.</p>
        <p>We're sorry to see you go! If you change your mind, you can resubscribe anytime.</p>
        <a href="${window.location.origin}/settings" class="button">Reactivate Subscription</a>
        <p>Thank you for being part of AuraMind!</p>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} AuraMind. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: options.email,
    subject: 'Subscription Cancelled - AuraMind',
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
          <h2>🔑 Password Reset Request</h2>
        </div>
        <p>Hi ${options.name},</p>
        <p>We received a request to reset your password. Click the button below to reset it:</p>
        <a href="${options.resetLink}" class="button">Reset Password</a>
        <p>This link will expire in <strong>${options.expiresIn}</strong>.</p>
        <p>If you didn't request this change, you can safely ignore this email.</p>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} AuraMind. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: options.email,
    subject: 'Reset Your AuraMind Password',
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
          <h2>✉️ Verify Your Email Address</h2>
        </div>
        <p>Hi ${options.name},</p>
        <p>Please verify your email address to complete your AuraMind account setup:</p>
        <a href="${options.verificationLink}" class="button">Verify Email</a>
        <p>This helps us secure your account and send you important notifications.</p>
        <p>If you didn't create an AuraMind account, you can safely ignore this email.</p>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} AuraMind. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: options.email,
    subject: 'Verify Your Email Address - AuraMind',
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
