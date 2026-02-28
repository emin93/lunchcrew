# LunchCrew App

Mobile lunch-planning app for coworkers.

## Stack
- React Native + TypeScript (Expo)
- Supabase (workspace + invite links + today voting)

## What works now
- Auto-create workspace on app launch (no deep link)
- Auto-join workspace from invite deep link (`?code=...`)
- Share invite link in one tap
- Auto-create **today's poll** per workspace
- Default options created automatically
- One-person-one-vote (device-local voter id)
- Add new lunch option
- Live vote counts loaded from Supabase

## Setup

1) Install deps
```bash
npm install
```

2) Configure env
```bash
cp .env.example .env
# fill EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY
```

3) Run DB schema in Supabase SQL Editor
- run `supabase.sql`

4) Start app
```bash
npx expo start --tunnel -c
```

## Notes
- Current RLS policies are intentionally open for MVP speed.
- Tighten auth/policies before production rollout.

## Repo
- https://github.com/emin93/lunch-crew-app
