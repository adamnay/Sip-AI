import { useEffect, useState } from 'react';
import { useTheme, getTheme } from '../context/ThemeContext';
import { WaterIcon, CoffeeIcon, XIcon } from './Icons';
import type { UserProfile } from '../engine/hydrationEngine';

type QuestionType = 'choice' | 'slider_age' | 'slider_height' | 'slider_weight' | 'interstitial';

interface Question {
  id: string;
  type: QuestionType;
  question: string;
  sub: string;
  icon: string;
  options: string[];
  sliderMin?: number;
  sliderMax?: number;
  sliderDefault?: number;
  headline?: string;
  body?: string;
  stat?: string;
}

const QUESTIONS: Question[] = [
  // ── Section 1: About You ──────────────────────────────────────────────────
  {
    id: 'goal', type: 'choice',
    question: "What's your main goal?",
    sub: "We'll build your entire plan around this.",
    icon: 'target',
    options: ['More energy & focus', 'Athletic performance', 'Weight management', 'Skin health & glow', 'General wellness'],
  },
  {
    id: 'gender', type: 'choice',
    question: 'What is your biological sex?',
    sub: 'Affects your baseline fluid needs and kidney function.',
    icon: 'person',
    options: ['Male', 'Female', 'Prefer not to say'],
  },
  {
    id: 'ageTotalYears', type: 'slider_age',
    question: 'How old are you?',
    sub: 'Kidney efficiency and thirst sensitivity change significantly with age.',
    icon: 'age',
    options: [],
    sliderMin: 13, sliderMax: 90, sliderDefault: 28,
  },
  {
    id: 'heightTotalIn', type: 'slider_height',
    question: 'How tall are you?',
    sub: 'Larger body surface area means more fluid lost through skin.',
    icon: 'height',
    options: [],
    sliderMin: 48, sliderMax: 84, sliderDefault: 66,
  },
  {
    id: 'weightLbs', type: 'slider_weight',
    question: "What's your weight?",
    sub: 'The strongest single predictor of daily fluid requirements.',
    icon: 'weight',
    options: [],
    sliderMin: 80, sliderMax: 350, sliderDefault: 155,
  },

  // ── Interstitial 1 ────────────────────────────────────────────────────────
  {
    id: 'interstitial_1', type: 'interstitial',
    question: '', sub: '', icon: '', options: [],
    headline: 'Your needs are completely unique',
    stat: 'Daily fluid requirements vary by up to 3× between individuals of the same weight.',
    body: 'Most apps stop at weight. We factor in 12 more variables to get your number right.',
  },

  // ── Section 2: Lifestyle ──────────────────────────────────────────────────
  {
    id: 'activityLevel', type: 'choice',
    question: 'How active is your lifestyle?',
    sub: 'Active muscles demand significantly more water to function.',
    icon: 'activity',
    options: ['Mostly sedentary', 'Light exercise 1–2×/week', 'Moderate exercise 3–4×/week', 'Very active 5+×/week', 'Athlete / daily intense training'],
  },
  {
    id: 'exerciseType', type: 'choice',
    question: 'What type of exercise do you do most?',
    sub: 'Different activities produce very different sweat rates.',
    icon: 'run',
    options: ['Running / cycling', 'Gym / weight training', 'Yoga / pilates / stretching', 'Team sports / HIIT', "I don't exercise regularly"],
  },
  {
    id: 'workEnv', type: 'choice',
    question: 'What best describes your work environment?',
    sub: 'Outdoor workers lose 2–4× more fluid daily than desk workers.',
    icon: 'work',
    options: ['Desk job / remote', 'Outdoor or physical labor', 'Standing / retail / service', 'Mix of indoor and outdoor'],
  },
  {
    id: 'sleepHours', type: 'choice',
    question: 'How many hours do you sleep per night?',
    sub: 'You lose about 1 cup of water overnight through breathing alone.',
    icon: 'sleep',
    options: ['Less than 6 hours', '6–7 hours', '7–8 hours', '8+ hours'],
  },

  // ── Interstitial 2 ────────────────────────────────────────────────────────
  {
    id: 'interstitial_2', type: 'interstitial',
    question: '', sub: '', icon: '', options: [],
    headline: 'Lifestyle is the biggest variable',
    stat: 'Athletes and outdoor workers can need up to 2.5× more water than sedentary office workers — even at the same body weight.',
    body: "Two more sections and we'll have your full picture.",
  },

  // ── Section 3: Environment ────────────────────────────────────────────────
  {
    id: 'climate', type: 'choice',
    question: "What's your typical climate?",
    sub: 'Heat and humidity dramatically accelerate fluid loss.',
    icon: 'sun',
    options: ['Hot & dry (desert)', 'Hot & humid (tropical)', 'Temperate / mild', 'Cold / northern', 'Varies by season'],
  },
  {
    id: 'indoorEnv', type: 'choice',
    question: 'Where do you spend most of your day?',
    sub: 'Both AC and heating strip moisture from the air around you.',
    icon: 'building',
    options: ['Air-conditioned office or home', 'Heated indoor space', 'Mostly outdoors', 'Mixed throughout the day'],
  },
  {
    id: 'altitude', type: 'choice',
    question: 'What altitude do you live or train at?',
    sub: 'Higher altitude = drier air = faster respiratory fluid loss.',
    icon: 'mountain',
    options: ['Sea level (0–1,000 ft)', 'Moderate (1,000–4,999 ft)', 'High (5,000–8,000 ft)', 'Very high (8,000+ ft)'],
  },

  // ── Section 4: Habits ─────────────────────────────────────────────────────
  {
    id: 'caffeine', type: 'choice',
    question: 'How much caffeine do you consume daily?',
    sub: 'Coffee, tea, energy drinks — caffeine is a diuretic above 80mg.',
    icon: 'coffee',
    options: ['None', '1 cup / day', '2–3 cups / day', '4+ cups / day'],
  },
  {
    id: 'alcohol', type: 'choice',
    question: 'How often do you drink alcohol?',
    sub: 'Alcohol suppresses ADH, causing kidneys to produce more urine.',
    icon: 'wine',
    options: ['Never', 'Rarely (a few times/month)', 'Weekends', 'A few times / week', 'Daily'],
  },
  {
    id: 'diet', type: 'choice',
    question: 'How would you describe your diet?',
    sub: 'Up to 20% of daily hydration comes from food — especially fruits and vegetables.',
    icon: 'food',
    options: ['Lots of fruits & vegetables', 'Balanced / varied', 'Mostly processed / fast food', 'High protein / low carb', 'Vegan / plant-based'],
  },
  {
    id: 'currentIntake', type: 'choice',
    question: 'How much water do you currently drink?',
    sub: "Be honest — no judgment. Helps us set the right starting point.",
    icon: 'water',
    options: ['Barely any', 'A couple of glasses', 'Around 6–8 cups', 'More than 8 cups'],
  },

  // ── Interstitial 3 ────────────────────────────────────────────────────────
  {
    id: 'interstitial_3', type: 'interstitial',
    question: '', sub: '', icon: '', options: [],
    headline: 'Almost done — one last section',
    stat: 'Certain health conditions and medications can shift fluid needs by 20–40%.',
    body: 'This final section ensures your daily target is accurate and safe for your body.',
  },

  // ── Section 5: Health ─────────────────────────────────────────────────────
  {
    id: 'healthCondition', type: 'choice',
    question: 'Any relevant health conditions?',
    sub: 'This adjusts your target to be appropriate for your body.',
    icon: 'health',
    options: ['None', 'Pregnant', 'Breastfeeding', 'Type 1 or 2 diabetes', 'Kidney condition', 'Heart condition'],
  },
  {
    id: 'diuretics', type: 'choice',
    question: 'Do you take any diuretic medications?',
    sub: 'Diuretics (common for blood pressure) significantly increase fluid output.',
    icon: 'pill',
    options: ['No', 'Yes, mild (e.g. low-dose HCTZ)', 'Yes, strong (e.g. furosemide)', 'Not sure'],
  },
  {
    id: 'challenge', type: 'choice',
    question: "What's your biggest hydration challenge?",
    sub: "We'll coach around this specifically.",
    icon: 'flag',
    options: ["I forget to drink", 'Too busy during the day', "I never feel thirsty", "I don't like plain water", 'I travel frequently'],
  },
  {
    id: 'wakeTime', type: 'choice',
    question: 'What time do you usually wake up?',
    sub: 'We spread your targets across your actual waking hours.',
    icon: 'clock',
    options: ['Before 6:00 AM', '6:00–7:30 AM', '7:30–9:00 AM', 'After 9:00 AM'],
  },
];

const REAL_QUESTIONS = QUESTIONS.filter(q => q.type !== 'interstitial');

// ── Icons ─────────────────────────────────────────────────────────────────────
function QuestionIcon({ icon, color }: { icon: string; color: string }) {
  const p = { width: 28, height: 28, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (icon === 'water') return <WaterIcon size={28} color={color} />;
  if (icon === 'coffee') return <CoffeeIcon size={28} color={color} />;
  if (icon === 'target') return <svg {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" fill={color} stroke="none" /></svg>;
  if (icon === 'activity') return <svg {...p}><polyline points="22,12 18,12 15,21 9,3 6,12 2,12" /></svg>;
  if (icon === 'wine') return <svg {...p}><path d="M8 4h8l-1.5 6a4.5 4.5 0 01-9 0L8 4z" /><line x1="12" y1="14.5" x2="12" y2="20" /><line x1="9" y1="20" x2="15" y2="20" /></svg>;
  if (icon === 'height') return <svg {...p}><line x1="12" y1="3" x2="12" y2="21" /><polyline points="8,7 12,3 16,7" /><polyline points="8,17 12,21 16,17" /></svg>;
  if (icon === 'age' || icon === 'person') return <svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>;
  if (icon === 'weight') return <svg {...p}><rect x="3" y="10" width="18" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /><line x1="12" y1="14" x2="12" y2="17" /></svg>;
  if (icon === 'run') return <svg {...p}><circle cx="13" cy="4" r="1.5" /><path d="M8 18l2-5 3 3 2-6" /><path d="M16 18l-2-5" /></svg>;
  if (icon === 'work') return <svg {...p}><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>;
  if (icon === 'sleep') return <svg {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>;
  if (icon === 'sun') return <svg {...p}><circle cx="12" cy="12" r="4" /><line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" /><line x1="4.22" y1="4.22" x2="7.05" y2="7.05" /><line x1="16.95" y1="16.95" x2="19.78" y2="19.78" /><line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" /></svg>;
  if (icon === 'building') return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 3v18M15 3v18M3 9h18M3 15h18" /></svg>;
  if (icon === 'mountain') return <svg {...p}><polygon points="3,20 12,4 21,20 3,20" /><polyline points="9,20 12,13 15,20" /></svg>;
  if (icon === 'food') return <svg {...p}><path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" /></svg>;
  if (icon === 'health') return <svg {...p}><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>;
  if (icon === 'pill') return <svg {...p}><path d="M10.5 20H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v7" /><circle cx="17.5" cy="17.5" r="4.5" /><path d="m15 20 5-5" /></svg>;
  if (icon === 'flag') return <svg {...p}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>;
  if (icon === 'clock') return <svg {...p}><circle cx="12" cy="12" r="9" /><polyline points="12,7 12,12 15,15" /></svg>;
  if (icon === 'brain') return <svg {...p}><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" /><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" /></svg>;
  return null;
}

interface Props {
  initialAnswers?: Record<string, string>;
  onComplete: (answers: Record<string, string>, profile: Partial<UserProfile>) => void;
  onClose: () => void;
}

export default function SetupQuestionsModal({ initialAnswers, onComplete, onClose }: Props) {
  const isDark = useTheme();
  const theme = getTheme(isDark);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers ?? {});
  const [sliderValue, setSliderValue] = useState(66);

  const q = QUESTIONS[qIndex];
  const realQuestionsDone = QUESTIONS.slice(0, qIndex).filter(x => x.type !== 'interstitial').length;
  const totalReal = REAL_QUESTIONS.length;
  const isLastQuestion = qIndex === QUESTIONS.length - 1;

  useEffect(() => {
    if (q.type === 'slider_age' || q.type === 'slider_height' || q.type === 'slider_weight') {
      const saved = answers[q.id];
      setSliderValue(saved ? parseFloat(saved) : q.sliderDefault!);
    }
  }, [qIndex]);

  const iconColor = isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.6)';

  const trackFill = (val: number, min: number, max: number) => {
    const pct = ((val - min) / (max - min)) * 100;
    const filled = isDark ? 'rgba(255,255,255,0.9)' : '#111827';
    const empty = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)';
    return `linear-gradient(to right, ${filled} 0%, ${filled} ${pct}%, ${empty} ${pct}%, ${empty} 100%)`;
  };

  const advance = (answer?: string) => {
    const updated = answer !== undefined ? { ...answers, [q.id]: answer } : answers;
    if (answer !== undefined) setAnswers(updated);

    if (qIndex < QUESTIONS.length - 1) {
      setQIndex(i => i + 1);
    } else {
      const profile: Partial<UserProfile> = {};
      if (updated.ageTotalYears) profile.age = parseInt(updated.ageTotalYears);
      const totalIn = parseInt(updated.heightTotalIn || '0');
      if (totalIn) { profile.heightFt = Math.floor(totalIn / 12); profile.heightIn = totalIn % 12; }
      if (updated.weightLbs) profile.weightLbs = parseFloat(updated.weightLbs);
      onComplete(updated, profile);
    }
  };

  const handleBack = () => {
    if (qIndex === 0) { onClose(); return; }
    setQIndex(i => i - 1);
  };

  const btnStyle: React.CSSProperties = {
    width: '100%', background: theme.textPrimary,
    color: isDark ? '#0f1117' : '#ffffff', border: 'none', borderRadius: 16,
    padding: '16px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
    fontFamily: 'inherit', letterSpacing: '-0.01em',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: theme.bg, zIndex: 200,
      display: 'flex', flexDirection: 'column', maxWidth: 420, margin: '0 auto',
    }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 0' }}>
        <button onClick={handleBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0', display: 'flex', alignItems: 'center', gap: 6, color: theme.textSecondary, fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          {qIndex === 0 ? 'Cancel' : 'Back'}
        </button>
        <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', border: 'none', cursor: 'pointer' }}>
          <XIcon size={16} color={theme.textSecondary} />
        </button>
      </div>

      {/* Progress — only for real questions */}
      {q.type !== 'interstitial' && (
        <div style={{ padding: '14px 20px 0' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: theme.textTertiary, letterSpacing: '0.07em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
            Question {realQuestionsDone + 1} of {totalReal}
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            {REAL_QUESTIONS.map((_, i) => (
              <div key={i} style={{ flex: 1, height: 3, borderRadius: 3, background: i <= realQuestionsDone ? theme.textPrimary : theme.divider, transition: 'background 0.3s ease' }} />
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 20px 48px' }}>

        {/* ── Interstitial ─────────────────────────────────────────────── */}
        {q.type === 'interstitial' && (
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '75vh', justifyContent: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: 22, background: isDark ? 'rgba(6,182,212,0.12)' : 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
              <QuestionIcon icon="brain" color="#0891b2" />
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: theme.textPrimary, letterSpacing: '-0.03em', margin: '0 0 20px', lineHeight: 1.2 }}>
              {q.headline}
            </h2>
            <div style={{ background: isDark ? 'rgba(6,182,212,0.08)' : 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.18)', borderRadius: 16, padding: '16px 18px', marginBottom: 20 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#0891b2', margin: 0, lineHeight: 1.55 }}>{q.stat}</p>
            </div>
            <p style={{ fontSize: 14, color: theme.textSecondary, margin: '0 0 40px', lineHeight: 1.6 }}>{q.body}</p>
            <button onClick={() => advance()} style={btnStyle}>Continue →</button>
          </div>
        )}

        {/* ── Choice ───────────────────────────────────────────────────── */}
        {q.type === 'choice' && (
          <>
            <div style={{ marginBottom: 28 }}>
              <div style={{ width: 60, height: 60, borderRadius: 18, background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <QuestionIcon icon={q.icon} color={iconColor} />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: theme.textPrimary, letterSpacing: '-0.03em', margin: '0 0 8px', lineHeight: 1.2 }}>{q.question}</h2>
              <p style={{ fontSize: 13, color: theme.textSecondary, margin: 0, lineHeight: 1.55 }}>{q.sub}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {q.options.map(option => {
                const isSelected = answers[q.id] === option;
                return (
                  <button key={option} onClick={() => advance(option)} style={{ width: '100%', padding: '15px 18px', borderRadius: 16, border: isSelected ? `1.5px solid ${theme.textPrimary}` : `1px solid ${theme.cardBorder}`, background: isSelected ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)') : theme.card, color: theme.textPrimary, fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'inherit', textAlign: 'left', transition: 'all 0.12s ease' }}>
                    <span>{option}</span>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={theme.textTertiary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* ── Sliders ───────────────────────────────────────────────────── */}
        {(q.type === 'slider_age' || q.type === 'slider_height' || q.type === 'slider_weight') && (
          <>
            <div style={{ marginBottom: 28 }}>
              <div style={{ width: 60, height: 60, borderRadius: 18, background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <QuestionIcon icon={q.icon} color={iconColor} />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: theme.textPrimary, letterSpacing: '-0.03em', margin: '0 0 8px', lineHeight: 1.2 }}>{q.question}</h2>
              <p style={{ fontSize: 13, color: theme.textSecondary, margin: 0, lineHeight: 1.55 }}>{q.sub}</p>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              {q.type === 'slider_age' && (
                <><span style={{ fontSize: 64, fontWeight: 800, color: theme.textPrimary, letterSpacing: '-0.04em', lineHeight: 1 }}>{Math.round(sliderValue)}</span><span style={{ fontSize: 24, fontWeight: 600, color: theme.textSecondary, marginLeft: 8 }}>yrs</span></>
              )}
              {q.type === 'slider_height' && (
                <><span style={{ fontSize: 64, fontWeight: 800, color: theme.textPrimary, letterSpacing: '-0.04em', lineHeight: 1 }}>{Math.floor(Math.round(sliderValue) / 12)}</span><span style={{ fontSize: 24, fontWeight: 600, color: theme.textSecondary, marginLeft: 4 }}>ft</span><span style={{ fontSize: 64, fontWeight: 800, color: theme.textPrimary, letterSpacing: '-0.04em', lineHeight: 1, marginLeft: 14 }}>{Math.round(sliderValue) % 12}</span><span style={{ fontSize: 24, fontWeight: 600, color: theme.textSecondary, marginLeft: 4 }}>in</span></>
              )}
              {q.type === 'slider_weight' && (
                <><span style={{ fontSize: 64, fontWeight: 800, color: theme.textPrimary, letterSpacing: '-0.04em', lineHeight: 1 }}>{Math.round(sliderValue)}</span><span style={{ fontSize: 24, fontWeight: 600, color: theme.textSecondary, marginLeft: 8 }}>lbs</span></>
              )}
            </div>

            <input type="range" min={q.sliderMin} max={q.sliderMax} value={sliderValue} onChange={e => setSliderValue(Number(e.target.value))} style={{ background: trackFill(sliderValue, q.sliderMin!, q.sliderMax!) }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, marginBottom: 32 }}>
              <span style={{ fontSize: 11, color: theme.textTertiary }}>{q.type === 'slider_height' ? `4′ 0″` : q.sliderMin}</span>
              <span style={{ fontSize: 11, color: theme.textTertiary }}>{q.type === 'slider_height' ? `7′ 0″` : q.sliderMax}</span>
            </div>
            <button onClick={() => advance(String(Math.round(sliderValue)))} style={btnStyle}>
              {isLastQuestion ? 'Build My Plan →' : 'Continue'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
