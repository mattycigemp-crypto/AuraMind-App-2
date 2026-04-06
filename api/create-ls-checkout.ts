import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const json = (res: VercelResponse, status: number, body: Record<string, unknown>) => {
  res.status(status).setHeader('Content-Type', 'application/json').send(JSON.stringify(body));
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  const lsApiKey = process.env.LEMON_SQUEEZY_API_KEY;
  const storeId = process.env.LEMON_SQUEEZY_STORE_ID;

  if (!lsApiKey || !storeId) {
    return json(res, 500, { error: 'Lemon Squeezy configuration missing.' });
  }

  const { variantId, userId, email, name } = req.body || {};

  if (!variantId || !userId || !email) {
    return json(res, 400, { error: 'variantId, userId, and email are required.' });
  }

  try {
    // Create a checkout session using Lemon Squeezy API
    // Documentation: https://docs.lemonsqueezy.com/api/checkouts#create-a-checkout
    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        'Authorization': `Bearer ${lsApiKey}`
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: {
              email: email,
              name: name || email.split('@')[0],
              custom: {
                user_id: userId
              }
            },
            product_options: {
              redirect_url: `${req.headers.origin}/dashboard?payment=success`,
              enabled_variants: [parseInt(variantId)]
            }
          },
          relationships: {
            store: {
              data: {
                type: 'stores',
                id: storeId.toString()
              }
            },
            variant: {
              data: {
                type: 'variants',
                id: variantId.toString()
              }
            }
          }
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errors?.[0]?.detail || 'Failed to create LS checkout');
    }

    return json(res, 200, { url: data.data.attributes.url });
  } catch (err: any) {
    console.error('Lemon Squeezy Checkout error:', err);
    return json(res, 500, { error: err.message || 'Failed to create checkout.' });
  }
}
