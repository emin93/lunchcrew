// @ts-nocheck
// Supabase Edge Function: stripe-webhook
// Required secrets:
//   STRIPE_WEBHOOK_SECRET
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function parseStripeSignature(header: string | null) {
  if (!header) return { timestamp: null, signatures: [] as string[] };
  const parts = header.split(',').map((part) => part.trim()).filter(Boolean);
  const timestamp = parts.find((part) => part.startsWith('t='))?.slice(2) || null;
  const signatures = parts.filter((part) => part.startsWith('v1=')).map((part) => part.slice(3));
  return { timestamp, signatures };
}

function hex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function verifyStripeSignature(payload: string, header: string | null, secret: string) {
  const { timestamp, signatures } = parseStripeSignature(header);
  if (!timestamp || signatures.length === 0) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${timestamp}.${payload}`));
  const computed = hex(signature);
  return signatures.some((candidate) => safeEqual(candidate, computed));
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!stripeWebhookSecret || !supabaseUrl || !serviceRoleKey) {
    return json({ error: 'Missing required environment variables' }, 500);
  }

  const rawBody = await req.text();
  const isValid = await verifyStripeSignature(rawBody, req.headers.get('stripe-signature'), stripeWebhookSecret);
  if (!isValid) return json({ error: 'Invalid Stripe signature' }, 401);

  const event = JSON.parse(rawBody);
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data?.object || {};
      const purchaseId = session.metadata?.purchase_id || null;
      const workspaceId = session.metadata?.workspace_id || null;
      if (!purchaseId || !workspaceId) return json({ received: true, ignored: true });

      await supabase
        .from('workspace_purchases')
        .update({
          status: 'paid',
          payment_intent_id: session.payment_intent || null,
          paid_at: new Date().toISOString(),
          metadata: {
            stripe_session_id: session.id,
            amount_total: session.amount_total ?? null,
            customer_email: session.customer_details?.email || session.customer_email || null,
          },
        })
        .eq('id', purchaseId);

      await supabase
        .from('workspaces')
        .update({
          plan: 'founding',
          billing_status: 'active',
          purchase_model: 'one_time',
          pro_enabled: true,
          upgraded_at: new Date().toISOString(),
        })
        .eq('id', workspaceId);
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data?.object || {};
      const purchaseId = session.metadata?.purchase_id || null;
      if (purchaseId) {
        await supabase.from('workspace_purchases').update({ status: 'voided' }).eq('id', purchaseId);
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data?.object || {};
      const purchaseId = paymentIntent.metadata?.purchase_id || null;
      if (purchaseId) {
        await supabase
          .from('workspace_purchases')
          .update({
            status: 'failed',
            payment_intent_id: paymentIntent.id || null,
            metadata: {
              last_payment_error: paymentIntent.last_payment_error?.message || null,
            },
          })
          .eq('id', purchaseId);
      }
    }

    return json({ received: true });
  } catch (error) {
    return json({ error: error?.message || 'Webhook handling failed' }, 500);
  }
});
