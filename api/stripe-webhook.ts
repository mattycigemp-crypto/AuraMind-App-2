import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const json = (res: VercelResponse, status: number, body: Record<string, unknown>) => {
  res.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
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
