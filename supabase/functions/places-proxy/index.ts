// @ts-nocheck
// Supabase Edge Function: places-proxy
// Endpoints:
//   GET /places-proxy/autocomplete?q=<query>
//   GET /places-proxy/details?placeId=<google_place_id>
//
// Required secrets:
//   GOOGLE_MAPS_API_KEY
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,OPTIONS',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
    },
  });
}

function normalizeMenuUrl(websiteUrl?: string | null): string | null {
  if (!websiteUrl) return null;
  try {
    const base = new URL(websiteUrl);
    const commonMenuPaths = ['/menu', '/menus', '/food-menu', '/our-menu'];
    for (const path of commonMenuPaths) {
      if (base.pathname.toLowerCase().includes('menu')) return base.toString();
      const candidate = new URL(path, `${base.protocol}//${base.host}`).toString();
      return candidate;
    }
    return null;
  } catch {
    return null;
  }
}

function toPriceLevel(value?: string | number | null): number | null {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return null;
  const map: Record<string, number> = {
    PRICE_LEVEL_FREE: 0,
    PRICE_LEVEL_INEXPENSIVE: 1,
    PRICE_LEVEL_MODERATE: 2,
    PRICE_LEVEL_EXPENSIVE: 3,
    PRICE_LEVEL_VERY_EXPENSIVE: 4,
  };
  return map[value] ?? null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  const googleApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!googleApiKey || !supabaseUrl || !serviceRoleKey) {
    return json({ error: 'Missing required environment variables' }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const url = new URL(req.url);

  try {
    if (url.pathname.endsWith('/autocomplete')) {
      const q = (url.searchParams.get('q') || '').trim();
      if (q.length < 2) return json({ items: [] });

      const regionCode = (url.searchParams.get('regionCode') || 'MX').toUpperCase();
      const languageCode = url.searchParams.get('languageCode') || 'en';
      const lat = Number(url.searchParams.get('lat'));
      const lng = Number(url.searchParams.get('lng'));
      const radiusMetersRaw = Number(url.searchParams.get('radiusMeters'));
      const radiusMeters = Number.isFinite(radiusMetersRaw) && radiusMetersRaw > 0 ? Math.min(radiusMetersRaw, 50000) : 8000;

      const body: any = {
        input: q,
        languageCode,
        regionCode,
        includedPrimaryTypes: ['restaurant'],
      };

      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        body.locationBias = {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: radiusMeters,
          },
        };
      }

      const resp = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'X-Goog-Api-Key': googleApiKey,
          'X-Goog-FieldMask':
            'suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat',
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const errBody = await resp.text();
        return json({ error: 'Google autocomplete failed', details: errBody }, 502);
      }

      const payload = await resp.json();
      const items = ((payload.suggestions || []) as any[])
        .map((s) => s.placePrediction)
        .filter(Boolean)
        .map((p) => ({
          id: `google:${p.placeId}`,
          provider: 'google',
          externalPlaceId: p.placeId,
          name: p.structuredFormat?.mainText?.text || p.text?.text || '',
          secondaryText: p.structuredFormat?.secondaryText?.text || '',
        }))
        .filter((x) => x.externalPlaceId && x.name);

      return json({ items });
    }

    if (url.pathname.endsWith('/details')) {
      const placeId = (url.searchParams.get('placeId') || '').trim();
      if (!placeId) return json({ error: 'placeId is required' }, 400);

      const provider = 'google';

      // 1) Cache hit first
      const cached = await supabase
        .from('places_cache')
        .select('*')
        .eq('provider', provider)
        .eq('external_place_id', placeId)
        .maybeSingle();

      if (cached.data) {
        return json({
          provider,
          externalPlaceId: cached.data.external_place_id,
          name: cached.data.name,
          formattedAddress: cached.data.formatted_address,
          location: cached.data.lat && cached.data.lng ? { lat: cached.data.lat, lng: cached.data.lng } : null,
          rating: cached.data.rating,
          userRatingsTotal: cached.data.user_ratings_total,
          priceLevel: cached.data.price_level,
          businessStatus: cached.data.business_status,
          googleMapsUrl: cached.data.google_maps_url,
          websiteUrl: cached.data.website_url,
          detectedMenuUrl: cached.data.detected_menu_url,
          phone: cached.data.phone,
          cached: true,
        });
      }

      // 2) Fetch from Google Places Details API (new)
      const detailsResp = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
        headers: {
          'X-Goog-Api-Key': googleApiKey,
          'X-Goog-FieldMask':
            'id,displayName,formattedAddress,location,rating,userRatingCount,priceLevel,businessStatus,googleMapsUri,websiteUri,nationalPhoneNumber',
        },
      });

      if (!detailsResp.ok) {
        const errBody = await detailsResp.text();
        return json({ error: 'Google details failed', details: errBody }, 502);
      }

      const p = await detailsResp.json();
      const normalized = {
        provider,
        externalPlaceId: p.id as string,
        name: (p.displayName?.text as string) || 'Unknown place',
        formattedAddress: (p.formattedAddress as string) || null,
        location: p.location?.latitude && p.location?.longitude
          ? { lat: p.location.latitude as number, lng: p.location.longitude as number }
          : null,
        rating: (p.rating as number) ?? null,
        userRatingsTotal: (p.userRatingCount as number) ?? null,
        priceLevel: toPriceLevel(p.priceLevel),
        businessStatus: (p.businessStatus as string) ?? null,
        googleMapsUrl: (p.googleMapsUri as string) ?? null,
        websiteUrl: (p.websiteUri as string) ?? null,
        detectedMenuUrl: normalizeMenuUrl((p.websiteUri as string) ?? null),
        phone: (p.nationalPhoneNumber as string) ?? null,
      };

      // 3) Upsert cache
      await supabase.from('places_cache').upsert(
        {
          provider,
          external_place_id: normalized.externalPlaceId,
          name: normalized.name,
          formatted_address: normalized.formattedAddress,
          lat: normalized.location?.lat ?? null,
          lng: normalized.location?.lng ?? null,
          rating: normalized.rating,
          user_ratings_total: normalized.userRatingsTotal,
          price_level: normalized.priceLevel,
          business_status: normalized.businessStatus,
          google_maps_url: normalized.googleMapsUrl,
          website_url: normalized.websiteUrl,
          detected_menu_url: normalized.detectedMenuUrl,
          phone: normalized.phone,
          raw: p,
          fetched_at: new Date().toISOString(),
        },
        { onConflict: 'provider,external_place_id' },
      );

      return json({ ...normalized, cached: false });
    }

    return json({ error: 'Not found' }, 404);
  } catch (err) {
    return json({ error: 'Unexpected error', details: String(err) }, 500);
  }
});
