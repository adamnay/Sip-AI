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
    options: ['Couch Potato', 'Light exercise', 'Moderately active', 'Very active', 'Athlete level'],
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
  {
    id: 'referralSource', type: 'choice',
    question: 'Where did you hear about us?',
    sub: 'Helps us reach more people looking to improve their health.',
    icon: 'megaphone',
    options: ['App Store / Play Store', 'Instagram or TikTok', 'Friend or family', 'Google search', 'Reddit', 'Other'],
  },
];

function QuestionIcon({ icon, color }: { icon: string; color: string }) {
  const p = { width: 28, height: 28, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (icon === 'water') return <WaterIcon size={28} color={color} />;
  if (icon === 'coffee') return <CoffeeIcon size={28} color={color} />;
  if (icon === 'target') return <svg {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" fill={color} stroke="none" /></svg>;
  if (icon === 'activity') return <svg {...p}><polyline points="22,12 18,12 15,21 9,3 6,12 2,12" /></svg>;
  if (icon === 'wine') return <svg {...p}><path d="M8 4h8l-1.5 6a4.5 4.5 0 01-9 0L8 4z" /><line x1="12" y1="14.5" x2="12" y2="20" /><line x1="9" y1="20" x2="15" y2="20" /></svg>;
  if (icon === 'age') return <svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>;
  if (icon === 'height') return <svg {...p}><line x1="12" y1="3" x2="12" y2="21" /><polyline points="8,7 12,3 16,7" /><polyline points="8,17 12,21 16,17" /></svg>;
  if (icon === 'weight') return <svg {...p}><rect x="3" y="10" width="18" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /><line x1="12" y1="14" x2="12" y2="17" /></svg>;
  if (icon === 'megaphone') return <svg {...p}><path d="M3 11l18-5v12L3 13v-2z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></svg>;
  return null;
}

type Step = 'onboarding' | 'save' | 'login';

export default function LoginPage({ onLogin }: Props) {
  const isDark = useTheme();
  const theme = getTheme(isDark);

  const [step, setStep]               = useState<Step>('onboarding');
  const [qIndex, setQIndex]           = useState(0);
  const [answers, setAnswers]         = useState<Record<string, string>>({});
  const [sliderValue, setSliderValue] = useState(66);

  // Saved when questionnaire completes — used after signup
  const [savedAnswers, setSavedAnswers] = useState<Record<string, string>>({});

  // Signup / login fields
  const [name,            setName]            = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error,           setError]           = useState('');
  const [loading,         setLoading]         = useState(false);

  // Reset slider when we land on a slider question
  useEffect(() => {
    const q = QUESTIONS[qIndex];
    if (q.type === 'slider_age' || q.type === 'slider_height' || q.type === 'slider_weight') {
      setSliderValue(q.sliderDefault!);
    }
  }, [qIndex]);

  const inputStyle: React.CSSProperties = {
    width: '100%', border: `1px solid ${theme.cardBorder}`, borderRadius: 14,
    padding: '14px 16px', fontSize: 15, color: theme.textPrimary,
    background: theme.inputBg, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  };

  // ── Questionnaire ─────────────────────────────────────────────────────────

  const handleAnswer = (option: string) => {
    const q = QUESTIONS[qIndex];
    const updated = { ...answers, [q.id]: option };
    setAnswers(updated);

    if (qIndex < QUESTIONS.length - 1) {
      setQIndex(qIndex + 1);
    } else {
      // All questions done — go to save screen
      setSavedAnswers(updated);
      setStep('save');
    }
  };

  const handleSliderContinue = () => {
    handleAnswer(String(Math.round(sliderValue)));
  };

  const trackFill = (val: number, min: number, max: number) => {
    const pct = ((val - min) / (max - min)) * 100;
    const filled = isDark ? 'rgba(255,255,255,0.9)' : '#111827';
    const empty  = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)';
    return `linear-gradient(to right, ${filled} 0%, ${filled} ${pct}%, ${empty} ${pct}%, ${empty} 100%)`;
  };

  // ── Signup (from save screen) ─────────────────────────────────────────────

  const buildProfile = (a: Record<string, string>): Partial<UserProfile> => {
    const profile: Partial<UserProfile> = { name: name.trim(), email: email.trim() };
    if (a.ageTotalYears) profile.age = parseInt(a.ageTotalYears);
    const totalIn = parseInt(a.heightTotalIn || '0');
    if (totalIn) { profile.heightFt = Math.floor(totalIn / 12); profile.heightIn = totalIn % 12; }
    if (a.weightLbs) profile.weightLbs = parseFloat(a.weightLbs);
    return profile;
  };

  const handleSignup = async () => {
    setError('');
    if (!name.trim())         { setError('Please enter your name'); return; }
    if (!email.trim())        { setError('Please enter your email'); return; }
    if (password.length < 6)  { setError('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(), password,
      options: { data: { name: name.trim() } },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    if (data.session) {
      await supabase.auth.updateUser({ data: { onboarding: savedAnswers } });
      onLogin(data.session, buildProfile(savedAnswers));
    } else {
      setError('Check your email to confirm your account, then sign in.');
    }
  };

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    if (data.session) onLogin(data.session);
  };

  // ── Onboarding ─────────────────────────────────────────────────────────────
  if (step === 'onboarding') {
    const q = QUESTIONS[qIndex];
    const iconColor = isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.6)';

    return (
      <div style={{
        background: theme.bg, minHeight: '100dvh', display: 'flex',
        flexDirection: 'column', maxWidth: 420, margin: '0 auto',
      }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 0' }}>
          {qIndex === 0 ? (
            <img src="/logo.png" alt="Sip AI" style={{ height: 28, filter: isDark ? 'invert(1)' : 'none' }} />
          ) : (
            <button
              onClick={() => setQIndex(i => i - 1)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: theme.textSecondary, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, padding: '8px 0' }}
            >
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
              Back
            </button>
          )}
          <button
            onClick={() => { setStep('login'); setError(''); }}
            style={{ background: 'none', border: `1px solid ${theme.cardBorder}`, borderRadius: 20, padding: '7px 14px', fontSize: 13, fontWeight: 600, color: theme.textSecondary, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Sign in
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ padding: '14px 20px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: theme.textTertiary, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              Question {qIndex + 1} of {QUESTIONS.length}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {QUESTIONS.map((_, i) => (
              <div key={i} style={{ flex: 1, height: 3, borderRadius: 3, background: i <= qIndex ? theme.textPrimary : theme.divider, transition: 'background 0.3s ease' }} />
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 20px 48px' }}>
          {/* Icon + question */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ width: 60, height: 60, borderRadius: 18, background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <QuestionIcon icon={q.icon} color={iconColor} />
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: theme.textPrimary, letterSpacing: '-0.03em', margin: '0 0 8px', lineHeight: 1.2 }}>
              {q.question}
            </h2>
            <p style={{ fontSize: 13, color: theme.textSecondary, margin: 0, lineHeight: 1.55 }}>
              {q.sub}
            </p>
          </div>

          {/* Choice */}
          {q.type === 'choice' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {q.options.map(option => (
                <button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  style={{
                    width: '100%', padding: '15px 18px', borderRadius: 16,
                    border: `1px solid ${theme.cardBorder}`, background: theme.card,
                    color: theme.textPrimary, fontSize: 15, fontWeight: 600,
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', fontFamily: 'inherit', textAlign: 'left',
                    transition: 'transform 0.12s ease',
                  }}
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

          {/* Slider */}
          {(q.type === 'slider_age' || q.type === 'slider_height' || q.type === 'slider_weight') && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: 32 }}>
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
              <input
                type="range"
                min={q.sliderMin} max={q.sliderMax} value={sliderValue}
                onChange={e => setSliderValue(Number(e.target.value))}
                style={{ background: trackFill(sliderValue, q.sliderMin!, q.sliderMax!) }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, marginBottom: 32 }}>
                <span style={{ fontSize: 11, color: theme.textTertiary }}>{q.type === 'slider_height' ? `4′ 0″` : q.sliderMin}</span>
                <span style={{ fontSize: 11, color: theme.textTertiary }}>{q.type === 'slider_height' ? `7′ 0″` : q.sliderMax}</span>
              </div>
              <button
                onClick={handleSliderContinue}
                style={{
                  width: '100%', background: theme.textPrimary, color: isDark ? '#0f1117' : '#ffffff',
                  border: 'none', borderRadius: 16, padding: '16px', fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.01em',
                }}
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Save your progress ─────────────────────────────────────────────────────
  if (step === 'save') {
    return (
      <div style={{
        background: theme.bg, minHeight: '100dvh', display: 'flex',
        flexDirection: 'column', maxWidth: 420, margin: '0 auto', padding: '0 20px 48px',
        overflowY: 'auto',
      }}>
        {/* Back */}
        <div style={{ paddingTop: 16, marginBottom: 32 }}>
          <button
            onClick={() => { setQIndex(QUESTIONS.length - 1); setStep('onboarding'); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: theme.textSecondary, fontFamily: 'inherit', fontSize: 14, fontWeight: 600, padding: '8px 0' }}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            Back
          </button>
        </div>

        {/* Hero */}
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 22, margin: '0 auto 20px',
            background: isDark ? 'rgba(6,182,212,0.12)' : 'rgba(6,182,212,0.08)',
            border: '1px solid rgba(6,182,212,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2" />
              <path d="M8 12l3 3 5-5" />
            </svg>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: theme.textPrimary, letterSpacing: '-0.03em', margin: '0 0 10px', lineHeight: 1.2 }}>
            Save your progress
          </h1>
          <p style={{ fontSize: 14, color: theme.textSecondary, margin: 0, lineHeight: 1.6 }}>
            Your personalized hydration plan is ready. Create a free account to save it and track your progress across devices.
          </p>
        </div>

        {/* Plan summary chip */}
        <div style={{
          background: isDark ? 'rgba(6,182,212,0.08)' : 'rgba(6,182,212,0.06)',
          border: '1px solid rgba(6,182,212,0.18)', borderRadius: 14,
          padding: '12px 16px', marginBottom: 28,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ fontSize: 22 }}>💧</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#0891b2', margin: '0 0 2px' }}>
              Plan ready — {QUESTIONS.length} questions answered
            </p>
            <p style={{ fontSize: 12, color: theme.textSecondary, margin: 0 }}>
              Goal: {savedAnswers.goal ?? '—'} · Activity: {savedAnswers.activityLevel ?? '—'}
            </p>
          </div>
        </div>

        {/* Signup form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: theme.textSecondary, letterSpacing: '0.05em' }}>YOUR NAME</label>
            <input style={inputStyle} placeholder="First name" value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: theme.textSecondary, letterSpacing: '0.05em' }}>EMAIL</label>
            <input style={inputStyle} placeholder="you@example.com" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" autoCapitalize="none" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: theme.textSecondary, letterSpacing: '0.05em' }}>PASSWORD</label>
            <input style={inputStyle} placeholder="At least 6 characters" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: theme.textSecondary, letterSpacing: '0.05em' }}>CONFIRM PASSWORD</label>
            <input style={inputStyle} placeholder="••••••••" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} autoComplete="new-password" onKeyDown={e => e.key === 'Enter' && handleSignup()} />
          </div>

          {error && (
            <p style={{ fontSize: 13, color: error.includes('Check your email') ? '#16a34a' : '#dc2626', fontWeight: 500, margin: '2px 0 0' }}>
              {error}
            </p>
          )}

          <button
            onClick={handleSignup}
            disabled={loading}
            style={{
              marginTop: 4, width: '100%', background: theme.textPrimary,
              color: isDark ? '#0f1117' : '#ffffff', border: 'none', borderRadius: 14,
              padding: '16px', fontSize: 15, fontWeight: 700,
              cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1,
              letterSpacing: '-0.01em', fontFamily: 'inherit',
            }}
          >
            {loading ? 'Creating account…' : 'Create Free Account →'}
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: 14, color: theme.textSecondary, margin: 0 }}>
          Already have an account?{' '}
          <button
            onClick={() => { setStep('login'); setError(''); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textPrimary, fontWeight: 600, fontSize: 14, fontFamily: 'inherit', padding: 0 }}
          >
            Sign in
          </button>
        </p>
      </div>
    );
  }

  // ── Login (returning users) ────────────────────────────────────────────────
  return (
    <div style={{
      background: theme.bg, minHeight: '100dvh', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '0 24px 60px', maxWidth: 420, margin: '0 auto',
    }}>
      <div style={{ marginBottom: 36, textAlign: 'center' }}>
        <img src="/logo.png" alt="Sip AI" style={{ height: 44, filter: isDark ? 'invert(1)' : 'none', marginBottom: 8 }} />
        <p style={{ fontSize: 14, color: theme.textSecondary, margin: 0 }}>Sign in to continue</p>
      </div>

      <div style={{ width: '100%', background: theme.card, borderRadius: 24, padding: '24px 20px', boxShadow: theme.cardShadow, border: `1px solid ${theme.cardBorder}` }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: theme.textSecondary, letterSpacing: '0.05em' }}>EMAIL</label>
            <input style={inputStyle} placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} type="email" autoComplete="email" autoCapitalize="none" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: theme.textSecondary, letterSpacing: '0.05em' }}>PASSWORD</label>
            <input style={inputStyle} placeholder="••••••••" type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          </div>

          {error && (
            <p style={{ fontSize: 13, color: '#dc2626', fontWeight: 500, margin: '2px 0 0' }}>{error}</p>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              marginTop: 4, width: '100%', background: theme.textPrimary,
              color: isDark ? '#0f1117' : '#ffffff', border: 'none', borderRadius: 14,
              padding: '15px', fontSize: 15, fontWeight: 700,
              cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1,
              letterSpacing: '-0.01em', fontFamily: 'inherit',
            }}
          >
            {loading ? '…' : 'Sign In'}
          </button>
        </div>
      </div>

      <p style={{ marginTop: 20, fontSize: 14, color: theme.textSecondary, textAlign: 'center' }}>
        New here?{' '}
        <button
          onClick={() => { setStep('onboarding'); setQIndex(0); setAnswers({}); setError(''); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textPrimary, fontWeight: 600, fontSize: 14, fontFamily: 'inherit', padding: 0 }}
        >
          Get started
        </button>
      </p>
    </div>
  );
}
