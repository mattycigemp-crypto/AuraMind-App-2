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
      subject: 'Payment Successful - AuraMind',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333;">Payment Successful</h1>
          <p>Hi ${name},</p>
          <p>Your payment of <strong>${amount}</strong> for the <strong>${plan}</strong> plan was successful.</p>
          <p>Next billing date: ${nextBilling}</p>
          <p>Thank you for being a valued AuraMind member!</p>
          <p style="color: #666; font-size: 12px;">If you didn't make this payment, please contact support immediately.</p>
        </div>
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
      subject: 'Payment Failed - AuraMind',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #e74c3c;">Payment Failed</h1>
          <p>Hi ${name},</p>
          <p>We were unable to process your payment of <strong>${amount}</strong>.</p>
          <p>Last attempt: ${lastAttempt}</p>
          <p>Please update your payment information to avoid service interruption.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://auramind.app'}/settings" style="display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px;">Update Payment Info</a>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">If you believe this is an error, please contact support.</p>
        </div>
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
      subject: 'Subscription Cancelled - AuraMind',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333;">Subscription Cancelled</h1>
          <p>Hi ${name},</p>
          <p>Your <strong>${plan}</strong> subscription has been cancelled.</p>
          <p>Effective date: ${effectiveDate}</p>
          <p>You'll continue to have access until the end of your current billing period.</p>
          <p>We're sorry to see you go! If you change your mind, you can resubscribe anytime.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://auramind.app'}/subscribe" style="display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px;">Resubscribe</a>
          <p style="color: #666; font-size: 12px; margin-top: 20px;">Thank you for trying AuraMind!</p>
        </div>
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
        const currency = session.currency?.toUpperCase() || 'USD';

        if (userId && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

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
        const subscription = event.data.object as Stripe.Subscription;
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
              subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000).toLocaleDateString()
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
