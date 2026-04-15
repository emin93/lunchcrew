# LunchCrew

LunchCrew is a small web app for teams deciding where to eat lunch together. It gives a crew a reusable invite link, a daily ballot, nearby place suggestions, lightweight identity, and a simple history of past winners.

## Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase
- Supabase Edge Functions for places lookup and Stripe flows

## What It Does

- Creates or restores a crew from a shareable invite code
- Generates a fresh lunch poll for the current UTC day
- Lets teammates add places manually or from nearby suggestions
- Syncs votes live with Supabase realtime, with polling fallback
- Stores lightweight member names per device
- Tracks recent winners and a simple leaderboard
- Supports optional founding-plan checkout via Stripe

## Local Setup

1. Install dependencies

```bash
npm install
```

2. Create local env vars

```bash
cp .env.example .env
```

3. Fill in the required values

- Client-side:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Server-side / Edge Functions:
  - `GOOGLE_MAPS_API_KEY`
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `LUNCHCREW_BASE_URL`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`

`EXPO_PUBLIC_*` vars are only kept for backward compatibility in the codebase and are not required for the web app.

4. Apply the database schema in Supabase

- Run [`supabase.sql`](/home/deck/Documents/Projects/lunchcrew/supabase.sql)

5. Start the app

```bash
npm run dev
```

## Supabase Functions

This repo includes Edge Functions under [`supabase/functions`](/home/deck/Documents/Projects/lunchcrew/supabase/functions):

- `places-proxy`
- `stripe-create-checkout`
- `stripe-webhook`

Those functions require server-side secrets. Do not expose service role, Stripe secret, webhook secret, or Maps API keys in client-side env vars or frontend code.

## Repo

- https://github.com/emin93/lunchcrew
