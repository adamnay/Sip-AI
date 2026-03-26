import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTheme, getTheme } from '../context/ThemeContext';
import { WaterIcon, CoffeeIcon } from '../components/Icons';
import type { Session } from '@supabase/supabase-js';
import type { UserProfile } from '../engine/hydrationEngine';

interface Props {
  onLogin: (session: Session, profile?: Partial<UserProfile>) => void;
}

type QuestionType = 'choice' | 'slider_age' | 'slider_height' | 'slider_weight';

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
    id: 'ageTotalYears', type: 'slider_age',
    question: 'How old are you?',
    sub: 'Age affects how your body processes and retains water.',
    icon: 'age',
    options: [],
    sliderMin: 13, sliderMax: 90, sliderDefault: 28,
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
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill={color} stroke="none" />
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
      <line x1="12" y1="14.5" x2="12" y2="20" />
      <line x1="9" y1="20" x2="15" y2="20" />
    </svg>
  );
  if (icon === 'age') return (
    <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
  if (icon === 'height') return (
    <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="3" x2="12" y2="21" />
      <polyline points="8,7 12,3 16,7" />
      <polyline points="8,17 12,21 16,17" />
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

export default function LoginPage({ onLogin }: Props) {
  const isDark = useTheme();
  const theme = getTheme(isDark);

  const [step, setStep] = useState<'login' | 'signup' | 'onboarding'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [pendingSession, setPendingSession] = useState<Session | null>(null);
  const [sliderValue, setSliderValue] = useState(66);

  // Reset slider to default when landing on a slider question
  useEffect(() => {
    const q = QUESTIONS[qIndex];
    if (q.type === 'slider_age' || q.type === 'slider_height' || q.type === 'slider_weight') {
      setSliderValue(q.sliderDefault!);
    }
  }, [qIndex]);

  const inputStyle = {
    width: '100%',
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: 14,
    padding: '14px 16px',
    fontSize: 15,
    color: theme.textPrimary,
    background: theme.inputBg,
    outline: 'none',
    boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
  };

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    if (data.session) onLogin(data.session);
  };

  const handleSignup = async () => {
    setError('');
    if (!name.trim()) { setError('Please enter your name'); return; }
    if (!email.trim()) { setError('Please enter your email'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: name.trim() } },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    if (data.session) {
      setPendingSession(data.session);
      setQIndex(0);
      setAnswers({});
      setStep('onboarding');
    } else {
      setError('Check your email to confirm your account, then sign in.');
    }
  };

  const handleAnswer = async (option: string) => {
    const q = QUESTIONS[qIndex];
    const updated = { ...answers, [q.id]: option };
    setAnswers(updated);

    if (qIndex < QUESTIONS.length - 1) {
      setQIndex(qIndex + 1);
    } else {
      // Build profile from answers
      const profile: Partial<UserProfile> = {
        name: name.trim(),
        email: email.trim(),
      };
      if (updated.ageTotalYears) profile.age = parseInt(updated.ageTotalYears);
      const totalIn = parseInt(updated.heightTotalIn || '0');
      if (totalIn) {
        profile.heightFt = Math.floor(totalIn / 12);
        profile.heightIn = totalIn % 12;
      }
      if (updated.weightLbs) profile.weightLbs = parseFloat(updated.weightLbs);
      await supabase.auth.updateUser({ data: { onboarding: updated } });
      if (pendingSession) onLogin(pendingSession, profile);
    }
  };

  const handleSliderContinue = () => {
    handleAnswer(String(Math.round(sliderValue)));
  };

  const trackFill = (val: number, min: number, max: number) => {
    const pct = ((val - min) / (max - min)) * 100;
    const filled = isDark ? 'rgba(255,255,255,0.9)' : '#111827';
    const empty = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)';
    return `linear-gradient(to right, ${filled} 0%, ${filled} ${pct}%, ${empty} ${pct}%, ${empty} 100%)`;
  };

  // ── Onboarding ─────────────────────────────────────────────────────────────
  if (step === 'onboarding') {
    const q = QUESTIONS[qIndex];
    const iconColor = isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.6)';

    const renderSliderContent = () => {
      if (q.type === 'slider_age') {
        return (
          <>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <span style={{ fontSize: 56, fontWeight: 800, color: theme.textPrimary, letterSpacing: '-0.04em', lineHeight: 1 }}>
                {Math.round(sliderValue)}
              </span>
              <span style={{ fontSize: 22, fontWeight: 600, color: theme.textSecondary, marginLeft: 8 }}>yrs</span>
            </div>
            <div style={{ marginBottom: 12 }}>
              <input
                type="range"
                min={q.sliderMin}
                max={q.sliderMax}
                value={sliderValue}
                onChange={e => setSliderValue(Number(e.target.value))}
                style={{ background: trackFill(sliderValue, q.sliderMin!, q.sliderMax!) }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: 11, color: theme.textTertiary }}>{q.sliderMin}</span>
                <span style={{ fontSize: 11, color: theme.textTertiary }}>{q.sliderMax}</span>
              </div>
            </div>
          </>
        );
      }
      if (q.type === 'slider_height') {
        const totalIn = Math.round(sliderValue);
        const ft = Math.floor(totalIn / 12);
        const inches = totalIn % 12;
        return (
          <>
            {/* Big value display */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <span style={{ fontSize: 56, fontWeight: 800, color: theme.textPrimary, letterSpacing: '-0.04em', lineHeight: 1 }}>
                {ft}
              </span>
              <span style={{ fontSize: 22, fontWeight: 600, color: theme.textSecondary, marginLeft: 4 }}>ft</span>
              <span style={{ fontSize: 56, fontWeight: 800, color: theme.textPrimary, letterSpacing: '-0.04em', lineHeight: 1, marginLeft: 14 }}>
                {inches}
              </span>
              <span style={{ fontSize: 22, fontWeight: 600, color: theme.textSecondary, marginLeft: 4 }}>in</span>
            </div>
            {/* Slider */}
            <div style={{ marginBottom: 12 }}>
              <input
                type="range"
                min={q.sliderMin}
                max={q.sliderMax}
                value={sliderValue}
                onChange={e => setSliderValue(Number(e.target.value))}
                style={{ background: trackFill(sliderValue, q.sliderMin!, q.sliderMax!) }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: 11, color: theme.textTertiary }}>4′ 0″</span>
                <span style={{ fontSize: 11, color: theme.textTertiary }}>7′ 0″</span>
              </div>
            </div>
          </>
        );
      }
      if (q.type === 'slider_weight') {
        const lbs = Math.round(sliderValue);
        return (
          <>
            {/* Big value display */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <span style={{ fontSize: 56, fontWeight: 800, color: theme.textPrimary, letterSpacing: '-0.04em', lineHeight: 1 }}>
                {lbs}
              </span>
              <span style={{ fontSize: 22, fontWeight: 600, color: theme.textSecondary, marginLeft: 6 }}>lbs</span>
            </div>
            {/* Slider */}
            <div style={{ marginBottom: 12 }}>
              <input
                type="range"
                min={q.sliderMin}
                max={q.sliderMax}
                value={sliderValue}
                onChange={e => setSliderValue(Number(e.target.value))}
                style={{ background: trackFill(sliderValue, q.sliderMin!, q.sliderMax!) }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: 11, color: theme.textTertiary }}>{q.sliderMin} lbs</span>
                <span style={{ fontSize: 11, color: theme.textTertiary }}>{q.sliderMax} lbs</span>
              </div>
            </div>
          </>
        );
      }
      return null;
    };

    return (
      <div style={{
        background: theme.bg, minHeight: '100dvh', display: 'flex',
        flexDirection: 'column', padding: '0 20px 48px',
        maxWidth: 420, margin: '0 auto',
      }}>
        {/* Segmented progress */}
        <div style={{ paddingTop: 56, marginBottom: 44 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: theme.textSecondary, letterSpacing: '0.06em' }}>
              STEP {qIndex + 1} OF {QUESTIONS.length}
            </span>
            <span style={{ fontSize: 12, color: theme.textTertiary }}>Quick setup</span>
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
            {q.options.map(option => (
              <button
                key={option}
                onClick={() => handleAnswer(option)}
                style={{
                  width: '100%', padding: '15px 18px',
                  borderRadius: 16,
                  border: `1px solid ${theme.cardBorder}`,
                  background: theme.card,
                  color: theme.textPrimary,
                  fontSize: 15, fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  boxShadow: theme.cardShadow,
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  transition: 'transform 0.12s ease',
                }}
                onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.975)'; }}
                onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                onTouchStart={e => { e.currentTarget.style.transform = 'scale(0.975)'; }}
                onTouchEnd={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <span>{option}</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={theme.textTertiary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            ))}
          </div>
        )}

        {/* Slider questions */}
        {(q.type === 'slider_age' || q.type === 'slider_height' || q.type === 'slider_weight') && (
          <div>
            {renderSliderContent()}
            <button
              onClick={handleSliderContinue}
              style={{
                width: '100%', marginTop: 24,
                background: theme.textPrimary,
                color: isDark ? '#0f1117' : '#ffffff',
                border: 'none', borderRadius: 16,
                padding: '16px', fontSize: 15, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                letterSpacing: '-0.01em',
              }}
            >
              Continue
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Login / Signup ─────────────────────────────────────────────────────────
  return (
    <div style={{
      background: theme.bg, minHeight: '100dvh', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '0 24px 60px', maxWidth: 420, margin: '0 auto',
    }}>
      <div style={{ marginBottom: 36, textAlign: 'center' }}>
        <img
          src="/logo.png"
          alt="Sip AI"
          style={{ height: 44, filter: isDark ? 'invert(1)' : 'none', marginBottom: 8 }}
        />
        <p style={{ fontSize: 14, color: theme.textSecondary, margin: 0 }}>
          {step === 'login' ? 'Sign in to continue' : 'Create your account'}
        </p>
      </div>

      <div style={{
        width: '100%', background: theme.card, borderRadius: 24,
        padding: '24px 20px', boxShadow: theme.cardShadow, border: `1px solid ${theme.cardBorder}`,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {step === 'signup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: theme.textSecondary, letterSpacing: '0.05em' }}>NAME</label>
              <input style={inputStyle} placeholder="Your full name" value={name}
                onChange={e => setName(e.target.value)} autoComplete="name" />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: theme.textSecondary, letterSpacing: '0.05em' }}>EMAIL</label>
            <input style={inputStyle} placeholder="you@example.com" value={email}
              onChange={e => setEmail(e.target.value)} type="email" autoComplete="email" autoCapitalize="none" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: theme.textSecondary, letterSpacing: '0.05em' }}>PASSWORD</label>
            <input style={inputStyle} placeholder="••••••••" type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={step === 'login' ? 'current-password' : 'new-password'}
              onKeyDown={e => e.key === 'Enter' && (step === 'login' ? handleLogin() : handleSignup())} />
          </div>

          {step === 'signup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: theme.textSecondary, letterSpacing: '0.05em' }}>CONFIRM PASSWORD</label>
              <input style={inputStyle} placeholder="••••••••" type="password" value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                onKeyDown={e => e.key === 'Enter' && handleSignup()} />
            </div>
          )}

          {error && (
            <p style={{ fontSize: 13, color: error.includes('Check your email') ? '#16a34a' : '#dc2626', fontWeight: 500, margin: '2px 0 0' }}>
              {error}
            </p>
          )}

          <button
            onClick={step === 'login' ? handleLogin : handleSignup}
            disabled={loading}
            style={{
              marginTop: 4, width: '100%', background: theme.textPrimary,
              color: isDark ? '#0f1117' : '#ffffff', border: 'none', borderRadius: 14,
              padding: '15px', fontSize: 15, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.7 : 1, letterSpacing: '-0.01em', fontFamily: 'inherit',
            }}
          >
            {loading ? '...' : step === 'login' ? 'Sign In' : 'Continue'}
          </button>
        </div>
      </div>

      <p style={{ marginTop: 20, fontSize: 14, color: theme.textSecondary, textAlign: 'center' }}>
        {step === 'login' ? "Don't have an account? " : 'Already have an account? '}
        <button
          onClick={() => { setStep(step === 'login' ? 'signup' : 'login'); setError(''); }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: theme.textPrimary, fontWeight: 600, fontSize: 14,
            fontFamily: 'inherit', padding: 0,
          }}
        >
          {step === 'login' ? 'Create account' : 'Sign in'}
        </button>
      </p>
    </div>
  );
}
