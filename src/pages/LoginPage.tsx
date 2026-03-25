import { useState } from 'react';
import { useTheme, getTheme } from '../context/ThemeContext';

interface Account {
  username: string;
  name: string;
  password: string;
  onboarding: Record<string, string>;
}

interface Session {
  username: string;
  name: string;
}

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

function getAccounts(): Account[] {
  try { return JSON.parse(localStorage.getItem('sip-ai-accounts') || '[]'); } catch { return []; }
}

function saveAccounts(accounts: Account[]) {
  localStorage.setItem('sip-ai-accounts', JSON.stringify(accounts));
}

export default function LoginPage({ onLogin }: Props) {
  const isDark = useTheme();
  const theme = getTheme(isDark);

  const accounts = getAccounts();
  const hasAccounts = accounts.length > 0;

  const [step, setStep] = useState<'login' | 'signup' | 'onboarding'>(hasAccounts ? 'login' : 'signup');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [newUser, setNewUser] = useState<{ username: string; name: string } | null>(null);

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

  const handleLogin = () => {
    setError('');
    const acct = getAccounts().find(a => a.username.toLowerCase() === username.trim().toLowerCase());
    if (!acct) { setError('Account not found'); return; }
    if (acct.password !== password) { setError('Incorrect password'); return; }
    const session = { username: acct.username, name: acct.name };
    localStorage.setItem('sip-ai-session', JSON.stringify(session));
    onLogin(session);
  };

  const handleSignup = () => {
    setError('');
    if (!name.trim()) { setError('Please enter your name'); return; }
    if (!username.trim()) { setError('Please enter a username'); return; }
    if (username.includes(' ')) { setError('Username cannot contain spaces'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    const existing = getAccounts().find(a => a.username.toLowerCase() === username.trim().toLowerCase());
    if (existing) { setError('Username already taken'); return; }
    setNewUser({ username: username.trim(), name: name.trim() });
    setStep('onboarding');
  };

  const handleAnswer = (option: string) => {
    const q = QUESTIONS[qIndex];
    const updated = { ...answers, [q.id]: option };
    setAnswers(updated);
    if (qIndex < QUESTIONS.length - 1) {
      setQIndex(qIndex + 1);
    } else {
      // Save account and log in
      const acct: Account = {
        username: newUser!.username,
        name: newUser!.name,
        password,
        onboarding: updated,
      };
      const all = getAccounts();
      all.push(acct);
      saveAccounts(all);
      const session = { username: acct.username, name: acct.name };
      localStorage.setItem('sip-ai-session', JSON.stringify(session));
      onLogin(session);
    }
  };

  // ── Onboarding screen ──────────────────────────────────────────────────────
  if (step === 'onboarding') {
    const q = QUESTIONS[qIndex];
    const progress = (qIndex / QUESTIONS.length) * 100;
    return (
      <div style={{
        background: theme.bg, minHeight: '100dvh', display: 'flex',
        flexDirection: 'column', alignItems: 'center', padding: '0 20px 40px',
        maxWidth: 420, margin: '0 auto',
      }}>
        {/* Top bar */}
        <div style={{ width: '100%', paddingTop: 60, marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: theme.textSecondary, fontWeight: 500 }}>
              {qIndex + 1} of {QUESTIONS.length}
            </span>
            <span style={{ fontSize: 13, color: theme.textSecondary }}>
              Personalizing your experience
            </span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: theme.divider }}>
            <div style={{
              height: '100%', borderRadius: 2, background: theme.textPrimary,
              width: `${progress}%`, transition: 'width 0.4s ease',
            }} />
          </div>
        </div>

        {/* Question card */}
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
                  width: '100%',
                  padding: '15px 18px',
                  borderRadius: 16,
                  border: `1px solid ${theme.cardBorder}`,
                  background: theme.card,
                  color: theme.textPrimary,
                  fontSize: 15,
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: theme.cardShadow,
                  transition: 'transform 0.1s ease, opacity 0.1s ease',
                  fontFamily: 'inherit',
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

  // ── Login / Signup screens ─────────────────────────────────────────────────
  return (
    <div style={{
      background: theme.bg, minHeight: '100dvh', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '0 24px 60px', maxWidth: 420, margin: '0 auto',
    }}>
      {/* Logo */}
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

      {/* Card */}
      <div style={{
        width: '100%',
        background: theme.card,
        borderRadius: 24,
        padding: '24px 20px',
        boxShadow: theme.cardShadow,
        border: `1px solid ${theme.cardBorder}`,
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {step === 'signup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: theme.textSecondary, letterSpacing: '0.05em' }}>NAME</label>
              <input
                style={inputStyle}
                placeholder="Your full name"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: theme.textSecondary, letterSpacing: '0.05em' }}>USERNAME</label>
            <input
              style={inputStyle}
              placeholder="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: theme.textSecondary, letterSpacing: '0.05em' }}>PASSWORD</label>
            <input
              style={inputStyle}
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete={step === 'login' ? 'current-password' : 'new-password'}
              onKeyDown={e => e.key === 'Enter' && (step === 'login' ? handleLogin() : handleSignup())}
            />
          </div>

          {error && (
            <p style={{ fontSize: 13, color: '#dc2626', fontWeight: 500, margin: '2px 0 0' }}>{error}</p>
          )}

          <button
            onClick={step === 'login' ? handleLogin : handleSignup}
            style={{
              marginTop: 4,
              width: '100%',
              background: theme.textPrimary,
              color: isDark ? '#0f1117' : '#ffffff',
              border: 'none',
              borderRadius: 14,
              padding: '15px',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '-0.01em',
              fontFamily: 'inherit',
            }}
          >
            {step === 'login' ? 'Sign In' : 'Continue'}
          </button>
        </div>
      </div>

      {/* Switch mode */}
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
