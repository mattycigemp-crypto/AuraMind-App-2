import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { applyMiddleware, type MiddlewareContext } from './middleware';
import { loadEnv } from './lib/env';
import { sendSuccess, sendError } from './lib/response';
import { AppError } from './lib/errors';
import { logger } from './lib/logger';

const resend = new Resend(process.env.RESEND_API_KEY);

function sendPaymentSuccessEmail(email: string, name: string, amount: string, plan: string, nextBilling: string) {
  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'noreply@mail.auramind.app',
    to: email,
    subject: 'Payment successful - Your AuraMind subscription is active',
    html: `
      <!DOCTYPE html>
      <html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
      <title>Payment Successful - AuraMind</title>
      <style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333}
      .container{max-width:600px;margin:0 auto;padding:20px}
      .success{background:#d4edda;border-left:4px solid #28a745;padding:15px;margin:20px 0}
      .footer{text-align:center;padding:20px;border-top:1px solid #eee;font-size:12px;color:#666}</style></head>
      <body><div class="container">
      <div class="success"><h2>Payment successful</h2></div>
      <p>Hi ${name},</p><p>Great news! Your payment went through successfully.</p>
      <p><strong>Payment details:</strong></p>
      <ul><li>Amount: ${amount}</li><li>Plan: ${plan}</li><li>Next billing date: ${nextBilling}</li></ul>
      <p><strong>Your subscription is now active.</strong></p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://auramind.app'}/dashboard" style="color:#000;font-weight:bold">Go to Dashboard →</a>
      <p>Thanks for being a valued member of AuraMind!</p>
      <div class="footer">&copy; ${new Date().getFullYear()} AuraMind. All rights reserved.</div>
      </div></body></html>`,
  });
}

function sendPaymentFailedEmail(email: string, name: string, amount: string, lastAttempt: string) {
  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'noreply@mail.auramind.app',
    to: email,
    subject: 'Payment failed - Please update your payment method',
    html: `
      <!DOCTYPE html>
      <html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
      <title>Payment Failed - AuraMind</title>
      <style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333}
      .container{max-width:600px;margin:0 auto;padding:20px}
      .alert{background:#f8d7da;border-left:4px solid #dc3545;padding:15px;margin:20px 0}
      .button{display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:4px;margin:20px 0}
      .footer{text-align:center;padding:20px;border-top:1px solid #eee;font-size:12px;color:#666}</style></head>
      <body><div class="container">
      <div class="alert"><h2>Payment failed</h2></div>
      <p>Hi ${name},</p><p>We couldn't process your payment of ${amount} on ${lastAttempt}.</p>
      <p><strong>Why this might have happened:</strong></p>
      <ul><li>Not enough money in your account</li><li>Your card has expired</li><li>Your bank declined the transaction</li></ul>
      <p><strong>Update your payment method</strong> to keep your subscription active.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://auramind.app'}/subscribe" class="button">Update Payment Method</a>
      <p><strong>Need help?</strong> Reply to this email.</p>
      <div class="footer">&copy; ${new Date().getFullYear()} AuraMind. All rights reserved.</div>
      </div></body></html>`,
  });
}

function sendCancelledEmail(email: string, name: string, plan: string, effectiveDate: string) {
  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'noreply@mail.auramind.app',
    to: email,
    subject: 'Your AuraMind subscription has been cancelled',
    html: `
      <!DOCTYPE html>
      <html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
      <title>Subscription Cancelled - AuraMind</title>
      <style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333}
      .container{max-width:600px;margin:0 auto;padding:20px}
      .info{background:#e2e3e5;border-left:4px solid #6c757d;padding:15px;margin:20px 0}
      .button{display:inline-block;padding:12px 24px;background:#000;color:#fff;text-decoration:none;border-radius:4px;margin:20px 0}
      .footer{text-align:center;padding:20px;border-top:1px solid #eee;font-size:12px;color:#666}</style></head>
      <body><div class="container">
      <div class="info"><h2>Subscription cancelled</h2></div>
      <p>Hi ${name},</p><p>Your ${plan} subscription has been cancelled.</p>
      <p>You'll still have access to all features until ${effectiveDate}.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://auramind.app'}/subscribe" class="button">Reactivate Subscription</a>
      <p>Thanks for trying AuraMind. We hope to see you again!</p>
      <div class="footer">&copy; ${new Date().getFullYear()} AuraMind. All rights reserved.</div>
      </div></body></html>`,
  });
}

async function createStripeClient() {
  const Stripe = (await import('stripe')).default;
  return new Stripe(process.env.STRIPE_SECRET_KEY || '');
}

async function handler(req: VercelRequest, res: VercelResponse, ctx: MiddlewareContext) {
  if (req.method !== 'POST') {
    return sendError(res, 405, 'Method not allowed');
  }

  const env = loadEnv();
  const stripe = await createStripeClient();

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let event: Stripe.Event;

  if (env.STRIPE_WEBHOOK_SECRET) {
    const sig = req.headers['stripe-signature'] as string;
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      logger.warn('Webhook signature verification failed', { requestId: ctx.requestId, message: err.message });
      return sendError(res, 400, 'Webhook signature verification failed');
    }
  } else {
    event = req.body as Stripe.Event;
  }

  const relevantEvents = new Set([
    'checkout.session.completed',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'customer.subscription.trial_will_end',
    'invoice.payment_succeeded',
    'invoice.payment_failed',
  ]);

  if (!relevantEvents.has(event.type)) {
    return sendSuccess(res, { received: true, ignored: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const customerEmail = session.customer_details?.email;
        const customerName = session.customer_details?.name || 'User';
        const amount = session.amount_total ? (session.amount_total / 100).toFixed(2) : '0.00';
        const currency = session.currency?.toUpperCase() || 'USD';

        if (userId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          await supabase.auth.admin.updateUserById(userId, {
            user_metadata: {
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: subscription.id,
              subscription_status: subscription.status,
              plan: 'Pro',
              trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            },
          });
          if (customerEmail) {
            sendPaymentSuccessEmail(customerEmail, customerName, `${currency} ${amount}`, 'Pro Plan',
              subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toLocaleDateString() : 'N/A')
              .catch((err) => logger.error('Failed to send payment success email', { error: err.message }));
          }
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;
        if (userId) {
          const plan = subscription.status === 'active' || subscription.status === 'trialing' ? 'Pro' : 'Starter';
          await supabase.auth.admin.updateUserById(userId, {
            user_metadata: {
              stripe_subscription_id: subscription.id,
              subscription_status: subscription.status,
              plan,
              trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            },
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;
        if (userId) {
          await supabase.auth.admin.updateUserById(userId, {
            user_metadata: { subscription_status: 'canceled', plan: 'Starter', trial_end: null },
          });
          const { data: user } = await supabase.auth.admin.getUserById(userId);
          if (user?.user?.email) {
            sendCancelledEmail(user.user.email, user.user.user_metadata?.full_name || 'User', 'Pro Plan',
              subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toLocaleDateString() : 'N/A')
              .catch((err) => logger.error('Failed to send cancelled email', { error: err.message }));
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = invoice.subscription;
        if (subId) {
          const subscription = await stripe.subscriptions.retrieve(subId as string);
          const userId = subscription.metadata?.supabase_user_id;
          if (userId) {
            await supabase.auth.admin.updateUserById(userId, {
              user_metadata: { subscription_status: subscription.status, plan: 'Pro' },
            });
            const { data: user } = await supabase.auth.admin.getUserById(userId);
            if (user?.user?.email) {
              const amount = invoice.amount_paid ? (invoice.amount_paid / 100).toFixed(2) : '0.00';
              sendPaymentSuccessEmail(user.user.email, user.user.user_metadata?.full_name || 'User',
                `${invoice.currency?.toUpperCase() || 'USD'} ${amount}`, 'Pro Plan',
                invoice.next_payment_attempt ? new Date(invoice.next_payment_attempt * 1000).toLocaleDateString() : 'N/A')
                .catch((err) => logger.error('Failed to send payment success email', { error: err.message }));
            }
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = invoice.subscription;
        if (subId) {
          const subscription = await stripe.subscriptions.retrieve(subId as string);
          const userId = subscription.metadata?.supabase_user_id;
          if (userId) {
            await supabase.auth.admin.updateUserById(userId, {
              user_metadata: { subscription_status: 'past_due', plan: 'Starter' },
            });
            const { data: user } = await supabase.auth.admin.getUserById(userId);
            if (user?.user?.email) {
              const amount = invoice.amount_due ? (invoice.amount_due / 100).toFixed(2) : '0.00';
              sendPaymentFailedEmail(user.user.email, user.user.user_metadata?.full_name || 'User',
                `${invoice.currency?.toUpperCase() || 'USD'} ${amount}`,
                new Date(invoice.created * 1000).toLocaleString())
                .catch((err) => logger.error('Failed to send payment failed email', { error: err.message }));
            }
          }
        }
        break;
      }
    }

    return sendSuccess(res, { received: true });
  } catch (err: any) {
    logger.error('Webhook processing error', {
      requestId: ctx.requestId,
      eventType: event.type,
      message: err.message,
    });
    if (err instanceof AppError) throw err;
    throw new AppError(err.message || 'Webhook processing failed', 500, 'WEBHOOK_ERROR');
  }
}

export default async function (req: VercelRequest, res: VercelResponse) {
  const ctx = applyMiddleware(req, res);
  const start = Date.now();

  try {
    await handler(req, res, ctx);
  } catch (err: unknown) {
    const duration = Date.now() - start;
    if (err instanceof AppError) {
      return sendError(res, err.status, err.message, err.code);
    }
    const error = err as Error;
    logger.error('Unhandled webhook error', { message: error.message, stack: error.stack, duration });
    return sendError(res, 500, 'Internal server error');
  }
}
