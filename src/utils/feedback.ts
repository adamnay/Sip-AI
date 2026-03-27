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
 * Vibration haptic — works on Android Chrome; silently skipped on iOS.
 * pattern: ms on, or [ms on, ms off, ms on, ...]
 */
export function haptic(pattern: number | number[] = 8) {
  try {
    if ('vibrate' in navigator) navigator.vibrate(pattern);
  } catch { /* ignore */ }
}

/**
 * Synthesized water-drop ding via Web Audio API.
 * Starts on C6 (1047 Hz), slides down to F5 (698 Hz) over 100ms,
 * then decays to silence in ~400ms total.
 */
export function playDing() {
  const ac = getCtx();
  if (!ac) return;

  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();

  osc.connect(gain);
  gain.connect(ac.destination);

  // Pitch slide: C6 → F5 (gives a satisfying "bloop" drop)
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1047, now);
  osc.frequency.exponentialRampToValueAtTime(698, now + 0.1);

  // Amplitude: instant attack, smooth exponential decay
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.22, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

  osc.start(now);
  osc.stop(now + 0.42);
}

/** Trigger both haptic + ding — for adding a drink or activity */
export function feedbackAdd() {
  haptic(9);
  playDing();
}

/** Trigger haptic only — for removing a drink, activity, or favorite */
export function feedbackRemove() {
  haptic([8, 55, 8]);
}
