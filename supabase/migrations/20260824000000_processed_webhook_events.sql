-- Webhook idempotency ledger.
--
-- Stripe retries webhook deliveries (and can redeliver on manual replay).
-- Without a dedup table, a retried checkout.session.completed would re-run
-- provisioning and re-send emails. Every Stripe event ID is recorded here
-- before processing; a repeat delivery short-circuits with 200.
--
-- Idempotent: safe to re-apply.

create table if not exists public.processed_webhook_events (
  event_id   text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

-- Row-level security: the table is service-role only. No policies means no
-- client (anon/authenticated) can read or write it; the API uses the
-- service-role key which bypasses RLS.

comment on table public.processed_webhook_events is
  'Stripe webhook idempotency ledger — event IDs already processed by api/stripe-webhook.ts';

-- Housekeeping: events older than 90 days can never be redelivered by Stripe
-- (max retry window is ~3 days), so a periodic cleanup is safe. Exposed as an
-- RPC the daily cron may call; no-op if nothing expires.
create or replace function public.prune_processed_webhook_events()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.processed_webhook_events
  where processed_at < now() - interval '90 days';
end;
$$;

grant execute on function public.prune_processed_webhook_events() to service_role;

-- Migration bookkeeping (required by the supabaseContract regression test
-- and the run-migrations.js ledger).
INSERT INTO schema_migrations (version, description)
VALUES (
  '20260824000000_processed_webhook_events',
  'Stripe webhook idempotency ledger + prune RPC'
)
on conflict (version) do nothing;
