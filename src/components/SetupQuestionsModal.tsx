import { useEffect, useState } from 'react';
import { useTheme, getTheme } from '../context/ThemeContext';
import { WaterIcon, CoffeeIcon, XIcon } from './Icons';
import type { UserProfile } from '../engine/hydrationEngine';

type QuestionType = 'choice' | 'slider_height' | 'slider_weight';

interface Question {
  id: string;
  question: string;
  sub: string;
  icon: string;
  type: QuestionType;
  options: string[];
  sliderMin?: number;
  sliderMax?: number;
  sliderDefault?: number;
}

const QUESTIONS: Question[] = [
  {
    id: 'goal', type: 'choice',
    question: "What's your main goal?",
    sub: "We'll personalize your targets around this.",
    icon: 'target',
    options: ['More energy', 'Athletic performance', 'Weight management', 'Skin & glow', 'General wellness'],
  },
  {
    id: 'currentIntake', type: 'choice',
    question: 'How much water do you drink now?',
    sub: "Be honest — no judgement here.",
    icon: 'water',
    options: ['Barely any', 'A few glasses', 'About 8 cups/day', 'More than 8 cups'],
  },
  {
    id: 'activityLevel', type: 'choice',
    question: 'How active is your lifestyle?',
    sub: 'This affects how fast your body loses water.',
    icon: 'activity',
    options: ['Mostly sedentary', 'Light exercise', 'Moderately active', 'Very active', 'Athlete level'],
  },
  {
    id: 'caffeine', type: 'choice',
    question: 'How much caffeine daily?',
    sub: 'Coffee, tea, energy drinks — all count.',
    icon: 'coffee',
    options: ['None at all', '1 cup/day', '2–3 cups/day', '4+ cups/day'],
  },
  {
    id: 'alcohol', type: 'choice',
    question: 'How often do you drink alcohol?',
    sub: 'Helps us coach your hydration recovery.',
    icon: 'wine',
    options: ['Never', 'Rarely', 'Weekends', 'A few times/week', 'Daily'],
  },
  {
    id: 'heightTotalIn', type: 'slider_height',
    question: 'How tall are you?',
    sub: 'Used to personalize your daily hydration target.',
    icon: 'height',
    options: [],
    sliderMin: 48, sliderMax: 84, sliderDefault: 66,
  },
  {
    id: 'weightLbs', type: 'slider_weight',
    question: "What's your weight?",
    sub: 'Helps us calculate your ideal daily intake.',
    icon: 'weight',
    options: [],
    sliderMin: 80, sliderMax: 350, sliderDefault: 155,
  },
];

function QuestionIcon({ icon, color }: { icon: string; color: string }) {
  if (icon === 'water') return <WaterIcon size={28} color={color} />;
  if (icon === 'coffee') return <CoffeeIcon size={28} color={color} />;
  if (icon === 'target') return (
    <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" fill={color} stroke="none" />
    </svg>
  );
  if (icon === 'activity') return (
    <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
    </svg>
  );
  if (icon === 'wine') return (
    <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 4h8l-1.5 6a4.5 4.5 0 01-9 0L8 4z" />
      <line x1="12" y1="14.5" x2="12" y2="20" /><line x1="9" y1="20" x2="15" y2="20" />
    </svg>
  );
  if (icon === 'height') return (
    <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="3" x2="12" y2="21" />
      <polyline points="8,7 12,3 16,7" /><polyline points="8,17 12,21 16,17" />
    </svg>
  );
  if (icon === 'weight') return (
    <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="10" width="18" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      <line x1="12" y1="14" x2="12" y2="17" />
    </svg>
  );
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

  useEffect(() => {
    const q = QUESTIONS[qIndex];
    if (q.type === 'slider_height' || q.type === 'slider_weight') {
      const saved = answers[q.id];
      setSliderValue(saved ? parseFloat(saved) : q.sliderDefault!);
    }
  }, [qIndex]);

  const q = QUESTIONS[qIndex];
  const iconColor = isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.6)';

  const trackFill = (val: number, min: number, max: number) => {
    const pct = ((val - min) / (max - min)) * 100;
    const filled = isDark ? 'rgba(255,255,255,0.9)' : '#111827';
    const empty = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)';
    return `linear-gradient(to right, ${filled} 0%, ${filled} ${pct}%, ${empty} ${pct}%, ${empty} 100%)`;
  };

  const advance = (answer: string) => {
    const updated = { ...answers, [q.id]: answer };
    setAnswers(updated);

    if (qIndex < QUESTIONS.length - 1) {
      setQIndex(qIndex + 1);
    } else {
      // All done — build profile
      const profile: Partial<UserProfile> = {};
      const totalIn = parseInt(updated.heightTotalIn || '0');
      if (totalIn) {
        profile.heightFt = Math.floor(totalIn / 12);
        profile.heightIn = totalIn % 12;
      }
      if (updated.weightLbs) {
        profile.weightLbs = parseFloat(updated.weightLbs);
      }
      onComplete(updated, profile);
    }
  };

  const handleBack = () => {
    if (qIndex === 0) { onClose(); return; }
    setQIndex(qIndex - 1);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed', inset: 0,
          background: theme.bg,
          zIndex: 200,
          display: 'flex', flexDirection: 'column',
          maxWidth: 420, margin: '0 auto',
        }}
      >
        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px 0',
        }}>
          <button
            onClick={handleBack}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '8px 0', display: 'flex', alignItems: 'center', gap: 6,
              color: theme.textSecondary, fontFamily: 'inherit', fontSize: 14, fontWeight: 600,
            }}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            {qIndex === 0 ? 'Cancel' : 'Back'}
          </button>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
              border: 'none', cursor: 'pointer',
            }}
          >
            <XIcon size={16} color={theme.textSecondary} />
          </button>
        </div>

        {/* Progress bars */}
        <div style={{ padding: '16px 20px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: theme.textSecondary, letterSpacing: '0.06em' }}>
              STEP {qIndex + 1} OF {QUESTIONS.length}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            {QUESTIONS.map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 3, borderRadius: 3,
                background: i <= qIndex ? theme.textPrimary : theme.divider,
                transition: 'background 0.35s ease',
              }} />
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 20px 48px' }}>
          {/* Icon + Question */}
          <div style={{ marginBottom: 32 }}>
            <div style={{
              width: 60, height: 60, borderRadius: 18,
              background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 22,
            }}>
              <QuestionIcon icon={q.icon} color={iconColor} />
            </div>
            <h2 style={{
              fontSize: 26, fontWeight: 800, color: theme.textPrimary,
              letterSpacing: '-0.03em', margin: '0 0 8px', lineHeight: 1.2,
            }}>
              {q.question}
            </h2>
            <p style={{ fontSize: 13, color: theme.textSecondary, margin: 0, lineHeight: 1.55 }}>
              {q.sub}
            </p>
          </div>

          {/* Choice options */}
          {q.type === 'choice' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {q.options.map(option => {
                const isSelected = answers[q.id] === option;
                return (
                  <button
                    key={option}
                    onClick={() => advance(option)}
                    style={{
                      width: '100%', padding: '15px 18px', borderRadius: 16,
                      border: isSelected ? `1.5px solid ${theme.textPrimary}` : `1px solid ${theme.cardBorder}`,
                      background: isSelected ? (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)') : theme.card,
                      color: theme.textPrimary, fontSize: 15, fontWeight: 600,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      fontFamily: 'inherit', textAlign: 'left',
                      transition: 'all 0.12s ease',
                    }}
                  >
                    <span>{option}</span>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={theme.textTertiary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                );
              })}
            </div>
          )}

          {/* Height slider */}
          {q.type === 'slider_height' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <span style={{ fontSize: 56, fontWeight: 800, color: theme.textPrimary, letterSpacing: '-0.04em', lineHeight: 1 }}>
                  {Math.floor(Math.round(sliderValue) / 12)}
                </span>
                <span style={{ fontSize: 22, fontWeight: 600, color: theme.textSecondary, marginLeft: 4 }}>ft</span>
                <span style={{ fontSize: 56, fontWeight: 800, color: theme.textPrimary, letterSpacing: '-0.04em', lineHeight: 1, marginLeft: 14 }}>
                  {Math.round(sliderValue) % 12}
                </span>
                <span style={{ fontSize: 22, fontWeight: 600, color: theme.textSecondary, marginLeft: 4 }}>in</span>
              </div>
              <input
                type="range" min={q.sliderMin} max={q.sliderMax} value={sliderValue}
                onChange={e => setSliderValue(Number(e.target.value))}
                style={{ background: trackFill(sliderValue, q.sliderMin!, q.sliderMax!) }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, marginBottom: 28 }}>
                <span style={{ fontSize: 11, color: theme.textTertiary }}>4′ 0″</span>
                <span style={{ fontSize: 11, color: theme.textTertiary }}>7′ 0″</span>
              </div>
              <button
                onClick={() => advance(String(Math.round(sliderValue)))}
                style={{
                  width: '100%', background: theme.textPrimary,
                  color: isDark ? '#0f1117' : '#ffffff', border: 'none', borderRadius: 16,
                  padding: '16px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'inherit', letterSpacing: '-0.01em',
                }}
              >
                Continue
              </button>
            </div>
          )}

          {/* Weight slider */}
          {q.type === 'slider_weight' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <span style={{ fontSize: 56, fontWeight: 800, color: theme.textPrimary, letterSpacing: '-0.04em', lineHeight: 1 }}>
                  {Math.round(sliderValue)}
                </span>
                <span style={{ fontSize: 22, fontWeight: 600, color: theme.textSecondary, marginLeft: 6 }}>lbs</span>
              </div>
              <input
                type="range" min={q.sliderMin} max={q.sliderMax} value={sliderValue}
                onChange={e => setSliderValue(Number(e.target.value))}
                style={{ background: trackFill(sliderValue, q.sliderMin!, q.sliderMax!) }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, marginBottom: 28 }}>
                <span style={{ fontSize: 11, color: theme.textTertiary }}>{q.sliderMin} lbs</span>
                <span style={{ fontSize: 11, color: theme.textTertiary }}>{q.sliderMax} lbs</span>
              </div>
              <button
                onClick={() => advance(String(Math.round(sliderValue)))}
                style={{
                  width: '100%', background: theme.textPrimary,
                  color: isDark ? '#0f1117' : '#ffffff', border: 'none', borderRadius: 16,
                  padding: '16px', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'inherit', letterSpacing: '-0.01em',
                }}
              >
                {qIndex === QUESTIONS.length - 1 ? 'Save Profile' : 'Continue'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
