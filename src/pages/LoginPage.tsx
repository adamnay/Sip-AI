import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTheme, getTheme } from '../context/ThemeContext';
import type { Session } from '@supabase/supabase-js';

interface Props {
  onLogin: (session: Session) => void;
}

const QUESTIONS = [
  {
    id: 'goal',
    question: "What's your main hydration goal?",
    icon: '🎯',
    options: ['Better energy', 'Athletic performance', 'Weight management', 'Skin & appearance', 'General wellness'],
  },
  {
    id: 'currentIntake',
    question: 'How much water do you currently drink?',
    icon: '💧',
    options: ['Barely any', 'A few glasses', 'About 8 cups/day', 'More than 8 cups'],
  },
  {
    id: 'activityLevel',
    question: 'How active are you?',
    icon: '🏃',
    options: ['Mostly sedentary', 'Light exercise', 'Moderately active', 'Very active', 'Athlete'],
  },
  {
    id: 'caffeine',
    question: 'How much caffeine do you consume daily?',
    icon: '☕',
    options: ['None', '1 cup/day', '2–3 cups/day', '4+ cups/day'],
  },
  {
    id: 'alcohol',
    question: 'How often do you drink alcohol?',
    icon: '🍷',
    options: ['Never', 'Rarely', 'Weekends', 'A few times/week', 'Daily'],
  },
];

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
      setStep('onboarding');
    } else {
      // Email confirmation required
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
      // Save onboarding answers to user metadata
      await supabase.auth.updateUser({ data: { onboarding: updated } });
      if (pendingSession) onLogin(pendingSession);
    }
  };

  // ── Onboarding ─────────────────────────────────────────────────────────────
  if (step === 'onboarding') {
    const q = QUESTIONS[qIndex];
    const progress = (qIndex / QUESTIONS.length) * 100;
    return (
      <div style={{
        background: theme.bg, minHeight: '100dvh', display: 'flex',
        flexDirection: 'column', alignItems: 'center', padding: '0 20px 40px',
        maxWidth: 420, margin: '0 auto',
      }}>
        <div style={{ width: '100%', paddingTop: 60, marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: theme.textSecondary, fontWeight: 500 }}>
              {qIndex + 1} of {QUESTIONS.length}
            </span>
            <span style={{ fontSize: 13, color: theme.textSecondary }}>Personalizing your experience</span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: theme.divider }}>
            <div style={{
              height: '100%', borderRadius: 2, background: theme.textPrimary,
              width: `${progress}%`, transition: 'width 0.4s ease',
            }} />
          </div>
        </div>

        <div style={{ width: '100%', flex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <span style={{ fontSize: 48, display: 'block', marginBottom: 16 }}>{q.icon}</span>
            <h2 style={{
              fontSize: 22, fontWeight: 700, color: theme.textPrimary,
              letterSpacing: '-0.02em', margin: 0, lineHeight: 1.3,
            }}>
              {q.question}
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q.options.map(option => (
              <button
                key={option}
                onClick={() => handleAnswer(option)}
                style={{
                  width: '100%', padding: '15px 18px', borderRadius: 16,
                  border: `1px solid ${theme.cardBorder}`, background: theme.card,
                  color: theme.textPrimary, fontSize: 15, fontWeight: 500,
                  cursor: 'pointer', textAlign: 'left', boxShadow: theme.cardShadow,
                  transition: 'transform 0.1s ease', fontFamily: 'inherit',
                }}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.98)')}
                onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
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
