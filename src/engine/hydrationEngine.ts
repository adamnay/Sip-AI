export type DrinkType =
  | 'water'
  | 'coffee'
  | 'electrolyte'
  | 'energy_drink'
  | 'juice'
  | 'soda'
  | 'tea'
  | 'alcohol'
  | 'smoothie'
  | 'unknown';

export interface DrinkEntry {
  id: string;
  timestamp: number;
  type: DrinkType;
  volume_ml: number;
  hydrationDelta: number;
  caffeineMg: number;
  label: string;
  emoji: string;
  feedback: string;
  scanThumbnail?: string; // small base64 JPEG from image scan
}

export interface UserProfile {
  name: string;
  email: string;
  age: number | null;
  heightFt: number | null;
  heightIn: number | null;
  weightLbs: number | null;
}

export interface DailyRecord {
  date: string;          // YYYY-MM-DD
  closingLevel: number;  // level at end of day
  drinkCount: number;
  peakLevel: number;
}

export interface ActivityEntry {
  id: string;
  label: string;
  durationMin: number;
  hydrationDelta: number;
  timestamp: number;
}

export interface HydrationState {
  level: number;
  lastUpdate: number;
  activeCaffeineMg: number;
  caffeineActivatedAt: number;
  hasRecentElectrolytes: boolean;
  electrolytesActivatedAt: number;
  drinkLog: DrinkEntry[];
  activityLog: ActivityEntry[];
  hangoverMode: boolean;
  hangoverActivatedAt: number;
  streak: number;
  bestStreak: number;
  lastActiveDate: string; // 'YYYY-MM-DD'
  alcoholDecayActive: boolean;
  alcoholActivatedAt: number;
  userProfile: UserProfile;
  dailyHistory: DailyRecord[];
  onboardingAnswers: Record<string, string> | null;
  customDailyTargetOz: number | null;
  profileSummary: string;
  favorites: FavoriteDrink[];
}

export interface DrinkOverrides {
  hydrationPerMl?: number;
  caffeinePer100ml?: number;
  electrolyte?: boolean;
  label?: string;
  scanThumbnail?: string;
  alcoholDecayBoost?: boolean;
}

export interface FavoriteDrink {
  id: string;
  label: string;
  type: DrinkType;
  volume_ml: number;
  overrides: DrinkOverrides;
  scanThumbnail?: string;
}

interface DrinkProfile {
  hydrationPerMl: number;
  caffeinePer100ml: number;
  electrolyte: boolean;
  emoji: string;
  label: string;
}

export const DRINK_PROFILES: Record<DrinkType, DrinkProfile> = {
  water:        { hydrationPerMl: 0.034, caffeinePer100ml: 0,  electrolyte: false, emoji: '💧', label: 'Water' },
  coffee:       { hydrationPerMl: 0.010, caffeinePer100ml: 40, electrolyte: false, emoji: '☕', label: 'Coffee' },
  electrolyte:  { hydrationPerMl: 0.050, caffeinePer100ml: 0,  electrolyte: true,  emoji: '⚡', label: 'Electrolytes' },
  energy_drink: { hydrationPerMl: 0.006, caffeinePer100ml: 32, electrolyte: false, emoji: '🔋', label: 'Energy Drink' },
  juice:        { hydrationPerMl: 0.028, caffeinePer100ml: 0,  electrolyte: false, emoji: '🍊', label: 'Juice' },
  soda:         { hydrationPerMl: 0.014, caffeinePer100ml: 12, electrolyte: false, emoji: '🥤', label: 'Soda' },
  tea:          { hydrationPerMl: 0.026, caffeinePer100ml: 15, electrolyte: false, emoji: '🍵', label: 'Tea' },
  alcohol:      { hydrationPerMl: -0.020, caffeinePer100ml: 0, electrolyte: false, emoji: '🍺', label: 'Alcohol' },
  smoothie:     { hydrationPerMl: 0.024, caffeinePer100ml: 0,  electrolyte: true,  emoji: '🥤', label: 'Smoothie' },
  unknown:      { hydrationPerMl: 0.022, caffeinePer100ml: 0,  electrolyte: false, emoji: '🥛', label: 'Drink' },
};

// Default volumes in ml for quick-add
export const DEFAULT_VOLUMES: Record<DrinkType, number> = {
  water:        355,  // 12oz
  coffee:       240,  // 8oz
  electrolyte:  500,  // 16oz sports drink
  energy_drink: 355,  // 12oz can
  juice:        240,  // 8oz
  soda:         355,  // 12oz can
  tea:          240,  // 8oz
  alcohol:      355,  // 12oz beer equiv
  smoothie:     480,  // 16oz
  unknown:      240,  // 8oz
};

function getTodayDateString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function defaultUserProfile(): UserProfile {
  return { name: '', email: '', age: null, heightFt: null, heightIn: null, weightLbs: null };
}

export function createInitialState(): HydrationState {
  return {
    level: 72,
    lastUpdate: Date.now(),
    activeCaffeineMg: 0,
    caffeineActivatedAt: Date.now(),
    hasRecentElectrolytes: false,
    electrolytesActivatedAt: 0,
    drinkLog: [],
    activityLog: [],
    hangoverMode: false,
    hangoverActivatedAt: 0,
    streak: 0,
    bestStreak: 0,
    lastActiveDate: '',
    alcoholDecayActive: false,
    alcoholActivatedAt: 0,
    userProfile: defaultUserProfile(),
    dailyHistory: [],
    onboardingAnswers: null,
    customDailyTargetOz: null,
    profileSummary: '',
    favorites: [],
  };
}

/** Returns how much to scale the decay rate based on body weight & age */
export function getProfileDecayModifier(profile: UserProfile): number {
  let modifier = 1.0;
  if (profile.weightLbs) {
    // Heavier body needs proportionally more water → faster decay if not drinking
    modifier *= Math.max(0.70, Math.min(1.55, profile.weightLbs / 155));
  }
  if (profile.age) {
    if (profile.age >= 60) modifier += 0.20;
    else if (profile.age >= 45) modifier += 0.10;
  }
  return modifier;
}

/** Daily water target in oz based on profile */
export function getDailyTargetOz(profile: UserProfile): number {
  const weight = profile.weightLbs ?? 155;
  return Math.round(weight * 0.55);
}

/** Migrate old state that may be missing new fields */
function migrateState(state: Partial<HydrationState>): HydrationState {
  const initial = createInitialState();
  return {
    ...initial,
    ...state,
    hangoverMode: state.hangoverMode ?? false,
    hangoverActivatedAt: state.hangoverActivatedAt ?? 0,
    streak: state.streak ?? 0,
    bestStreak: state.bestStreak ?? state.streak ?? 0,
    lastActiveDate: state.lastActiveDate ?? '',
    alcoholDecayActive: state.alcoholDecayActive ?? false,
    alcoholActivatedAt: state.alcoholActivatedAt ?? 0,
    userProfile: { ...defaultUserProfile(), ...(state.userProfile ?? {}) },
    dailyHistory: state.dailyHistory ?? [],
    activityLog: state.activityLog ?? [],
    onboardingAnswers: state.onboardingAnswers ?? null,
    customDailyTargetOz: state.customDailyTargetOz ?? null,
    profileSummary: state.profileSummary ?? '',
    favorites: state.favorites ?? [],
  };
}

/** Compute daily target oz from questionnaire answers */
export function computeDailyTargetFromAnswers(
  answers: Record<string, string>,
  weightLbs: number
): number {
  let target = weightLbs * 0.55;

  const activityMods: Record<string, number> = {
    'Mostly sedentary': 0.88,
    'Light exercise': 0.95,
    'Moderately active': 1.05,
    'Very active': 1.18,
    'Athlete level': 1.30,
  };
  target *= (activityMods[answers.activityLevel] ?? 1.0);

  if (answers.goal === 'Athletic performance') target *= 1.08;
  else if (answers.goal === 'Skin & glow') target *= 1.05;

  if (answers.caffeine === '4+ cups/day') target += 10;
  else if (answers.caffeine === '2–3 cups/day') target += 5;

  if (answers.alcohol === 'Daily') target += 10;
  else if (answers.alcohol === 'A few times/week') target += 5;

  return Math.round(Math.max(48, Math.min(220, target)));
}

export function loadAndMigrateState(raw: string): HydrationState {
  const parsed = JSON.parse(raw) as Partial<HydrationState>;
  return migrateState(parsed);
}

/** Apply passive time-based decay to hydration level */
export function applyTimeDecay(state: HydrationState): HydrationState {
  const now = Date.now();
  const hoursElapsed = (now - state.lastUpdate) / 3_600_000;

  if (hoursElapsed < 0.001) return state; // under ~3 seconds, skip

  // Base decay: ~3% per hour, scaled by body weight / age
  const profileModifier = getProfileDecayModifier(state.userProfile);
  let decayRatePerHour = 3.0 * profileModifier;

  // Caffeine half-life ~5 hours; recalculate active caffeine
  const caffeineAgeHours = (now - state.caffeineActivatedAt) / 3_600_000;
  const currentCaffeineMg = state.activeCaffeineMg * Math.pow(0.5, caffeineAgeHours / 5);

  // Caffeine above threshold increases decay rate (diuretic effect)
  if (currentCaffeineMg > 80) {
    const excessCaffeine = currentCaffeineMg - 80;
    decayRatePerHour += Math.min(excessCaffeine / 100, 1.5);
  }

  // Electrolytes reduce decay slightly while active (< 4 hours)
  const electrolytesAgeHours = (now - state.electrolytesActivatedAt) / 3_600_000;
  const hasRecentElectrolytes = state.hasRecentElectrolytes && electrolytesAgeHours < 4;
  if (hasRecentElectrolytes) {
    decayRatePerHour -= 0.4;
  }

  // Alcohol penalty: within 6 hours, add +0.8 to decayRatePerHour
  let alcoholDecayActive = state.alcoholDecayActive;
  if (alcoholDecayActive) {
    const alcoholAgeHours = (now - state.alcoholActivatedAt) / 3_600_000;
    if (alcoholAgeHours < 6) {
      decayRatePerHour += 0.8;
    } else {
      // After 6 hours, clear alcohol decay
      alcoholDecayActive = false;
    }
  }

  // Hangover mode: multiply decay rate by 1.5
  if (state.hangoverMode) {
    decayRatePerHour *= 1.5;
  }

  const decayAmount = decayRatePerHour * hoursElapsed;
  const newLevel = Math.max(0, Math.min(100, state.level - decayAmount));

  return {
    ...state,
    level: newLevel,
    lastUpdate: now,
    activeCaffeineMg: currentCaffeineMg,
    hasRecentElectrolytes,
    alcoholDecayActive,
  };
}

/** Update streak + archive daily history when a new day begins */
export function updateStreak(state: HydrationState): HydrationState {
  const today = getTodayDateString();
  if (state.lastActiveDate === today) return state;

  const todayDate = new Date(today);
  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split('T')[0];

  let newStreak: number;
  if (state.lastActiveDate === yesterday) {
    newStreak = state.streak + 1;
  } else {
    newStreak = 1;
  }

  const newBestStreak = Math.max(state.bestStreak ?? 0, newStreak);

  // Archive yesterday's data into dailyHistory
  let dailyHistory = state.dailyHistory ?? [];
  if (state.lastActiveDate && !dailyHistory.find(r => r.date === state.lastActiveDate)) {
    const todayDrinks = state.drinkLog.filter(e => {
      const d = new Date(e.timestamp);
      const dStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      return dStr === state.lastActiveDate;
    });
    const record: DailyRecord = {
      date: state.lastActiveDate,
      closingLevel: Math.round(state.level),
      drinkCount: todayDrinks.length,
      peakLevel: Math.round(Math.max(...todayDrinks.map(e => e.hydrationDelta), 0) + state.level),
    };
    dailyHistory = [record, ...dailyHistory].slice(0, 14);
  }

  return { ...state, streak: newStreak, bestStreak: newBestStreak, lastActiveDate: today, dailyHistory };
}

/** Save user profile and return updated state */
export function saveUserProfile(state: HydrationState, profile: UserProfile): HydrationState {
  return { ...state, userProfile: profile };
}

/** Add a drink and return the updated state + log entry */
export function addDrink(
  state: HydrationState,
  type: DrinkType,
  volume_ml: number,
  overrides?: DrinkOverrides
): { newState: HydrationState; entry: DrinkEntry } {
  const now = Date.now();
  const profile = DRINK_PROFILES[type];

  // Apply overrides on top of profile values
  const effectiveHydrationPerMl = overrides?.hydrationPerMl ?? profile.hydrationPerMl;
  const effectiveCaffeinePer100ml = overrides?.caffeinePer100ml ?? profile.caffeinePer100ml;
  const effectiveElectrolyte = overrides?.electrolyte ?? profile.electrolyte;
  const effectiveLabel = overrides?.label ?? profile.label;

  // Electrolyte efficiency multiplier on water absorption
  let efficiency = 1.0;
  if (state.hasRecentElectrolytes && (type === 'water' || type === 'juice')) {
    efficiency = 1.35;
  }

  const hydrationDelta = Math.round((effectiveHydrationPerMl * volume_ml * efficiency) * 10) / 10;
  const caffeineMg = (effectiveCaffeinePer100ml / 100) * volume_ml;

  const newLevel = Math.max(0, Math.min(100, state.level + hydrationDelta));

  const feedback = buildFeedback(state, type, hydrationDelta, caffeineMg, newLevel, efficiency, overrides);

  const entry: DrinkEntry = {
    id: Math.random().toString(36).slice(2),
    timestamp: now,
    type,
    volume_ml,
    hydrationDelta,
    caffeineMg,
    label: effectiveLabel,
    emoji: profile.emoji,
    feedback,
    ...(overrides?.scanThumbnail ? { scanThumbnail: overrides.scanThumbnail } : {}),
  };

  // Determine if alcohol decay should activate
  const isAlcohol = type === 'alcohol' || overrides?.alcoholDecayBoost === true;
  const newAlcoholDecayActive = isAlcohol ? true : state.alcoholDecayActive;
  const newAlcoholActivatedAt = isAlcohol ? now : state.alcoholActivatedAt;

  const stateAfterStreak = updateStreak(state);

  const newState: HydrationState = {
    ...stateAfterStreak,
    level: newLevel,
    lastUpdate: now,
    activeCaffeineMg: stateAfterStreak.activeCaffeineMg + caffeineMg,
    caffeineActivatedAt: caffeineMg > 0 ? now : stateAfterStreak.caffeineActivatedAt,
    hasRecentElectrolytes: effectiveElectrolyte ? true : stateAfterStreak.hasRecentElectrolytes,
    electrolytesActivatedAt: effectiveElectrolyte ? now : stateAfterStreak.electrolytesActivatedAt,
    drinkLog: [entry, ...stateAfterStreak.drinkLog].slice(0, 30),
    alcoholDecayActive: newAlcoholDecayActive,
    alcoholActivatedAt: newAlcoholActivatedAt,
  };

  return { newState, entry };
}

function buildFeedback(
  state: HydrationState,
  type: DrinkType,
  delta: number,
  caffeineMg: number,
  newLevel: number,
  efficiency: number,
  overrides?: DrinkOverrides
): string {
  const label = overrides?.label ?? DRINK_PROFILES[type].label;

  if (type === 'alcohol') {
    return "Alcohol is dehydrating you — drink a glass of water";
  }

  if (type === 'coffee' || type === 'energy_drink') {
    const caffeineImpact = caffeineMg > 100 ? 'sped up your drain by ~20%' : 'sped up your drain by ~12%';
    if (state.level < 45) return `Caffeine is already dehydrating you faster — drink water soon`;
    return `${label} gave you a small boost, but ${caffeineImpact}`;
  }

  if (type === 'tea' && caffeineMg > 0) {
    if (state.level < 45) return `${label} has caffeine — drink water to compensate`;
    return `${label} is hydrating but has some caffeine`;
  }

  if (type === 'electrolyte') {
    const boost = Math.round(delta * 10) / 10;
    return `Electrolytes active — your next water absorbs 35% better (+${boost}% now)`;
  }

  if (efficiency > 1.0 && type === 'water') {
    const bonusPct = Math.round((efficiency - 1) * 100);
    return `Electrolytes helped you absorb ${bonusPct}% more from that water`;
  }

  if (newLevel >= 85) return "You're at optimal hydration";
  if (newLevel < 30) return "Still critical — keep drinking now";
  if (newLevel < 50) return "Still low — keep it up";

  const deltaDisplay = delta > 0 ? `+${delta.toFixed(0)}%` : `${delta.toFixed(0)}%`;
  if (delta >= 10) return `Big boost — you're back up ${deltaDisplay}`;

  return `You're at ${newLevel.toFixed(0)}% — ${newLevel >= 70 ? 'looking good' : 'keep going'}`;
}

export function getStatusText(level: number): string {
  if (level >= 85) return 'Optimal';
  if (level >= 70) return 'Good';
  if (level >= 50) return 'Low';
  if (level >= 30) return 'Very Low';
  return 'Critical';
}

export function getStatusColor(level: number): string {
  if (level >= 85) return '#06b6d4';
  if (level >= 70) return '#22c55e';
  if (level >= 50) return '#eab308';
  if (level >= 30) return '#f97316';
  return '#ef4444';
}

export function getSmartSuggestion(state: HydrationState): string {
  const { level, activeCaffeineMg, hasRecentElectrolytes, hangoverMode } = state;

  if (hangoverMode) {
    if (level < 40) return "Hangover recovery: drink electrolytes and water immediately";
    if (level < 60) return "Keep hydrating — electrolytes will speed up hangover recovery";
    return "Hydration looking better — rest and keep sipping water";
  }

  if (activeCaffeineMg > 200 && level < 60) {
    return "Skip caffeine — drink water or electrolytes instead";
  }
  if (activeCaffeineMg > 150) {
    return "Caffeine is offsetting your hydration — drink water now";
  }
  if (!hasRecentElectrolytes && level < 45) {
    return "Water isn't enough right now — you need electrolytes";
  }
  if (level < 40) {
    const oz = Math.ceil((55 - level) / 3.4);
    return `Drink ${oz}oz now to get back to optimal`;
  }
  if (level >= 85) {
    return "Hydration optimal — small sips throughout the day";
  }
  if (level >= 70) {
    return "Stay consistent — a sip every 20 minutes";
  }
  return "Steady hydration beats drinking a lot at once";
}

/** Remove a drink from the log and reverse its effect on hydration */
export function removeDrink(
  state: HydrationState,
  entryId: string
): HydrationState {
  const entry = state.drinkLog.find((e) => e.id === entryId);
  if (!entry) return state;

  const newLevel = Math.max(0, Math.min(100, state.level - entry.hydrationDelta));
  const newCaffeine = Math.max(0, state.activeCaffeineMg - entry.caffeineMg);

  return {
    ...state,
    level: newLevel,
    activeCaffeineMg: newCaffeine,
    drinkLog: state.drinkLog.filter((e) => e.id !== entryId),
  };
}

export function removeActivity(
  state: HydrationState,
  entryId: string
): HydrationState {
  const entry = (state.activityLog ?? []).find((e) => e.id === entryId);
  if (!entry) return state;
  const newLevel = Math.max(0, Math.min(100, state.level - entry.hydrationDelta));
  return {
    ...state,
    level: newLevel,
    activityLog: (state.activityLog ?? []).filter((e) => e.id !== entryId),
  };
}

export function addFavorite(
  state: HydrationState,
  entry: DrinkEntry
): HydrationState {
  const already = (state.favorites ?? []).some(f => f.id === entry.id);
  if (already) return state;
  const fav: FavoriteDrink = {
    id: entry.id,
    label: entry.label,
    type: entry.type,
    volume_ml: entry.volume_ml,
    overrides: {},
    scanThumbnail: entry.scanThumbnail,
  };
  return { ...state, favorites: [fav, ...(state.favorites ?? [])].slice(0, 12) };
}

export function removeFavorite(
  state: HydrationState,
  favId: string
): HydrationState {
  return { ...state, favorites: (state.favorites ?? []).filter(f => f.id !== favId) };
}

export function getWasteInsight(drinkLog: DrinkEntry[]): string | null {
  if (drinkLog.length < 2) return null;

  const recent = drinkLog.slice(0, 3);
  const totalVolume = recent.reduce((sum, d) => sum + d.volume_ml, 0);
  const timeSpanMs = recent[0].timestamp - recent[recent.length - 1].timestamp;
  const timeSpanMin = timeSpanMs / 60_000;

  // If 3 drinks logged within 10 minutes totaling > 700ml
  if (recent.length >= 3 && timeSpanMin < 10 && totalVolume > 700) {
    return "Spacing this out would hydrate you better — your body can only absorb ~30oz/hour";
  }

  return null;
}

/** Activate hangover mode — caps level at 42 and increases decay */
export function activateHangoverMode(state: HydrationState): HydrationState {
  return {
    ...state,
    hangoverMode: true,
    level: Math.min(state.level, 40),
    hangoverActivatedAt: Date.now(),
  };
}

/** Deactivate hangover mode */
export function deactivateHangoverMode(state: HydrationState): HydrationState {
  return {
    ...state,
    hangoverMode: false,
  };
}

// ─── Activity tracking ──────────────────────────────────────────────────────

export interface ActivityResult {
  activityType: string;
  durationMin: number;
  sweatLossML: number;
  hydrationDelta: number;
  feedback: string;
}

const SWEAT_RATES: Record<string, number> = {
  run: 900,
  jog: 900,
  swim: 500,
  cycle: 700,
  bike: 700,
  cycling: 700,
  biking: 700,
  hiit: 1100,
  crossfit: 1100,
  gym: 500,
  lift: 500,
  weight: 500,
  weights: 500,
  yoga: 300,
  pilates: 300,
  hike: 600,
  hiking: 600,
  walk: 300,
  walking: 300,
  basketball: 800,
  soccer: 800,
  tennis: 800,
  sport: 800,
  sports: 800,
  dance: 400,
  dancing: 400,
  workout: 600,
  exercise: 600,
  train: 600,
  training: 600,
};

export function parseActivity(text: string): ActivityResult | null {
  const lower = text.toLowerCase();

  // Detect activity type
  let detectedType: string | null = null;
  let sweatRate = 0;

  for (const [keyword, rate] of Object.entries(SWEAT_RATES)) {
    if (lower.includes(keyword)) {
      detectedType = keyword;
      sweatRate = rate;
      break;
    }
  }

  if (!detectedType) return null;

  // Heat modifier
  const heatPattern = /hot|heat|sun|outside|outdoor|humid|summer/;
  if (heatPattern.test(lower)) {
    sweatRate *= 1.25;
  }

  // Parse duration
  let durationMin = 30; // default

  // Match "half hour"
  if (/half.?hour/i.test(lower)) {
    durationMin = 30;
  }
  // Match "an hour" or "1 hour"
  else if (/\ban\s+hour\b/i.test(lower)) {
    durationMin = 60;
  }
  else {
    // Match hours: e.g. "1.5 hours", "2hr", "1h"
    const hourMatch = lower.match(/(\d+(?:\.\d+)?)\s*h(?:our|r)?s?/);
    if (hourMatch) {
      durationMin = parseFloat(hourMatch[1]) * 60;
    } else {
      // Match minutes: e.g. "45 min", "30 minutes", "30m"
      const minMatch = lower.match(/(\d+)\s*m(?:in(?:ute)?s?)?/);
      if (minMatch) {
        durationMin = parseInt(minMatch[1], 10);
      }
    }
  }

  const sweatLossML = (sweatRate / 60) * durationMin;
  const hydrationDelta = Math.round(-(sweatLossML * 0.034) * 10) / 10;

  // Format activity type for display
  const displayType = detectedType.charAt(0).toUpperCase() + detectedType.slice(1);
  const durationDisplay = durationMin >= 60
    ? `${(durationMin / 60).toFixed(1).replace('.0', '')} hour${durationMin >= 120 ? 's' : ''}`
    : `${Math.round(durationMin)} min`;

  const feedback = `${displayType} for ${durationDisplay} — lost ~${Math.round(sweatLossML)}ml of fluids`;

  return {
    activityType: displayType,
    durationMin,
    sweatLossML,
    hydrationDelta,
    feedback,
  };
}

export function applyActivity(state: HydrationState, result: ActivityResult): HydrationState {
  const newLevel = Math.max(0, Math.min(100, state.level + result.hydrationDelta));
  const entry: ActivityEntry = {
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label: `${result.activityType} · ${result.durationMin} min`,
    durationMin: result.durationMin,
    hydrationDelta: result.hydrationDelta,
    timestamp: Date.now(),
  };
  return {
    ...state,
    level: newLevel,
    lastUpdate: Date.now(),
    activityLog: [entry, ...(state.activityLog ?? [])].slice(0, 30),
  };
}
