# LunchCrew Product Plan (Draft)

_Last updated: 2026-03-07_

## Product direction

LunchCrew should stay **fast and low-friction**.
Primary rule: people should be able to open the app and vote in seconds.

### Guardrails
- No mandatory account/login for MVP+
- No auth wall before first vote
- Any identity layer must feel optional and lightweight

---

## Current baseline (already implemented)
- Onboarding flow
- Workspace creation + invite deep-link join
- Crew rename + invite sharing
- Daily poll auto-creation
- Default + custom options
- One vote per device (`deviceId` upsert)
- Poll refresh via periodic sync
- Expo app + Supabase backend + marketing site

---

## Prioritized roadmap

## Sprint A (next, 1-2 weeks)

### A1) Lightweight identity (no login) — **Top Priority**
Goal: show who voted, without adding auth complexity.

#### UX
- On first vote (or first app open), prompt for **optional display name**
- Allow “Skip for now” and continue voting
- Show voter names beside/under options (or in a compact voter list)
- Avatar style: **initials only** (no image upload)
  - Example: "Emin Khateeb" → "EK"
  - If no name: fallback "?" or "Guest"

#### Rules
- Name is stored locally + synced as profile record tied to current `deviceId`
- Name editable anytime in settings/crew panel
- No email/password/social login

#### Data model (proposed)
- New table: `workspace_members`
  - `id` (uuid)
  - `workspace_id` (uuid fk)
  - `device_id` (text)
  - `display_name` (text, nullable initially)
  - `created_at`, `updated_at`
  - unique (`workspace_id`, `device_id`)
- Keep `votes` table as-is for now (`voter_id` == `device_id`)
- For voter display: join `votes.voter_id` -> `workspace_members.device_id`

#### Why this approach
- Preserves speed (no auth flow)
- Adds social trust and clarity (who voted)
- Minimal migration risk from current schema

---

### A2) Poll lifecycle controls
Goal: make daily voting deterministic.

#### Add
- Poll status: `open` / `closed`
- Optional cutoff time (`closes_at`)
- Prevent vote changes after close
- Winner badge + tie state

#### Data model (proposed)
- Add columns to `polls`:
  - `status text default 'open'`
  - `closes_at timestamptz null`
  - `closed_at timestamptz null`

---

## Sprint B

### B1) History + insights
- Previous days winners
- Most picked places (7/30-day windows)
- Simple team stats

### B2) Realtime updates
- Replace/pair polling with Supabase realtime subscriptions
- Keep polling as fallback for resilience

---

## Sprint C

### C1) Security hardening
- Tighten RLS from current open MVP policies
- Workspace-scoped access rules
- Input + abuse safeguards

### C2) Invite governance
- Expiring invite links
- Invite rotation/revoke

### C3) Option quality
- Basic dedupe (case/spacing/near-duplicates)
- Optional place autocomplete later

---

## Open decisions

1. Should display name prompt appear:
   - immediately after onboarding, or
   - lazily at first vote?

2. Voter visibility:
   - full names under each option, or
   - compact initials + tap to expand?

3. Name policy:
   - allow duplicates, or
   - warn if duplicate in same crew?

---

## Recommendation (current)

Start with:
- Lazy prompt at first vote
- Optional name + initials avatar only
- No login
- Full names visible in poll details

This gives the biggest UX win with minimal complexity.
