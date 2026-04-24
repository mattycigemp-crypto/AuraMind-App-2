import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const json = (res: VercelResponse, status: number, body: Record<string, unknown>) => {
  res.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const stripeSecret = process.env.STRIPE_SECRET_KEY || '';
  const resendKey = process.env.RESEND_API_KEY || '';

  const results = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    configuration: {
      supabaseUrl: supabaseUrl ? '✓ Configured' : '✗ Missing',
      supabaseServiceKey: supabaseServiceKey ? '✓ Configured' : '✗ Missing',
      stripeSecret: stripeSecret ? '✓ Configured' : '✗ Missing',
      resendKey: resendKey ? '✓ Configured' : '✗ Missing',
    },
    tests: [] as Array<{ name: string; status: string; message: string; details?: any }>
  };

  // Test 1: Supabase Connection
  try {
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: { users }, error } = await supabase.auth.admin.listUsers();
      
      if (error) {
        results.tests.push({
          name: 'Supabase Admin Connection',
          status: 'failed',
          message: error.message,
          details: error
        });
      } else {
        results.tests.push({
          name: 'Supabase Admin Connection',
          status: 'passed',
          message: `Successfully connected. Found ${users.length} users.`,
          details: { userCount: users.length }
        });
      }
    } else {
      results.tests.push({
        name: 'Supabase Admin Connection',
        status: 'skipped',
        message: 'Missing credentials'
      });
    }
  } catch (err: any) {
    results.tests.push({
      name: 'Supabase Admin Connection',
      status: 'failed',
      message: err.message || 'Unknown error',
      details: err
    });
  }

  // Test 2: Stripe Connection
  try {
    if (stripeSecret) {
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(stripeSecret);
      
      // Test by listing prices (lightweight call)
      await stripe.prices.list({ limit: 1 });
      
      results.tests.push({
        name: 'Stripe API Connection',
        status: 'passed',
        message: 'Successfully connected to Stripe API.'
      });
    } else {
      results.tests.push({
        name: 'Stripe API Connection',
        status: 'skipped',
        message: 'Missing Stripe secret key'
      });
    }
  } catch (err: any) {
    results.tests.push({
      name: 'Stripe API Connection',
      status: 'failed',
      message: err.message || 'Unknown error',
      details: err
    });
  }

  // Test 3: Admin User Check
  try {
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: { users }, error } = await supabase.auth.admin.listUsers();
      
      if (!error && users) {
        const admins = users.filter(u => 
          u.user_metadata?.is_admin || u.email === 'matty.cigemp@gmail.com'
        );
        
        results.tests.push({
          name: 'Admin Users',
          status: 'passed',
          message: `Found ${admins.length} admin users.`,
          details: {
            adminCount: admins.length,
            adminEmails: admins.map(a => a.email)
          }
        });
      }
    }
  } catch (err: any) {
    results.tests.push({
      name: 'Admin Users',
      status: 'failed',
      message: err.message || 'Unknown error'
    });
  }

  // Test 4: Subscription Status Check
  try {
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: { users }, error } = await supabase.auth.admin.listUsers();
      
      if (!error && users) {
        const activeSubs = users.filter(u => 
          u.user_metadata?.subscription_status === 'active' || 
          u.user_metadata?.subscription_status === 'trialing'
        );
        
        results.tests.push({
          name: 'Active Subscriptions',
          status: 'passed',
          message: `Found ${activeSubs.length} active/trialing subscriptions.`,
          details: {
            activeCount: activeSubs.length,
            plans: users.reduce((acc, u) => {
              const plan = u.user_metadata?.plan || 'Starter';
              acc[plan] = (acc[plan] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          }
        });
      }
    }
  } catch (err: any) {
    results.tests.push({
      name: 'Active Subscriptions',
      status: 'failed',
      message: err.message || 'Unknown error'
    });
  }

  const passedCount = results.tests.filter(t => t.status === 'passed').length;
  const failedCount = results.tests.filter(t => t.status === 'failed').length;
  const skippedCount = results.tests.filter(t => t.status === 'skipped').length;

  return json(res, 200, {
    ...results,
    summary: {
      total: results.tests.length,
      passed: passedCount,
      failed: failedCount,
      skipped: skippedCount,
      overallStatus: failedCount === 0 ? 'healthy' : 'issues detected'
    }
  });
}