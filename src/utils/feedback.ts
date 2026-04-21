import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

// ─── Haptics ─────────────────────────────────────────────────────────────────
// Uses Capacitor Haptics in native apps (works on iOS + Android).
// Falls back to navigator.vibrate on web.

async function nativeHaptic(style: ImpactStyle) {
  try {
    await Haptics.impact({ style });
  } catch {
    // Not in native context — fall back to vibration API (Android web / desktop)
    try { navigator.vibrate?.(8); } catch { /* ignore */ }
  }
}

async function nativeNotificationHaptic(type: NotificationType) {
  try {
    await Haptics.notification({ type });
  } catch {
    try { navigator.vibrate?.([8, 55, 8]); } catch { /* ignore */ }
  }
}

// ─── Audio ────────────────────────────────────────────────────────────────────
// Singleton AudioContext — reused across all sounds
let _ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!_ctx) {
      _ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (_ctx.state === 'suspended') void _ctx.resume();
    return _ctx;
  } catch {
    return null;
  }
}

/**
 * Clean bell ding via Web Audio API.
 * Two sine oscillators at A5 (880 Hz) + E6 (1320 Hz) — a perfect fifth apart.
 * The harmonic fades 3× faster than the fundamental, exactly how a real bell rings.
 */
export function playDing() {
  const ac = getCtx();
  if (!ac) return;

  const now = ac.currentTime;

  // Fundamental: A5
  const osc1 = ac.createOscillator();
  const gain1 = ac.createGain();
  osc1.type = 'sine';
  osc1.frequency.value = 880;
  osc1.connect(gain1);
  gain1.connect(ac.destination);
  gain1.gain.setValueAtTime(0.001, now);
  gain1.gain.linearRampToValueAtTime(0.26, now + 0.006);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

  // Harmonic: E6 (perfect fifth above)
  const osc2 = ac.createOscillator();
  const gain2 = ac.createGain();
  osc2.type = 'sine';
  osc2.frequency.value = 1320;
  osc2.connect(gain2);
  gain2.connect(ac.destination);
  gain2.gain.setValueAtTime(0.001, now);
  gain2.gain.linearRampToValueAtTime(0.10, now + 0.004);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.20);

  osc1.start(now); osc1.stop(now + 0.65);
  osc2.start(now); osc2.stop(now + 0.20);
}

/**
 * Soft rejection thud — two quick low "dun-dun" pulses.
 */
export function playRemove() {
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;

  const hit = (startTime: number, freq: number) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ac.destination);
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.14, startTime + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.10);
    osc.start(startTime);
    osc.stop(startTime + 0.10);
  };

  hit(now,        330);
  hit(now + 0.11, 220);
}

// ─── Combined feedback ────────────────────────────────────────────────────────

/** Haptic + ding — for adding a drink or activity */
export function feedbackAdd() {
  void nativeHaptic(ImpactStyle.Medium);
  playDing();
}

/** Haptic + thud — for removing a drink, activity, or favorite */
export function feedbackRemove() {
  void nativeNotificationHaptic(NotificationType.Warning);
  playRemove();
}
