/**
 * AuraMind Realtime Notify — Supabase Edge Function (Deno)
 *
 * Broadcasts events to Realtime channels using the service role.
 * Triggered by database triggers via net.http_post() (pg_net).
 *
 * Why not realtime.broadcast_changes():
 *   The `realtime` PostgreSQL extension is not available on all Supabase
 *   projects. pg_net + this Edge Function is the portable alternative.
 *
 * Deploy:
 *   supabase functions deploy realtime-notify --no-verify-jwt
 *
 * Usage (from a PostgreSQL trigger):
 *   PERFORM net.http_post(
 *     url := 'https://{project}.supabase.co/functions/v1/realtime-notify',
 *     headers := '{"Content-Type": "application/json"}'::jsonb,
 *     body := jsonb_build_object(
 *       'channel', 'user:<user_id>:notifications',
 *       'event', 'broadcast',
 *       'payload', '{"type":"study_session","event":"study_session_completed",...}'::jsonb
 *     )::text
 *   );
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

interface BroadcastBody {
  channel: string;
  event?: string;
  payload: Record<string, unknown>;
  /** Optional shared secret for request authentication */
  secret?: string;
}

Deno.serve(async (req: Request) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Optional webhook secret check
  const expectedSecret = Deno.env.get('REALTIME_WEBHOOK_SECRET');
  if (expectedSecret) {
    const providedSecret = req.headers.get('x-webhook-secret') || '';
    if (providedSecret !== expectedSecret) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // Parse body
  let body: BroadcastBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!body.channel) {
    return new Response(JSON.stringify({ error: 'channel is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Get Supabase URL + service role key from the Edge Function environment
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Subscribe to the channel, send the broadcast, then clean up
  const realtimeChannel = supabase.channel(body.channel);

  try {
    // Wait for subscription to be established (with 5s timeout)
    const subscribeStatus = await new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => {
        supabase.removeChannel(realtimeChannel);
        reject(new Error('Subscription timeout'));
      }, 5000);

      realtimeChannel.subscribe((status) => {
        clearTimeout(timeout);
        resolve(status);
      });
    });

    if (subscribeStatus !== 'SUBSCRIBED') {
      supabase.removeChannel(realtimeChannel);
      return new Response(
        JSON.stringify({ error: `Failed to subscribe: ${subscribeStatus}` }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    // Fire-and-forget broadcast (no ack wait needed)
    realtimeChannel.send({
      type: 'broadcast',
      event: body.event ?? 'broadcast',
      payload: body.payload,
    });

    // Brief flush window before cleanup
    await new Promise((r) => setTimeout(r, 200));

    supabase.removeChannel(realtimeChannel);

    return new Response(
      JSON.stringify({
        ok: true,
        channel: body.channel,
        event: body.event ?? 'broadcast',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (err: unknown) {
    // Clean up channel on any error
    try { supabase.removeChannel(realtimeChannel); } catch { /* ignore */ }

    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[realtime-notify] Error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
