export interface NotificationPrefs {
  enabled: boolean;
  intervalHours: number; // 0 = off, 1, 2, 4
  thresholdEnabled: boolean;
  thresholdLevel: number; // default 45
}

const NOTIF_PREFS_KEY = 'sip-ai-notif-prefs';
const LAST_INTERVAL_KEY = 'sip-ai-last-interval-notif';
const LAST_THRESHOLD_KEY = 'sip-ai-last-threshold-notif';

export function loadNotifPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(NOTIF_PREFS_KEY);
    if (raw) return { ...defaultPrefs(), ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return defaultPrefs();
}

function defaultPrefs(): NotificationPrefs {
  return { enabled: false, intervalHours: 2, thresholdEnabled: true, thresholdLevel: 45 };
}

export function saveNotifPrefs(prefs: NotificationPrefs) {
  try { localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(prefs)); } catch { /* ignore */ }
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

export function getPermissionState(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export async function fireNotification(title: string, body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      reg.showNotification(title, {
        body,
        icon: '/icon.png',
        badge: '/icon.png',
        tag: 'sip-ai-reminder',
      } as NotificationOptions);
    } else {
      new Notification(title, { body, icon: '/icon.png' });
    }
  } catch {
    try { new Notification(title, { body, icon: '/icon.png' }); } catch { /* ignore */ }
  }
}

export function checkIntervalNotification(prefs: NotificationPrefs): boolean {
  if (!prefs.enabled || prefs.intervalHours === 0) return false;
  const lastMs = parseInt(localStorage.getItem(LAST_INTERVAL_KEY) || '0', 10);
  const elapsed = Date.now() - lastMs;
  const required = prefs.intervalHours * 60 * 60 * 1000;
  if (elapsed >= required) {
    localStorage.setItem(LAST_INTERVAL_KEY, String(Date.now()));
    return true;
  }
  return false;
}

export function checkThresholdNotification(prefs: NotificationPrefs, level: number): boolean {
  if (!prefs.enabled || !prefs.thresholdEnabled) return false;
  if (level >= prefs.thresholdLevel) return false;
  // Don't re-fire within 30 minutes
  const lastMs = parseInt(localStorage.getItem(LAST_THRESHOLD_KEY) || '0', 10);
  const elapsed = Date.now() - lastMs;
  if (elapsed < 30 * 60 * 1000) return false;
  localStorage.setItem(LAST_THRESHOLD_KEY, String(Date.now()));
  return true;
}

export function getIntervalMessage(level: number): string {
  if (level >= 80) return `You're well hydrated at ${level}% — great work! 💧`;
  if (level >= 60) return `Hydration check-in! You're at ${level}%. Keep it up.`;
  if (level >= 40) return `Sip time! You're at ${level}%. Grab some water.`;
  return `Low hydration alert — you're at ${level}%. Drink up now! 💧`;
}

export function getThresholdMessage(level: number): string {
  if (level < 30) return `Heads up! Hydration is low at ${level}%. Drink 16+ oz right away.`;
  return `Hydration dropped to ${level}%. Time to drink some water! 💧`;
}
