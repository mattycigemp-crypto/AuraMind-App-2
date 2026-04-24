# Email Implementation Guide for AuraMind

This guide provides step-by-step instructions to complete the email system implementation.

## Table of Contents
1. [Payment Webhook Integration](#payment-webhook-integration)
2. [Trial Tracking System](#trial-tracking-system)
3. [Email Verification Integration](#email-verification-integration)
4. [Testing Email Service](#testing-email-service)

---

## 1. Payment Webhook Integration

### Step 1: Create Stripe Webhook Handler

Create a new file: `auramind-gemini/src/services/stripe/stripeWebhookService.ts`

```typescript
import { emailService } from '../email/emailService';
import { supabase } from '../database/supabase';

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
  console.log('Processing Stripe webhook:', event.type);

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
      console.log('Unhandled webhook event:', event.type);
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
  
  // Get customer email from Supabase
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('stripe_customer_id', subscription.customer)
    .single();

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
```

### Step 2: Create API Route for Webhooks

Create a new file: `auramind-gemini/src/api/stripe-webhook/route.ts` (if using Next.js) or add to your existing API structure.

For a Vite/React app, you'll need a backend. Here are two options:

**Option A: Use Vercel Serverless Functions (Recommended)**

Create `api/stripe-webhook.ts`:
```typescript
import { headers } from 'next/headers';
import { handleStripeWebhook } from '../../services/stripe/stripeWebhookService';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return new Response('Webhook signature verification failed', { status: 400 });
  }

  const result = await handleStripeWebhook(event as any);
  
  return Response.json({ success: result.success, message: result.message });
}
```

**Option B: Use Supabase Edge Functions**

Create `supabase/functions/stripe-webhook/index.ts`:
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleStripeWebhook } from '../services/stripe/stripeWebhookService'
import Stripe from 'https://esm.sh/stripe@12.18.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-06-20',
})

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    )
  } catch (err) {
    return new Response('Webhook signature verification failed', { status: 400 })
  }

  const result = await handleStripeWebhook(event as any)
  
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  })
})
```

### Step 3: Configure Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Set endpoint URL:
   - If using Vercel: `https://your-domain.vercel.app/api/stripe-webhook`
   - If using Supabase: `https://your-project.supabase.co/functions/v1/stripe-webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
5. Copy the webhook signing secret
6. Add to your environment variables:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

### Step 4: Update Database Schema

Add `stripe_customer_id` to your profiles table if not already present:

```sql
ALTER TABLE profiles 
ADD COLUMN stripe_customer_id TEXT UNIQUE;
```

---

## 2. Trial Tracking System

### Step 1: Create Trial Tracking Service

Create: `auramind-gemini/src/services/trial/trialService.ts`

```typescript
import { emailService } from '../email/emailService';
import { supabase } from '../database/supabase';

/**
 * Trial Tracking Service
 * Monitors trial periods and sends reminder emails
 */

export interface TrialUser {
  id: string;
  email: string;
  full_name: string;
  trial_start: string;
  trial_end: string;
}

export const trialService = {
  /**
   * Get all users with active trials
   */
  getActiveTrialUsers: async (): Promise<TrialUser[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, trial_start, trial_end')
      .gte('trial_end', new Date().toISOString())
      .order('trial_end', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Check and send trial ending reminders
   * Should be called daily by a cron job
   */
  checkTrialReminders: async () => {
    const users = await trialService.getActiveTrialUsers();
    const now = new Date();
    const reminders = [7, 3, 1]; // Days before trial ends to send reminder

    for (const user of users) {
      const trialEnd = new Date(user.trial_end);
      const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (reminders.includes(daysRemaining)) {
        await emailService.sendTrialEndingEmail({
          name: user.full_name || 'User',
          email: user.email,
          trialEnds: trialEnd.toLocaleDateString(),
          daysRemaining,
        });
        console.log(`Sent trial reminder to ${user.email} (${daysRemaining} days remaining)`);
      }
    }
  },

  /**
   * Start a trial for a new user
   */
  startTrial: async (userId: string): Promise<void> => {
    const trialStart = new Date();
    const trialEnd = new Date(trialStart.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days

    const { error } = await supabase
      .from('profiles')
      .update({
        trial_start: trialStart.toISOString(),
        trial_end: trialEnd.toISOString(),
      })
      .eq('id', userId);

    if (error) throw error;
  },

  /**
   * Check if trial has ended
   */
  isTrialEnded: async (userId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('trial_end')
      .eq('id', userId)
      .single();

    if (error) throw error;
    if (!data?.trial_end) return true;

    return new Date(data.trial_end) < new Date();
  },
};
```

### Step 2: Update Database Schema

Add trial tracking columns to profiles table:

```sql
ALTER TABLE profiles 
ADD COLUMN trial_start TIMESTAMPTZ,
ADD COLUMN trial_end TIMESTAMPTZ;
```

### Step 3: Set Up Cron Job

**Option A: Using Vercel Cron Jobs**

Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/trial-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

Create `api/cron/trial-reminders/route.ts`:
```typescript
import { trialService } from '../../services/trial/trialService';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await trialService.checkTrialReminders();
    return NextResponse.json({ success: true, message: 'Trial reminders sent' });
  } catch (error) {
    console.error('Trial reminder cron job failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to send reminders' }, { status: 500 });
  }
}
```

**Option B: Using Supabase pg_cron**

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to call your edge function
CREATE OR REPLACE FUNCTION send_trial_reminders()
RETURNS void AS $$
BEGIN
  -- This would call your edge function
  -- For now, you'll need to set this up via edge functions
  NULL;
END;
$$ LANGUAGE plpgsql;

-- Schedule it to run daily at 9 AM UTC
SELECT cron.schedule(
  'trial-reminders',
  '0 9 * * *',
  'SELECT send_trial_reminders()'
);
```

**Option C: Using GitHub Actions (Easiest for testing)**

Create `.github/workflows/trial-reminders.yml`:
```yaml
name: Trial Reminders
on:
  schedule:
    - cron: '0 9 * * *'  # Runs daily at 9 AM UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Call API
        run: |
          curl -X POST https://your-domain.vercel.app/api/cron/trial-reminders \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

### Step 4: Start Trial on Signup

Update AuthPage.tsx to start trial on signup:

```typescript
// In handleAuth, after successful signup:
if (data?.user) {
  await trialService.startTrial(data.user.id);
  await emailService.sendWelcomeEmail({
    name: fullName || 'User',
    email,
  });
}
```

---

## 3. Email Verification Integration

### Step 1: Enable Email Verification in Supabase

1. Go to Supabase Dashboard → Authentication → Providers
2. Click on "Email" provider
3. Enable "Confirm email"
4. Set "Email Confirmation URL" to: `${window.location.origin}/auth/callback`
5. Save changes

### Step 2: Create Email Verification Handler

Create: `auramind-gemini/src/services/auth/emailVerificationService.ts`

```typescript
import { emailService } from '../email/emailService';
import { supabase } from '../database/supabase';

export const emailVerificationService = {
  /**
   * Send verification email to user
   */
  sendVerificationEmail: async (email: string, name?: string) => {
    const { data, error } = await supabase.auth.resend({
      email,
      type: 'signup',
    });

    if (error) throw error;

    // Also send our custom verification email
    await emailService.sendEmailVerificationEmail({
      name: name || 'User',
      email,
      verificationLink: `${window.location.origin}/auth/callback?email=${email}`,
    });

    return data;
  },

  /**
   * Check if email is verified
   */
  isEmailVerified: async (): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.email_confirmed_at != null;
  },
};
```

### Step 3: Add Verification UI to AuthPage

Add a "Resend Verification Email" button in the verification screen:

```typescript
const handleResendVerification = async () => {
  setLoading(true);
  try {
    await emailVerificationService.sendVerificationEmail(email, fullName);
    alert('Verification email sent! Check your inbox.');
  } catch (err: any) {
    alert(err.message || 'Failed to send verification email.');
  } finally {
    setLoading(false);
  }
};

// In the JSX, add:
{verificationSent && (
  <button
    onClick={handleResendVerification}
    disabled={loading}
    className="text-[10px] uppercase font-black tracking-widest text-arch-muted hover:text-arch-fg transition-colors"
  >
    Resend Verification Email
  </button>
)}
```

### Step 4: Create Callback Page

Create: `auramind-gemini/src/pages/auth/CallbackPage.tsx`

```typescript
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/database/supabase';

export const CallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        navigate('/dashboard');
      }
      if (event === 'USER_UPDATED') {
        // Email might have been verified
        navigate('/dashboard');
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Verifying your email...</h1>
        <p className="text-muted-foreground">Please wait while we confirm your account.</p>
      </div>
    </div>
  );
};
```

Add route in App.tsx:
```typescript
<Route path="/auth/callback" element={<CallbackPage />} />
```

---

## 4. Testing Email Service

### Test Email Service Locally

Create a test file: `auramind-gemini/src/__tests__/emailService.test.ts`

```typescript
import { emailService } from '../services/email/emailService';

describe('Email Service', () => {
  test('sendWelcomeEmail', async () => {
    const result = await emailService.sendWelcomeEmail({
      name: 'Test User',
      email: 'test@example.com',
    });
    console.log('Email result:', result);
    expect(result.success).toBe(true);
  });

  test('sendSignInAlert', async () => {
    const result = await emailService.sendSignInAlert({
      name: 'Test User',
      email: 'test@example.com',
      timestamp: new Date().toLocaleString(),
      device: 'Test Device',
    });
    console.log('Email result:', result);
    expect(result.success).toBe(true);
  });
});
```

Run tests:
```bash
npm test
```

### Test with Real Email

Create a simple test page: `auramind-gemini/src/pages/test/TestEmail.tsx`

```typescript
import { emailService } from '../../services/email/emailService';
import { useState } from 'react';

export const TestEmailPage = () => {
  const [status, setStatus] = useState('');

  const testEmail = async (type: string) => {
    setStatus('Sending...');
    try {
      switch (type) {
        case 'welcome':
          await emailService.sendWelcomeEmail({ name: 'Test User', email: 'your-email@example.com' });
          break;
        case 'trial':
          await emailService.sendTrialEndingEmail({
            name: 'Test User',
            email: 'your-email@example.com',
            trialEnds: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            daysRemaining: 7,
          });
          break;
        case 'payment':
          await emailService.sendPaymentSuccessEmail({
            name: 'Test User',
            email: 'your-email@example.com',
            amount: '$9.99',
            plan: 'Premium',
            nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          });
          break;
      }
      setStatus('Email sent successfully!');
    } catch (error: any) {
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Email Service Test</h1>
      <div className="space-y-4">
        <button onClick={() => testEmail('welcome')} className="btn-arch">
          Test Welcome Email
        </button>
        <button onClick={() => testEmail('trial')} className="btn-arch">
          Test Trial Ending Email
        </button>
        <button onClick={() => testEmail('payment')} className="btn-arch">
          Test Payment Success Email
        </button>
      </div>
      {status && <p className="mt-4">{status}</p>}
    </div>
  );
};
```

Add route: `<Route path="/test-email" element={<TestEmailPage />} />`

---

## 5. Environment Variables Summary

Add these to your `.env` file:

```bash
# Email Configuration
RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL=noreply@mail.auramind.app

# Stripe Webhook
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_SECRET_KEY=sk_your_stripe_secret_key
```

---

## 6. Deployment Checklist

- [ ] Resend API key configured
- [ ] Resend domain verified (mail.auramind.app)
- [ ] Stripe webhook endpoint deployed
- [ ] Stripe webhook configured in dashboard
- [ ] Trial tracking cron job set up
- [ ] Email verification enabled in Supabase
- [ ] Test emails sent successfully
- [ ] Database schema updated (trial columns, stripe_customer_id)

---

## Quick Start Commands

```bash
# Test email service
npm run test

# Start development server
npm run dev

# Build for production
npm run build
```

---

## Troubleshooting

### Emails not sending?
1. Check RESEND_API_KEY is correct
2. Verify email domain is verified in Resend
3. Check browser console for errors
4. Verify Resend account has credits

### Webhook not receiving events?
1. Verify webhook URL is accessible
2. Check Stripe webhook secret matches
3. Check webhook event types are selected
4. Review Stripe webhook logs

### Trial reminders not sending?
1. Verify cron job is running
2. Check trial_end dates are correct in database
3. Check trialService.checkTrialReminders() works manually

---

This guide provides all the steps needed to complete the email implementation. Start with the payment webhook, then trial tracking, then email verification. Test each step before moving to the next.
