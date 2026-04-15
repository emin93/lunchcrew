const MONETIZATION_PROMPT_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;
const MONETIZATION_SESSION_SNOOZE_KEY = 'lunchcrew.monetization_session_snoozed';

function isMonetizationSessionSnoozed() {
  if (typeof window === 'undefined') return false;
  return window.sessionStorage.getItem(MONETIZATION_SESSION_SNOOZE_KEY) === '1';
}

function snoozeMonetizationForSession() {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(MONETIZATION_SESSION_SNOOZE_KEY, '1');
}

export {
  MONETIZATION_PROMPT_COOLDOWN_MS,
  isMonetizationSessionSnoozed,
  snoozeMonetizationForSession,
};
