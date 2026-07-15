import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const json = (res: VercelResponse, status: number, body: Record<string, unknown>) => {
  res.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
};

// Initialize Resend for email notifications
const resend = new Resend(process.env.RESEND_API_KEY);

// Email templates
const sendPaymentSuccessEmail = async (email: string, name: string, amount: string, plan: string, nextBilling: string) => {
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@mail.auramind.app',
      to: email,
      subject: 'Payment successful - Your AuraMind subscription is active',
      html: `
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
              <h2>✅ Payment successful</h2>
            </div>
            <p>Hi ${name},</p>
            <p>Great news! Your payment went through successfully.</p>
            <p><strong>Payment details:</strong></p>
            <ul>
              <li>Amount: ${amount}</li>
              <li>Plan: ${plan}</li>
              <li>Next billing date: ${nextBilling}</li>
            </ul>
            <p><strong>Your subscription is now active.</strong> You can start using all premium features right away.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://auramind.app'}/dashboard" style="color: #000; font-weight: bold;">Go to Dashboard →</a>
            <p>Thanks for being a valued member of AuraMind!</p>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} AuraMind. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  } catch (error) {
    console.error('Failed to send payment success email:', error);
  }
};

const sendPaymentFailedEmail = async (email: string, name: string, amount: string, lastAttempt: string) => {
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@mail.auramind.app',
      to: email,
      subject: 'Payment failed - Please update your payment method',
      html: `
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
              <h2>❌ Payment failed</h2>
            </div>
            <p>Hi ${name},</p>
            <p>We couldn't process your payment of ${amount} on ${lastAttempt}.</p>
            <p><strong>Why this might have happened:</strong></p>
            <ul>
              <li>Not enough money in your account</li>
              <li>Your card has expired</li>
              <li>Your bank declined the transaction</li>
            </ul>
            <p><strong>What you need to do:</strong></p>
            <p>Update your payment method to keep your subscription active. If you don't, you'll lose access to premium features.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://auramind.app'}/subscribe" class="button">Update Payment Method</a>
            <p><strong>Need help?</strong> Reply to this email and we'll assist you.</p>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} AuraMind. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  } catch (error) {
    console.error('Failed to send payment failed email:', error);
  }
};

const sendSubscriptionCancelledEmail = async (email: string, name: string, plan: string, effectiveDate: string) => {
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@mail.auramind.app',
      to: email,
      subject: 'Your AuraMind subscription has been cancelled',
      html: `
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
              <h2>📋 Subscription cancelled</h2>
            </div>
            <p>Hi ${name},</p>
            <p>Your ${plan} subscription has been cancelled.</p>
            <p><strong>What this means:</strong></p>
            <p>You'll still have access to all features until ${effectiveDate}. After that date, your account will switch to the free plan.</p>
            <p><strong>Want to keep your subscription?</strong></p>
            <p>You can reactivate it anytime before or after the cancellation date.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://auramind.app'}/subscribe" class="button">Reactivate Subscription</a>
            <p>Thanks for trying AuraMind. We hope to see you again!</p>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} AuraMind. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  } catch (error) {
    console.error('Failed to send subscription cancelled email:', error);
  }
};

const getInvoiceSubscriptionId = (invoice: Stripe.Invoice): string | null => {
  const subscription = (invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
  }).subscription;

  if (!subscription) {
    return null;
  }

  return typeof subscription === 'string' ? subscription : subscription.id;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeSecret || !supabaseUrl || !supabaseServiceKey) {
    return json(res, 500, { error: 'Server configuration missing.' });
  }

  const stripe = new Stripe(stripeSecret);
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let event: Stripe.Event;

  // Verify webhook signature if secret is configured
  if (webhookSecret) {
    const sig = req.headers['stripe-signature'] as string;
    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return json(res, 400, { error: 'Webhook signature verification failed.' });
    }
  } else {
    // In dev/test, accept events without signature verification
    event = req.body as Stripe.Event;
  }

  const relevantEvents = [
    'checkout.session.completed',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'customer.subscription.trial_will_end',
    'invoice.payment_succeeded',
    'invoice.payment_failed',
  ];

  if (!relevantEvents.includes(event.type)) {
    return json(res, 200, { received: true, ignored: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const customerEmail = session.customer_details?.email;
        const customerName = session.customer_details?.name || 'User';
        const amount = session.amount_total ? (session.amount_total / 100).toFixed(2) : '0.00';
        const currency = session.currency?.toUpperCase() || 'USD';          if (userId && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          const subscription = sub as any;

          await supabase.auth.admin.updateUserById(userId, {
            user_metadata: {
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: subscription.id,
              subscription_status: subscription.status,
              plan: 'Pro',
              trial_end: subscription.trial_end
                ? new Date(subscription.trial_end * 1000).toISOString()
                : null,
            },
          });

          // Send payment success email
          if (customerEmail) {
            await sendPaymentSuccessEmail(
              customerEmail,
              customerName,
              `${currency} ${amount}`,
              session.metadata?.plan_name || 'Pro Plan',
              subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000).toLocaleDateString()
                : 'N/A'
            );
          }
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;

        if (userId) {
          const plan = subscription.status === 'active' || subscription.status === 'trialing'
            ? 'Pro' : 'Starter';

          await supabase.auth.admin.updateUserById(userId, {
            user_metadata: {
              stripe_subscription_id: subscription.id,
              subscription_status: subscription.status,
              plan,
              trial_end: subscription.trial_end
                ? new Date(subscription.trial_end * 1000).toISOString()
                : null,
            },
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription & Record<string, any>;
        const userId = subscription.metadata?.supabase_user_id;

        if (userId) {
          await supabase.auth.admin.updateUserById(userId, {
            user_metadata: {
              subscription_status: 'canceled',
              plan: 'Starter',
              trial_end: null,
            },
          });

          // Get user email for notification
          const { data: user } = await supabase.auth.admin.getUserById(userId);
          if (user?.user?.email) {
            await sendSubscriptionCancelledEmail(
              user.user.email,
              user.user.user_metadata?.full_name || 'User',
              'Pro Plan',
              (subscription as any).current_period_end
                ? new Date((subscription as any).current_period_end * 1000).toLocaleDateString()
                : 'N/A'
            );
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = getInvoiceSubscriptionId(invoice);

        if (subId) {
          const subscription = await stripe.subscriptions.retrieve(subId);
          const userId = subscription.metadata?.supabase_user_id;

          if (userId) {
            await supabase.auth.admin.updateUserById(userId, {
              user_metadata: {
                subscription_status: subscription.status,
                plan: 'Pro',
              },
            });

            // Get user email for notification
            const { data: user } = await supabase.auth.admin.getUserById(userId);
            if (user?.user?.email) {
              const amount = invoice.amount_paid ? (invoice.amount_paid / 100).toFixed(2) : '0.00';
              const currency = invoice.currency?.toUpperCase() || 'USD';
              await sendPaymentSuccessEmail(
                user.user.email,
                user.user.user_metadata?.full_name || 'User',
                `${currency} ${amount}`,
                'Pro Plan',
                invoice.next_payment_attempt
                  ? new Date(invoice.next_payment_attempt * 1000).toLocaleDateString()
                  : 'N/A'
              );
            }
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = getInvoiceSubscriptionId(invoice);

        if (subId) {
          const subscription = await stripe.subscriptions.retrieve(subId);
          const userId = subscription.metadata?.supabase_user_id;

          if (userId) {
            await supabase.auth.admin.updateUserById(userId, {
              user_metadata: {
                subscription_status: 'past_due',
                plan: 'Starter',
              },
            });

            // Get user email for notification
            const { data: user } = await supabase.auth.admin.getUserById(userId);
            if (user?.user?.email) {
              const amount = invoice.amount_due ? (invoice.amount_due / 100).toFixed(2) : '0.00';
              const currency = invoice.currency?.toUpperCase() || 'USD';
              await sendPaymentFailedEmail(
                user.user.email,
                user.user.user_metadata?.full_name || 'User',
                `${currency} ${amount}`,
                new Date(invoice.created * 1000).toLocaleString()
              );
            }
          }
        }
        break;
      }
    }

    return json(res, 200, { received: true });
  } catch (err: any) {
    console.error('Webhook processing error:', err);
    return json(res, 500, { error: err.message || 'Webhook processing failed.' });
  }
}
