# LunchCrew App

Mobile lunch-planning app for coworkers.

## Stack

- React Native + TypeScript (Expo)
- Planned backend: Supabase (auth + postgres + realtime)

## Current status

Initial MVP frontend scaffold is ready in `App.tsx`:

- Workspace naming
- Open invite code display
- Join flow (name)
- Daily lunch poll options
- One-tap voting
- Add new lunch place option
- Current top-choice preview

This is an on-device prototype UI state for quick iteration.

## Run locally

```bash
npm install
npm run web
# or
npm run android
npm run ios
```

## Next implementation steps

1. Supabase project setup + `.env`
2. Real auth (magic link)
3. Workspace/member tables
4. Poll + options + votes tables
5. Realtime updates for live votes
6. Daily poll auto-create logic
7. Push notifications before lunchtime

## Suggested first DB schema

- `workspaces` (id, name, invite_code, created_at)
- `profiles` (id, full_name, workspace_id)
- `polls` (id, workspace_id, title, closes_at, created_at)
- `poll_options` (id, poll_id, name)
- `votes` (id, poll_id, option_id, user_id, created_at)

## Repo

Intended repo name: `lunch-crew-app`
