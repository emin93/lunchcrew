# places-proxy (Supabase Edge Function)

Smart Options v1 backend proxy for Google Places.

## Endpoints

- `GET /places-proxy/autocomplete?q=<query>&regionCode=MX&languageCode=en&lat=<number>&lng=<number>&radiusMeters=8000`
- `GET /places-proxy/details?placeId=<google_place_id>`

## Required secrets

Set in Supabase project secrets:

- `GOOGLE_MAPS_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Deploy

```bash
supabase functions deploy places-proxy
```

## Local run

```bash
supabase functions serve places-proxy --env-file .env.local
```

## Notes

- Details endpoint caches responses in `public.places_cache`.
- `detected_menu_url` is heuristic-based in v1.
- Keep Google key server-side only (never expose unrestricted browser key).
