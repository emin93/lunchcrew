# LunchCrew App

Mobile lunch-planning app for coworkers.

## Stack
- React Native + TypeScript (Expo)
- Supabase (workspaces + daily polls + votes)

## What works now
- App launch without deep link: auto-creates workspace
- App launch with invite deep link: auto-joins workspace
- Share invite link
- Auto-creates today's poll for the workspace
- Vote on lunch options
- Add new lunch options
- One vote per device (latest vote wins)

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

3) Create DB schema in Supabase SQL editor
- Run `supabase.sql`

4) Start app
```bash
npx expo start --tunnel -c
```

## Notes
- Current RLS is intentionally open for MVP speed.
- Before production: add auth + workspace membership checks + tighter RLS.

## Repo
- https://github.com/emin93/lunch-crew-app
