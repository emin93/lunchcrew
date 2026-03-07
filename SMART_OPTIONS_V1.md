# Smart Options v1 Spec (Places + Menu Links)

_Last updated: 2026-03-07_

## Goal

Upgrade LunchCrew options from plain text into structured places with lightweight discovery:
- Better option quality
- Faster decision-making
- Easy access to map/menu context

Constraints:
- Keep MVP speed and low complexity
- Minimize API costs
- No hard dependency on menu APIs (often incomplete/inconsistent)

---

## Scope (v1)

### Included
1. **Place autocomplete** when adding an option
2. **Store selected place metadata** (name, address, rating, maps URL, etc.)
3. **Render richer option cards** with place details
4. **Menu link support**:
   - Prefer `website` from place details (and detect common menu paths)
   - Allow manual menu URL override per option
5. **Caching** to reduce repeated API calls

### Not included (v1)
- Full menu scraping/parsing
- OCR/menu extraction pipelines
- Delivery-provider deep integrations
- Personalized recommendations

---

## External provider strategy

## Primary provider
- Google Places API (Autocomplete + Place Details)

## Cost control principles
- Query only on explicit user typing in add-option flow
- Debounce requests (300–500ms)
- Request minimal fields in Details
- Cache place records locally and reuse by `place_id`
- Never fetch details repeatedly for the same selected place unless stale

## “Free” reality
- Google Places is not truly free at scale.
- v1 should be architected provider-agnostic so we can swap/add alternatives later.

---

## Data model changes

### 1) New table: `places_cache`

```sql
create table if not exists public.places_cache (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'google',
  external_place_id text not null,
  name text not null,
  formatted_address text,
  lat double precision,
  lng double precision,
  rating numeric,
  user_ratings_total int,
  price_level int,
  business_status text,
  google_maps_url text,
  website_url text,
  detected_menu_url text,
  phone text,
  raw jsonb,
  fetched_at timestamptz not null default now(),
  unique (provider, external_place_id)
);
```

### 2) Extend `poll_options`

```sql
alter table public.poll_options
  add column if not exists place_cache_id uuid references public.places_cache(id) on delete set null,
  add column if not exists menu_url text,
  add column if not exists source text default 'manual';
```

- `source` values (v1):
  - `manual` (typed plain text)
  - `google_place` (selected autocomplete place)

### 3) Optional future table (v2+)
- `option_link_clicks` for analytics (not required now)

---

## API/service layer design

## Server-side proxy (recommended)
Do **not** call Google directly from client with unrestricted key.

Create lightweight backend endpoints (Edge Function / tiny API):
1. `GET /places/autocomplete?q=...`
2. `GET /places/details?placeId=...`

Responsibilities:
- Hold provider API key securely
- Normalize provider responses to app-friendly schema
- Enforce rate limits + basic abuse protection
- Cache place details in `places_cache`

## Response shapes (normalized)

### Autocomplete result
```json
{
  "id": "google:ChIJ...",
  "provider": "google",
  "externalPlaceId": "ChIJ...",
  "name": "Taqueria X",
  "secondaryText": "Tulum Centro"
}
```

### Place details
```json
{
  "provider": "google",
  "externalPlaceId": "ChIJ...",
  "name": "Taqueria X",
  "formattedAddress": "...",
  "location": { "lat": 20.2, "lng": -87.4 },
  "rating": 4.6,
  "userRatingsTotal": 321,
  "priceLevel": 2,
  "businessStatus": "OPERATIONAL",
  "googleMapsUrl": "https://maps.google.com/...",
  "websiteUrl": "https://...",
  "detectedMenuUrl": "https://.../menu",
  "phone": "+52..."
}
```

---

## UX flow (v1)

## Add option flow
1. User taps “Suggest a place”
2. Types 2+ chars
3. Show autocomplete dropdown
4. User selects a place OR keeps manual text

### If place selected
- Create/update `places_cache`
- Insert `poll_options` with:
  - `name`
  - `place_cache_id`
  - `source='google_place'`
  - optional initial `menu_url` from detected/website

### If manual text submit
- Insert `poll_options` with:
  - `name`
  - `source='manual'`

## Option card rendering
For each option:
- Name + votes + voters (existing)
- If linked place exists:
  - rating / price level / short address (compact)
  - CTA buttons:
    - `Open Maps`
    - `View Menu` (if URL exists)
- If no menu URL and source is place/manual:
  - small “Add menu link” action

## Add menu link
- lightweight inline prompt/modal
- validates URL format
- writes to `poll_options.menu_url`
- visible to entire crew

---

## Menu URL detection heuristics (v1)

Given `website_url`, attempt common paths:
- `/menu`
- `/menus`
- `/food-menu`
- `/our-menu`

Rules:
- HEAD/GET with timeout
- accept only 2xx/3xx
- prefer HTTPS
- if none valid, leave null

No scraping/parsing in v1.

---

## RLS/policies notes

Current app is open-policy MVP.
For now, match existing open pattern for new table:
- select/insert/update allowed

When Sprint C hardening starts:
- scope access by workspace
- restrict who can edit menu URLs if needed

---

## Realtime integration

Existing realtime setup should include `poll_options` updates already.
Because v1 writes menu links and place IDs into `poll_options`, updates should propagate automatically.

If we add live `places_cache` edits, consider adding `places_cache` channel later.

---

## Implementation checklist

## Backend
- [ ] Add SQL changes (`places_cache`, `poll_options` extensions)
- [ ] Add provider config env vars
- [ ] Build autocomplete proxy endpoint
- [ ] Build place details endpoint + cache write/read
- [ ] Add basic rate limiting + timeout guards

## Frontend
- [ ] Add autocomplete UI to add-option input
- [ ] Add selected-place add flow
- [ ] Render place metadata in option cards
- [ ] Add Open Maps button
- [ ] Add View Menu button when available
- [ ] Add “Add menu link” action + validation

## QA
- [ ] Manual add still works with no provider
- [ ] Selecting a place inserts linked option
- [ ] Menu link renders and opens correctly
- [ ] Realtime updates visible cross-device
- [ ] Graceful fallback on provider/API failure

---

## Risks + mitigations

1. **Provider cost growth**
   - Mitigation: cache aggressively, debounce input, minimal fields

2. **Menu data missing/inaccurate**
   - Mitigation: user-provided menu URL override

3. **Client key leakage risk**
   - Mitigation: server-side proxy only

4. **Complex UX in add flow**
   - Mitigation: keep manual text submit as first-class fallback

---

## Success metrics (v1)

- % options added via place select vs manual
- % options with menu links
- time-to-decision reduction (proxy via first-vote-to-final-vote window)
- qualitative tester feedback: “easier to pick”

---

## Recommendation for immediate next build step

Implement in this order:
1. DB schema update
2. Backend autocomplete/details proxy with cache
3. Frontend autocomplete select + maps link
4. Menu URL add/override UI

This sequence yields visible user value quickly while keeping complexity controlled.
