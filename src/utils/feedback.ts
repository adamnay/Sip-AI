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
 * Clean bell ding via Web Audio API.
 * Two sine oscillators at A5 (880 Hz) + E6 (1320 Hz) — a perfect fifth apart.
 * The harmonic fades 3× faster than the fundamental, exactly how a real bell rings.
 * No pitch slide — stays clean and musical throughout.
 */
export function playDing() {
  const ac = getCtx();
  if (!ac) return;

  const now = ac.currentTime;

  // Fundamental: A5 — clear, present, not too sharp
  const osc1 = ac.createOscillator();
  const gain1 = ac.createGain();
  osc1.type = 'sine';
  osc1.frequency.value = 880;
  osc1.connect(gain1);
  gain1.connect(ac.destination);
  gain1.gain.setValueAtTime(0.001, now);
  gain1.gain.linearRampToValueAtTime(0.26, now + 0.006);   // fast attack
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.65); // long smooth tail

  // Harmonic: E6 (perfect fifth above) — adds bell shimmer, fades quickly
  const osc2 = ac.createOscillator();
  const gain2 = ac.createGain();
  osc2.type = 'sine';
  osc2.frequency.value = 1320;
  osc2.connect(gain2);
  gain2.connect(ac.destination);
  gain2.gain.setValueAtTime(0.001, now);
  gain2.gain.linearRampToValueAtTime(0.10, now + 0.004);   // slightly faster attack
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.20); // fades 3× faster

  osc1.start(now); osc1.stop(now + 0.65);
  osc2.start(now); osc2.stop(now + 0.20);
}

/**
 * Soft descending tone for removals — lower pitch, shorter, goes down.
 * Clearly distinct from the add ding so the user knows something was taken away.
 */
export function playRemove() {
  const ac = getCtx();
  if (!ac) return;

  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();

  osc.type = 'sine';
  // Descend from E5 (660 Hz) → A4 (440 Hz) — same notes as ding, octave lower, going down
  osc.frequency.setValueAtTime(660, now);
  osc.frequency.exponentialRampToValueAtTime(440, now + 0.18);

  osc.connect(gain);
  gain.connect(ac.destination);
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.18, now + 0.006);  // fast attack
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28); // short tail

  osc.start(now);
  osc.stop(now + 0.28);
}

/** Trigger both haptic + ding — for adding a drink or activity */
export function feedbackAdd() {
  haptic(9);
  playDing();
}

/** Trigger haptic + descending tone — for removing a drink, activity, or favorite */
export function feedbackRemove() {
  haptic([8, 55, 8]);
  playRemove();
}
