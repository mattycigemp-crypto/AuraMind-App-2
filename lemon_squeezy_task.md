# Implementation Plan: Stripe to Lemon Squeezy Migration

Migration from Stripe to Lemon Squeezy (Merchant of Record) to simplify global tax compliance and billing management for AuraMind.

## 1. Prerequisites & Research
- [ ] Research `Lemon.js` for checkout overlays.
- [ ] Identify necessary backend changes for Supabase profile syncing using Lemon Squeezy webhooks.
- [ ] Confirm table structure for `subscriptions` in Supabase (if existing) or if we only rely on a `status` flag in `profiles`.

## 2. Environment Configuration
- [ ] Add `.env` variables for:
  - `LEMON_SQUEEZY_API_KEY`
  - `LEMON_SQUEEZY_STORE_ID`
  - `LEMON_SQUEEZY_WEBHOOK_SECRET`
  - `VITE_LEMON_SQUEEZY_VARIANT_ID_MONTHLY`
  - `VITE_LEMON_SQUEEZY_VARIANT_ID_YEARLY`

## 3. Frontend Implementation
- [ ] **Lemon.js Setup**: Initialize Lemon.js in `App.tsx` or `index.html`.
- [ ] **PaymentPage.tsx Refactor**:
  - Replace Stripe Checkout logic with Lemon Squeezy checkout link generation.
  - Implement Lemon Squeezy overlay for a premium checkout experience.
- [ ] **Subscription Portal**: Replace Stripe Billing Portal link with the Lemon Squeezy Customer Portal URL.

## 4. Backend Implementation (API)
- [ ] **api/create-ls-checkout.ts**: Create a new endpoint to generate Lemon Squeezy checkout URLs (passing the `custom_id` for user correlation).
- [ ] **api/ls-webhook.ts**: Implement a robust webhook handler for:
  - `subscription_created`
  - `subscription_updated`
  - `subscription_cancelled`
  - Update Supabase `profiles` or `subscriptions` table accordingly.
- [ ] **api/check-subscription.ts**: Update to use internal Supabase state instead of direct Stripe API calls for better performance.

## 5. Cleanup
- [ ] Remove `stripe` from `package.json`.
- [ ] Delete `api/create-checkout-session.ts`, `api/stripe-webhook.ts`, and `api/stripe-portal.ts`.

## 6. Verification & E2E Testing
- [ ] Test checkout flow with Lemon Squeezy Test Mode.
- [ ] Verify webhook processing on local environment before deployment.
- [ ] Perform UI audit of the new payment flow.
