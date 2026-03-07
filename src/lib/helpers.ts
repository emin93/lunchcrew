export const DEFAULT_OPTIONS = ['Tacos', 'Sushi', 'Burgers'];
export const DEVICE_ID_KEY = 'lunchcrew.device_id';
export const ONBOARDING_SEEN_KEY = 'lunchcrew.onboarding_seen';
export const BUILD_LABEL = 'Build qa-v1';

export function generateInviteCode() {
  const part = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `LC-${part()}-${part()}`;
}

export function todayDateUTC() {
  return new Date().toISOString().slice(0, 10);
}

export function makeDeviceId() {
  return `dev_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function extractInviteCode(input: string) {
  const trimmed = (input || '').trim();
  if (!trimmed) return '';
  const upper = trimmed.toUpperCase();
  if (upper.startsWith('LC-')) return upper;

  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();
    const isLunchCrewLink = host.endsWith('lunchcrew.app') || url.protocol === 'lunchcrew:';
    if (!isLunchCrewLink) return '';
    return (url.searchParams.get('code') || '').toUpperCase();
  } catch {
    return '';
  }
}

export function initialsForName(name: string) {
  const cleaned = (name || '').trim();
  if (!cleaned) return '?';
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

export async function withTimeout<T>(promise: PromiseLike<T>, ms = 12000): Promise<T> {
  return (await Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ])) as T;
}
