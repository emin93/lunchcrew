# LunchCrew App

Mobile lunch-planning app for coworkers.

## Stack
- React Native + TypeScript (Expo)
- Supabase (workspace + invite code storage)

## What works now
- Create real workspace in Supabase
- Auto-generate invite code (`LC-XXXX-XXXX`)
- Join workspace by invite code
- Share invite via native share sheet

## Setup

1) Install deps
```bash
npm install
```

2) Configure env
```bash
cp .env.example .env
# then fill EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY
```

3) Create DB table/policies in Supabase SQL editor
- Run `supabase.sql`

4) Start app
```bash
npm run start
# or npx expo start --tunnel
```

## Notes
- Current RLS is intentionally open for MVP speed.
- Before production: add auth + workspace membership checks.

## Repo
- https://github.com/emin93/lunch-crew-app
