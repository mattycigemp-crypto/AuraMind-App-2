# AuraMind Deployment Guide

## Prerequisites

1. **Node.js 18+** - [Download](https://nodejs.org/)
2. **npm** or **yarn**
3. **Supabase account** - [Sign up](https://supabase.com)
4. **Vercel account** - [Sign up](https://vercel.com)

## Quick Deploy

### 1. Database Setup (Supabase)

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the migration:
   - Copy the contents of `supabase/migrations/20260521_fsrs_factcheck.sql`
   - Paste and run in the SQL Editor
3. Note your project URL and anon key from Settings → API

### 2. Environment Variables

Copy `.env.example` to `.env` in the `auramind-gemini/` directory:

```bash
cd auramind-gemini
cp .env.example .env
```

Fill in the required values:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anon key
- At least one AI provider key (Groq recommended)

### 3. Deploy to Vercel

```bash
# From project root
npm install -g vercel
vercel
```

Set environment variables in Vercel dashboard:
- Go to Project → Settings → Environment Variables
- Add all variables from `.env.example`

### 4. Production Deploy

```bash
vercel --prod
```

## Manual Build

```bash
cd auramind-gemini
npm install
npm run build
```

The built files will be in `auramind-gemini/dist/`.

## Environment Variables

### Required
| Variable | Description | Where to get |
|----------|-------------|--------------|
| `VITE_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | Supabase Dashboard → API |

### Recommended
| Variable | Description | Where to get |
|----------|-------------|--------------|
| `VITE_GROQ_API_KEY` | Groq AI API key | console.groq.com |
| `VITE_OPENROUTER_API_KEY` | OpenRouter API key | openrouter.ai |

### Optional
| Variable | Description |
|----------|-------------|
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe for payments |
| `VITE_POSTHOG_KEY` | PostHog analytics |
| `RESEND_API_KEY` | Resend for emails |

## PWA Setup

1. Add your app icons to `auramind-gemini/public/icons/`:
   - `icon-192x192.png`
   - `icon-384x384.png`
   - `icon-512x512.png`

2. Add an OG image at `auramind-gemini/public/og-image.png` (1200x630px)

3. Update `manifest.json` with your app details

## Security Checklist

Verified against the code in this repo (Aug 2026):

- [x] **Security headers** — CSP, HSTS, X-Frame-Options, Referrer-Policy,
      Permissions-Policy set in `api/middleware.ts` and `vercel.json`.
- [x] **Rate limiting** — per-IP limiter in `api/middleware.ts` (100 req/min
      default, 30 for AI, 10 for auth) applied to every API route.
- [x] **Cookie consent banner** — `src/components/shared/CookieConsentBanner.tsx`.
- [x] **RLS policies** — created by the append-only migrations in
      `supabase/migrations/` (see `SECURITY.md` for the rules every policy
      follows).
- [x] **Resend API key is server-side only** — transactional email goes through
      `POST /api/email`; the key never ships in the client bundle.

Still requires manual/out-of-band setup (cannot be verified from the repo):

- [ ] All required environment variables set in the **Vercel** project settings
      and `api/.env` (see README env tables).
- [ ] Stripe webhook endpoint configured in the Stripe dashboard with the
      `STRIPE_WEBHOOK_SECRET`.
- [ ] Custom domain configured with HTTPS in Vercel.
- [ ] Apply the migrations in `supabase/migrations/` to the live project
      (time-stamp order; `npm run migrate` with `supabase/` config, or the
      Supabase CLI).

## Monitoring

- **PostHog**: User analytics and error tracking
- **Vercel Analytics**: Performance metrics
- **Supabase Logs**: Database queries and auth events

## Troubleshooting

### Build fails
```bash
cd auramind-gemini
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Environment variables not loading
- Ensure variables start with `VITE_` for client-side access
- Restart dev server after changing `.env`
- Check Vercel dashboard for production variables

### Supabase connection errors
- Verify URL and anon key are correct
- Check that RLS policies are set up
- Ensure tables exist (run migration)
