// Deterministic urine-color calibration — no AI, no unreliable sign flips.
//
// Targets are grounded in Armstrong et al. (1994) urine color scale and
// ACSM/NATA hydration guidelines, mapped to the app's 0–100% scale:
//
//   Clear       → urine osmolality < 200 mOsm/kg  → over-hydrated
//   Pale straw  → 200–400 mOsm/kg                 → optimal (ACSM ideal)
//   Yellow      → 400–600 mOsm/kg                 → adequate (not ideal)
//   Dark yellow → 600–800 mOsm/kg                 → mild dehydration (~1–2% BW loss)
//   Amber       → 800–1000 mOsm/kg                → moderate dehydration (~3–4% BW loss)
//   Orange      → > 1000 mOsm/kg                  → significant dehydration (>5% BW loss)
//   Brown       → extreme concentration / medical  → severe dehydration
//
// Rules:
//   • Dark colors (dark yellow → brown) can only LOWER the level, never raise it.
//   • Maximum swing in either direction: ±30 percentage points.
//     Urine color is a coarse signal — it shouldn't override days of tracking data.

export interface UrineAnalysisResult {
  adjustment: number;   // delta applied to current level (capped ±30)
  newLevel: number;     // resulting level after calibration
  feedback: string;     // 1–2 sentences, actionable
}

interface ColorConfig {
  target: number;  // true hydration % this color maps to
  feedback: string;
  dark: boolean;   // true = only allow downward correction
}

// Maximum swing in either direction (percentage points)
const MAX_SWING = 30;

const COLOR_CALIBRATION: Record<string, ColorConfig> = {
  'Clear': {
    target: 88,
    feedback: 'You may be over-hydrating. Your kidneys are working hard to dilute excess fluid — ease off water for now.',
    dark: false,
  },
  'Pale straw': {
    target: 75,
    feedback: 'Excellent hydration — this is the ACSM\'s ideal urine color. Keep sipping to stay here.',
    dark: false,
  },
  'Yellow': {
    target: 58,
    feedback: 'Adequately hydrated, but there\'s room to improve. Aim for another glass of water in the next hour.',
    dark: false,
  },
  'Dark yellow': {
    target: 40,
    feedback: 'Mild dehydration — about 1–2% body weight in fluid deficit. Drink 12–16 oz of water now.',
    dark: true,
  },
  'Amber': {
    target: 25,
    feedback: 'Moderate dehydration (~3–4% fluid deficit). Drink 20–28 oz of water and avoid caffeine until it clears.',
    dark: true,
  },
  'Orange': {
    target: 12,
    feedback: 'Significant dehydration (>5% fluid deficit). Sip 6–8 oz every 15 minutes and consider an electrolyte drink.',
    dark: true,
  },
  'Brown': {
    target: 4,
    feedback: '⚠️ Severe dehydration. Drink water immediately and seek medical attention if you feel dizzy or confused.',
    dark: true,
  },
};

export async function analyzeUrineColor(
  colorLabel: string,
  currentLevel: number,
): Promise<UrineAnalysisResult> {
  const config = COLOR_CALIBRATION[colorLabel];

  if (!config) {
    return { adjustment: 0, newLevel: currentLevel, feedback: 'Keep tracking your hydration.' };
  }

  let delta = config.target - currentLevel;

  // Dark colors: never increase the level (you picked dark yellow — that's a dehydration signal)
  if (config.dark && delta > 0) {
    delta = 0;
  }

  // Cap the swing — urine color is a coarse signal, not a precise override
  delta = Math.max(-MAX_SWING, Math.min(MAX_SWING, delta));

  const newLevel = Math.max(0, Math.min(100, currentLevel + delta));
  const adjustment = newLevel - currentLevel;

  return {
    adjustment,
    newLevel,
    feedback: config.feedback,
  };
}
