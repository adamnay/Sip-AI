import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTheme, getTheme } from '../context/ThemeContext';
import type { Session } from '@supabase/supabase-js';
import type { UserProfile } from '../engine/hydrationEngine';
import SetupQuestionsModal from '../components/SetupQuestionsModal';
import WelcomePage from './WelcomePage';

interface Props {
  onLogin: (session: Session, profile?: Partial<UserProfile>) => void;
}

type Step = 'welcome' | 'onboarding' | 'save' | 'login';

export default function LoginPage({ onLogin }: Props) {
  const isDark = useTheme();
  const theme = getTheme(isDark);

  const [step, setStep] = useState<Step>('welcome');

  // Saved when questionnaire completes — used after signup
  const [savedAnswers,  setSavedAnswers]  = useState<Record<string, string>>({});
  const [savedProfile,  setSavedProfile]  = useState<Partial<UserProfile>>({});

  // Auth fields
  const [name,            setName]            = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error,           setError]           = useState('');
  const [loading,         setLoading]         = useState(false);

  const inputStyle: React.CSSProperties = {
    width: '100%', border: `1px solid ${theme.cardBorder}`, borderRadius: 14,
    padding: '14px 16px', fontSize: 15, color: theme.textPrimary,
    background: theme.inputBg, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  };

  // ── Signup (from save screen) ─────────────────────────────────────────────

  const handleSignup = async () => {
    setError('');
    if (!name.trim())                    { setError('Please enter your name'); return; }
    if (!email.trim())                   { setError('Please enter your email'); return; }
    if (password.length < 6)             { setError('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword)    { setError('Passwords do not match'); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(), password,
      options: { data: { name: name.trim() } },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    if (data.session) {
      await supabase.auth.updateUser({ data: { onboarding: savedAnswers } });
      onLogin(data.session, { ...savedProfile, name: name.trim(), email: email.trim() });
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

  // ── Welcome — hero landing screen ────────────────────────────────────────
  if (step === 'welcome') {
    return (
      <WelcomePage
        onGetStarted={() => setStep('onboarding')}
        onLogin={() => { setStep('login'); setError(''); }}
      />
    );
  }

  // ── Onboarding — delegates to the full SetupQuestionsModal ────────────────
  if (step === 'onboarding') {
    return (
      <SetupQuestionsModal
        onComplete={(answers, profile) => {
          setSavedAnswers(answers);
          setSavedProfile(profile);
          setStep('save');
        }}
        onClose={() => {
          // X / Cancel → back to welcome
          setStep('welcome');
          setError('');
        }}
      />
    );
  }

  // ── Save your progress ─────────────────────────────────────────────────────
  if (step === 'save') {
    return (
      <div style={{
        background: theme.bg, minHeight: '100dvh', display: 'flex',
        flexDirection: 'column', maxWidth: 420, margin: '0 auto',
        padding: '0 20px 48px', overflowY: 'auto',
      }}>
        {/* Back */}
        <div style={{ paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))', marginBottom: 32 }}>
          <button
            onClick={() => setStep('onboarding')}
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
              Plan ready — personalized to you
            </p>
            <p style={{ fontSize: 12, color: theme.textSecondary, margin: 0 }}>
              {savedAnswers.goal ? `Goal: ${savedAnswers.goal}` : ''}
              {savedAnswers.activityLevel ? ` · ${savedAnswers.activityLevel}` : ''}
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
          onClick={() => { setStep('onboarding'); setError(''); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.textPrimary, fontWeight: 600, fontSize: 14, fontFamily: 'inherit', padding: 0 }}
        >
          Get started
        </button>
      </p>
    </div>
  );
}
