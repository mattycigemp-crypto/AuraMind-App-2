import { emailService } from '../email/emailService';
import {  requireSupabase } from '../database/supabase';
import { logger } from '@/lib/logger';

/**
 * Stripe Webhook Service
 * Handles Stripe webhook events and sends appropriate emails
 */

export interface WebhookEvent {
  type: string;
  data: {
    object: any;
  };
}

export const handleStripeWebhook = async (event: WebhookEvent): Promise<{ success: boolean; message: string }> => {
  logger.info('Processing Stripe webhook:', event.type);

  switch (event.type) {
    case 'checkout.session.completed':
      return handleCheckoutCompleted(event);
    case 'invoice.payment_succeeded':
      return handlePaymentSucceeded(event);
    case 'invoice.payment_failed':
      return handlePaymentFailed(event);
    case 'customer.subscription.deleted':
      return handleSubscriptionCancelled(event);
    default:
      logger.debug('Unhandled webhook event:', event.type);
      return { success: true, message: 'Event acknowledged' };
  }
};

async function handleCheckoutCompleted(event: WebhookEvent) {
  const session = event.data.object;
  const customerEmail = session.customer_details?.email;
  const customerName = session.customer_details?.name || 'User';
  const amount = (session.amount_total / 100).toFixed(2);
  const currency = session.currency.toUpperCase();

  if (customerEmail) {
    await emailService.sendPaymentSuccessEmail({
      name: customerName,
      email: customerEmail,
      amount: `${currency} ${amount}`,
      plan: session.metadata?.plan_name || 'Premium Plan',
      nextBilling: new Date(session.subscription_details?.current_period_end * 1000).toLocaleDateString(),
    });
  }

  return { success: true, message: 'Checkout completed email sent' };
}

async function handlePaymentSucceeded(event: WebhookEvent) {
  const invoice = event.data.object;
  const customerEmail = invoice.customer_email;
  const customerName = invoice.customer_name || 'User';
  const amount = (invoice.amount_paid / 100).toFixed(2);
  const currency = invoice.currency.toUpperCase();

  if (customerEmail) {
    await emailService.sendPaymentSuccessEmail({
      name: customerName,
      email: customerEmail,
      amount: `${currency} ${amount}`,
      plan: invoice.subscription_details?.metadata?.plan_name || 'Premium Plan',
      nextBilling: new Date(invoice.next_payment_attempt * 1000).toLocaleDateString(),
    });
  }

  return { success: true, message: 'Payment succeeded email sent' };
}

async function handlePaymentFailed(event: WebhookEvent) {
  const invoice = event.data.object;
  const customerEmail = invoice.customer_email;
  const customerName = invoice.customer_name || 'User';
  const amount = (invoice.amount_due / 100).toFixed(2);
  const currency = invoice.currency.toUpperCase();

  if (customerEmail) {
    await emailService.sendPaymentFailedEmail({
      name: customerName,
      email: customerEmail,
      amount: `${currency} ${amount}`,
      lastAttempt: new Date(invoice.created * 1000).toLocaleString(),
    });
  }

  return { success: true, message: 'Payment failed email sent' };
}

async function handleSubscriptionCancelled(event: WebhookEvent) {
  const subscription = event.data.object;
  
  // Get customer email from Supabase. Use `.maybeSingle()` (returns null on
  // zero rows) rather than `.single()` (throws PGRST116). A subscription
  // cancellation arrived for a customer whose profile row doesn't exist yet
  // — we'd rather skip the email silently than crash the webhook handler.
  const { data: profile } = await requireSupabase()
    .from('profiles')
    .select('email, full_name')
    .eq('stripe_customer_id', subscription.customer)
    .maybeSingle();

  if (profile?.email) {
    await emailService.sendSubscriptionCancelledEmail({
      name: profile.full_name || 'User',
      email: profile.email,
      plan: 'Premium Plan',
      effectiveDate: new Date(subscription.current_period_end * 1000).toLocaleDateString(),
    });
  }

  return { success: true, message: 'Subscription cancelled email sent' };
}



