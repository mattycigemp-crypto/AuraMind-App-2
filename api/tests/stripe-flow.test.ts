import { describe, it, expect, vi, afterEach } from 'vitest';
import { call } from './helpers.js';
import webhookHandler from '../stripe-webhook.js';

const supabase = vi.hoisted(() => ({
  auth: {
    getUser: vi.fn(),
    admin: {
      getUserById: vi.fn(),
      updateUserById: vi.fn(),
    },
  },
}));

const stripeMock = vi.hoisted(() => ({
  sessions: { create: vi.fn() },
  portalSessions: { create: vi.fn() },
  subscriptions: { retrieve: vi.fn() },
  webhooks: {
    constructEvent: vi.fn(),
  },
}));

const resendMock = vi.hoisted(() => ({
  emails: { send: vi.fn() },
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => supabase),
}));

vi.mock('stripe', () => ({
  default: class StripeMock {
    checkout = { sessions: stripeMock.sessions };
    billingPortal = { sessions: stripeMock.portalSessions };
    subscriptions = stripeMock.subscriptions;
    webhooks = stripeMock.webhooks;
  },
}));

vi.mock('resend', () => ({
  Resend: class {
    emails = resendMock.emails;
  },
}));

afterEach(() => {
  vi.restoreAllMocks();
  supabase.auth.getUser.mockReset();
  supabase.auth.admin.getUserById.mockReset();
  supabase.auth.admin.updateUserById.mockReset();
  stripeMock.sessions.create.mockReset();
  stripeMock.portalSessions.create.mockReset();
  stripeMock.subscriptions.retrieve.mockReset();
  stripeMock.webhooks.constructEvent.mockReset();
  resendMock.emails.send.mockReset();
});

function webhookRes() {
  const state = { status: 200, body: null as any };
  const res: any = {
    state,
    status(c: number) { state.status = c; return res; },
    setHeader() { return res; },
    send(b: any) { state.body = typeof b === 'string' ? JSON.parse(b) : b; return res; },
    json(b: any) { state.body = b; return res; },
  };
  return res;
}

describe('Stripe flow (mocked Stripe + Supabase + Resend)', () => {
  it('checkout: creates a session and immediately marks the user as trialing', async () => {
    stripeMock.sessions.create.mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/c/pay/cs_test_123',
    });
    supabase.auth.admin.getUserById.mockResolvedValue({
      data: { user: { id: '00000000-0000-4000-8000-000000000001', user_metadata: {} } },
      error: null,
    });
    supabase.auth.admin.updateUserById.mockResolvedValue({ error: null });

    const { status, body } = await call('stripe/checkout', {
      body: {
        priceId: 'price_monthly_test',
        userId: '00000000-0000-4000-8000-000000000001',
        email: 'buyer@example.com',
      },
    });

    expect(status).toBe(200);
    expect(body.url).toBe('https://checkout.stripe.com/c/pay/cs_test_123');
    expect(stripeMock.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        line_items: [{ price: 'price_monthly_test', quantity: 1 }],
        metadata: { supabase_user_id: '00000000-0000-4000-8000-000000000001' },
      }),
    );
    // Immediate trial marking so the user doesn't hit a redirect loop
    expect(supabase.auth.admin.updateUserById).toHaveBeenCalledWith(
      '00000000-0000-4000-8000-000000000001',
      expect.objectContaining({
        user_metadata: expect.objectContaining({
          subscription_status: 'trialing',
          plan: 'Pro',
        }),
      }),
    );
  });

  it('checkout: surfaces Stripe errors as 500', async () => {
    stripeMock.sessions.create.mockRejectedValue(new Error('No such price: price_bogus'));

    const { status, body } = await call('stripe/checkout', {
      body: { priceId: 'price_bogus', userId: '00000000-0000-4000-8000-000000000001', email: 'buyer@example.com' },
    });

    expect(status).toBe(500);
    expect(body.error).toContain('No such price');
  });

  it('webhook: checkout.session.completed provisions the subscription and emails the buyer', async () => {
    const event = {
      id: 'evt_1',
      object: 'event',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          object: 'checkout.session',
          metadata: { supabase_user_id: '00000000-0000-4000-8000-000000000001' },
          customer: 'cus_123',
          subscription: 'sub_123',
          customer_details: { email: 'buyer@example.com', name: 'Buyer' },
          amount_total: 799,
          currency: 'usd',
        },
      },
    };

    stripeMock.webhooks.constructEvent.mockReturnValue(event);
    stripeMock.subscriptions.retrieve.mockResolvedValue({
      id: 'sub_123',
      status: 'active',
      trial_end: null,
      current_period_end: 2_000_000_000,
    });
    supabase.auth.admin.updateUserById.mockResolvedValue({ error: null });
    resendMock.emails.send.mockResolvedValue({ data: { id: 'email_1' }, error: null });

    const res = webhookRes();
    await webhookHandler(
      {
        method: 'POST',
        headers: { 'stripe-signature': 't=1,v1=valid' },
        body: JSON.stringify(event),
      } as any,
      res as any,
    );

    expect(res.state.status).toBe(200);
    expect(supabase.auth.admin.updateUserById).toHaveBeenCalledWith(
      '00000000-0000-4000-8000-000000000001',
      expect.objectContaining({
        user_metadata: expect.objectContaining({
          stripe_customer_id: 'cus_123',
          stripe_subscription_id: 'sub_123',
          subscription_status: 'active',
          plan: 'Pro',
        }),
      }),
    );
    expect(stripeMock.subscriptions.retrieve).toHaveBeenCalledWith('sub_123');
    expect(resendMock.emails.send).toHaveBeenCalledTimes(1);
  });

  it('webhook: subscription.deleted downgrades the user to Starter', async () => {
    const event = {
      id: 'evt_2',
      object: 'event',
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_123',
          object: 'subscription',
          metadata: { supabase_user_id: '00000000-0000-4000-8000-000000000001' },
          current_period_end: 2_000_000_000,
        },
      },
    };

    stripeMock.webhooks.constructEvent.mockReturnValue(event);
    supabase.auth.admin.updateUserById.mockResolvedValue({ error: null });
    supabase.auth.admin.getUserById.mockResolvedValue({
      data: { user: { email: 'buyer@example.com', user_metadata: { full_name: 'Buyer' } } },
      error: null,
    });
    resendMock.emails.send.mockResolvedValue({ data: { id: 'email_2' }, error: null });

    const res = webhookRes();
    await webhookHandler(
      { method: 'POST', headers: { 'stripe-signature': 't=1,v1=valid' }, body: JSON.stringify(event) } as any,
      res as any,
    );

    expect(res.state.status).toBe(200);
    expect(supabase.auth.admin.updateUserById).toHaveBeenCalledWith(
      '00000000-0000-4000-8000-000000000001',
      expect.objectContaining({
        user_metadata: expect.objectContaining({
          subscription_status: 'canceled',
          plan: 'Starter',
        }),
      }),
    );
  });

  it('webhook: ignores event types it does not handle', async () => {
    stripeMock.webhooks.constructEvent.mockReturnValue({
      id: 'evt_3',
      object: 'event',
      type: 'ping',
      data: { object: {} },
    });

    const res = webhookRes();
    await webhookHandler(
      { method: 'POST', headers: { 'stripe-signature': 't=1,v1=valid' }, body: JSON.stringify({ type: 'ping' }) } as any,
      res as any,
    );

    expect(res.state.status).toBe(200);
    expect(supabase.auth.admin.updateUserById).not.toHaveBeenCalled();
    expect(resendMock.emails.send).not.toHaveBeenCalled();
  });
});
