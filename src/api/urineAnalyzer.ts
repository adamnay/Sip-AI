// Deterministic urine-color calibration — no AI, no unreliable sign flips.
//
// Each color maps to a scientifically grounded "true hydration %" target.
// For DARK colors (dark yellow → brown) we only allow DOWNWARD correction:
//   if the app already shows a level ≤ the target, we do nothing (0).
//   This ensures selecting "dark yellow" can never add hydration.
// For LIGHT colors (yellow and paler) we allow both directions — you may
//   have drunk water the app hasn't tracked.

export interface UrineAnalysisResult {
  adjustment: number;   // delta applied to current level (clamped)
  newLevel: number;     // resulting level after calibration
  feedback: string;     // 1–2 sentences, actionable
}

interface ColorConfig {
  target: number;
  feedback: string;
  dark: boolean; // true = only allow downward correction
}

const COLOR_CALIBRATION: Record<string, ColorConfig> = {
  'Clear': {
    target: 95,
    feedback: 'You may be slightly over-hydrated — your fluid intake is excellent. Ease off water for now and let your kidneys catch up.',
    dark: false,
  },
  'Pale straw': {
    target: 82,
    feedback: 'Perfect hydration — you\'re hitting the sweet spot. Keep sipping throughout the day to stay here.',
    dark: false,
  },
  'Yellow': {
    target: 68,
    feedback: 'Good hydration. You\'re in a healthy range. Keep drinking water steadily through the day.',
    dark: false,
  },
  'Dark yellow': {
    target: 50,
    feedback: 'Your body needs more fluids. Aim to drink 16–20 oz of water in the next 30 minutes.',
    dark: true,
  },
  'Amber': {
    target: 35,
    feedback: 'You\'re noticeably dehydrated. Drink 24–32 oz of water now and avoid caffeine and alcohol until your color improves.',
    dark: true,
  },
  'Orange': {
    target: 18,
    feedback: 'Significantly dehydrated. Drink water steadily — about 8 oz every 15 minutes. Adding an electrolyte drink will help.',
    dark: true,
  },
  'Brown': {
    target: 7,
    feedback: '⚠️ Severely dehydrated. Drink water immediately. If you feel dizzy, lightheaded, or confused, seek medical attention.',
    dark: true,
  },
};

export async function analyzeUrineColor(
  colorLabel: string,
  currentLevel: number,
): Promise<UrineAnalysisResult> {
  const config = COLOR_CALIBRATION[colorLabel];

  if (!config) {
    // Unknown label — no change
    return { adjustment: 0, newLevel: currentLevel, feedback: 'Keep tracking your hydration.' };
  }

  let delta = config.target - currentLevel;

  // Dark colors: never increase the level (that would be misleading)
  if (config.dark && delta > 0) {
    delta = 0;
  }

  const newLevel = Math.max(0, Math.min(100, currentLevel + delta));
  const adjustment = newLevel - currentLevel; // recalc after clamping

  return {
    adjustment,
    newLevel,
    feedback: config.feedback,
  };
}
