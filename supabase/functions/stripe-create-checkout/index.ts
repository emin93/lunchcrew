// @ts-nocheck
// Supabase Edge Function: stripe-create-checkout
// Required secrets:
//   STRIPE_SECRET_KEY
//   LUNCHCREW_BASE_URL
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST,OPTIONS',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
};

const FOUNDING_PRICE_CENTS = 2900;
const FOUNDING_CURRENCY = 'usd';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
    },
  });
}

function getBearerToken(req: Request) {
  const header = req.headers.get('authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
}

function toFormBody(values: Record<string, string | number | null | undefined>) {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value === null || value === undefined || value === '') continue;
    body.set(key, String(value));
  }
  return body;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
  const baseUrl = (Deno.env.get('LUNCHCREW_BASE_URL') || '').replace(/\/+$/, '');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!stripeSecretKey || !baseUrl || !supabaseUrl || !serviceRoleKey) {
    return json({ error: 'Missing required environment variables' }, 500);
  }

  const token = getBearerToken(req);
  if (!token) return json({ error: 'Missing bearer token' }, 401);

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData.user) return json({ error: 'Unauthorized' }, 401);

  const user = authData.user;
  const body = await req.json().catch(() => ({}));
  const workspaceId = String(body?.workspaceId || '').trim();
  if (!workspaceId) return json({ error: 'workspaceId is required' }, 400);

  const { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .select('id,name,invite_code,plan,pro_enabled')
    .eq('id', workspaceId)
    .single();
  if (workspaceError || !workspace) return json({ error: 'Workspace not found' }, 404);

  if (workspace.pro_enabled || workspace.plan === 'founding') {
    return json({ alreadyUnlocked: true });
  }

  const { data: role, error: roleError } = await supabase
    .from('workspace_roles')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (roleError) return json({ error: roleError.message || 'Could not verify ownership' }, 500);
  if (!role || role.role !== 'owner') return json({ error: 'Only the crew owner can upgrade this crew.' }, 403);

  const { data: purchase, error: purchaseError } = await supabase
    .from('workspace_purchases')
    .insert({
      workspace_id: workspaceId,
      user_id: user.id,
      provider: 'stripe',
      purchase_type: 'founding_crew',
      status: 'pending',
      access_scope: 'crew',
      amount_cents: FOUNDING_PRICE_CENTS,
      currency: FOUNDING_CURRENCY,
      metadata: {
        invite_code: workspace.invite_code,
        workspace_name: workspace.name,
        owner_email: user.email || null,
      },
    })
    .select('id')
    .single();
  if (purchaseError || !purchase) return json({ error: purchaseError?.message || 'Could not create purchase record' }, 500);

  const successUrl = `${baseUrl}/${encodeURIComponent(workspace.invite_code)}/crew?checkout=success`;
  const cancelUrl = `${baseUrl}/${encodeURIComponent(workspace.invite_code)}/crew?checkout=cancelled`;

  const stripeBody = toFormBody({
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: 'true',
    customer_email: user.email || '',
    client_reference_id: workspace.id,
    'metadata[workspace_id]': workspace.id,
    'metadata[user_id]': user.id,
    'metadata[purchase_id]': purchase.id,
    'payment_intent_data[metadata][workspace_id]': workspace.id,
    'payment_intent_data[metadata][user_id]': user.id,
    'payment_intent_data[metadata][purchase_id]': purchase.id,
    'line_items[0][quantity]': 1,
    'line_items[0][price_data][currency]': FOUNDING_CURRENCY,
    'line_items[0][price_data][unit_amount]': FOUNDING_PRICE_CENTS,
    'line_items[0][price_data][product_data][name]': 'LunchCrew Founding Crew Access',
    'line_items[0][price_data][product_data][description]': `One-time upgrade for crew ${workspace.name}`,
  });

  const stripeResp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${stripeSecretKey}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: stripeBody.toString(),
  });
  const stripePayload = await stripeResp.json().catch(() => ({}));

  if (!stripeResp.ok || !stripePayload?.url || !stripePayload?.id) {
    await supabase.from('workspace_purchases').update({ status: 'failed' }).eq('id', purchase.id);
    return json({ error: stripePayload?.error?.message || 'Stripe checkout session creation failed', details: stripePayload }, 502);
  }

  await supabase
    .from('workspace_purchases')
    .update({ checkout_session_id: stripePayload.id })
    .eq('id', purchase.id);

  return json({ url: stripePayload.url, checkoutSessionId: stripePayload.id });
});
