import { supabase } from './supabase';

type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;
function hashDeviceId(input: string) {
  let h = 5381;
  for (let i = 0; i < input.length; i += 1) h = (h * 33) ^ input.charCodeAt(i);
  return `d_${(h >>> 0).toString(16)}`;
}
export async function trackEvent(eventName: string, props: AnalyticsProps = {}, deviceId?: string) {
  if (!supabase) return;
  try {
    await supabase.from('analytics_events').insert({ event_name: eventName, device_hash: deviceId ? hashDeviceId(deviceId) : null, props });
  } catch {}
}
