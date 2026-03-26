import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { UserProfile } from '../engine/hydrationEngine';
import { getDailyTargetOz, computeDailyTargetFromAnswers } from '../engine/hydrationEngine';
import { GearIcon, WaterIcon } from '../components/Icons';
import { useTheme, getTheme } from '../context/ThemeContext';
import SetupQuestionsModal from '../components/SetupQuestionsModal';

interface Props {
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
  darkMode: boolean;
  onToggleDark: () => void;
  session: Session | null;
  onLogout: () => void;
  onSetupComplete: (answers: Record<string, string>, profile: Partial<UserProfile>) => void;
  profileSummary: string;
  customDailyTargetOz: number | null;
  onboardingAnswers: Record<string, string> | null;
}

function InputField({
  label, value, onChange, placeholder, type = 'text', unit, theme,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  unit?: string;
  theme: ReturnType<typeof getTheme>;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: theme.textSecondary, letterSpacing: '0.04em' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          inputMode={type === 'number' ? 'numeric' : undefined}
          style={{
            width: '100%',
            border: `1px solid ${theme.cardBorder}`,
            borderRadius: 12,
            padding: unit ? '12px 40px 12px 14px' : '12px 14px',
            fontSize: 15,
            color: theme.textPrimary,
            background: theme.inputBg,
            outline: 'none',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
          }}
        />
        {unit && (
          <span style={{
            position: 'absolute',
            right: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 13,
            color: theme.textTertiary,
            fontWeight: 500,
            pointerEvents: 'none',
          }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ icon, title, sub, theme }: { icon: React.ReactNode; title: string; sub?: string; theme: ReturnType<typeof getTheme> }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <div style={{
        width: 34,
        height: 34,
        borderRadius: 10,
        background: 'rgba(128,128,128,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 14, fontWeight: 700, color: theme.textPrimary, margin: 0 }}>{title}</p>
        {sub && <p style={{ fontSize: 12, color: theme.textSecondary, margin: '2px 0 0' }}>{sub}</p>}
      </div>
    </div>
  );
}

export default function SettingsPage({ profile, onSave, darkMode, onToggleDark, session, onLogout, onSetupComplete, profileSummary, customDailyTargetOz, onboardingAnswers }: Props) {
  const isDark = useTheme();
  const theme = getTheme(isDark);
  const [form, setForm] = useState({
    name: profile.name,
    email: profile.email,
    age: profile.age !== null ? String(profile.age) : '',
    heightFt: profile.heightFt !== null ? String(profile.heightFt) : '',
    heightIn: profile.heightIn !== null ? String(profile.heightIn) : '',
    weightLbs: profile.weightLbs !== null ? String(profile.weightLbs) : '',
  });

  // Sync form when profile updates externally (e.g. after setup questions)
  useEffect(() => {
    setForm({
      name: profile.name,
      email: profile.email,
      age: profile.age !== null ? String(profile.age) : '',
      heightFt: profile.heightFt !== null ? String(profile.heightFt) : '',
      heightIn: profile.heightIn !== null ? String(profile.heightIn) : '',
      weightLbs: profile.weightLbs !== null ? String(profile.weightLbs) : '',
    });
  }, [profile.age, profile.heightFt, profile.heightIn, profile.weightLbs]);

  const [saved, setSaved] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const set = (key: string) => (v: string) => setForm(f => ({ ...f, [key]: v }));

  const handleSave = () => {
    const updated: UserProfile = {
      name: form.name.trim(),
      email: form.email.trim(),
      age: form.age ? parseInt(form.age, 10) : null,
      heightFt: form.heightFt ? parseInt(form.heightFt, 10) : null,
      heightIn: form.heightIn ? parseInt(form.heightIn, 10) : null,
      weightLbs: form.weightLbs ? parseFloat(form.weightLbs) : null,
    };
    onSave(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    if (newPassword.length < 6) { setPasswordError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmNewPassword) { setPasswordError('Passwords do not match'); return; }
    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordLoading(false);
    if (error) { setPasswordError(error.message); return; }
    setPasswordSaved(true);
    setNewPassword('');
    setConfirmNewPassword('');
    setShowPasswordForm(false);
    setTimeout(() => setPasswordSaved(false), 3000);
  };

  const previewProfile: UserProfile = {
    name: form.name,
    email: form.email,
    age: form.age ? parseInt(form.age, 10) : null,
    heightFt: form.heightFt ? parseInt(form.heightFt, 10) : null,
    heightIn: form.heightIn ? parseInt(form.heightIn, 10) : null,
    weightLbs: form.weightLbs ? parseFloat(form.weightLbs) : null,
  };
  const formWeight = parseFloat(form.weightLbs) || previewProfile.weightLbs || 155;
  const dailyOz = onboardingAnswers
    ? computeDailyTargetFromAnswers(onboardingAnswers, formWeight)
    : getDailyTargetOz(previewProfile);

  const userName = session?.user?.user_metadata?.name || form.name || 'User';
  const userEmail = session?.user?.email || form.email || '';

  return (
    <div style={{
      background: theme.bg,
      minHeight: '100dvh',
      maxWidth: 420,
      margin: '0 auto',
      paddingBottom: 'calc(120px + env(safe-area-inset-bottom, 0px))',
    }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <GearIcon size={18} color={theme.textPrimary} />
          <h1 style={{ fontSize: 20, fontWeight: 700, color: theme.textPrimary, letterSpacing: '-0.02em', margin: 0 }}>
            Settings
          </h1>
        </div>
        <p style={{ fontSize: 13, color: theme.textSecondary, margin: 0 }}>Personalize your hydration</p>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Account */}
        {session && (
          <div style={{
            background: theme.card,
            borderRadius: 20,
            padding: '16px',
            boxShadow: theme.cardShadow,
            border: `1px solid ${theme.cardBorder}`,
          }}>
            <SectionHeader
              icon={
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.textSecondary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              }
              title="Account"
              sub="Your profile and security"
              theme={theme}
            />

            {/* Name + email display */}
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: theme.textPrimary, margin: '0 0 2px' }}>{userName}</p>
              <p style={{ fontSize: 13, color: theme.textSecondary, margin: 0 }}>{userEmail}</p>
            </div>

            {/* Change password */}
            {!showPasswordForm ? (
              <button
                onClick={() => { setShowPasswordForm(true); setPasswordError(''); }}
                style={{
                  width: '100%',
                  background: passwordSaved ? 'rgba(22,163,74,0.08)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'),
                  color: passwordSaved ? '#16a34a' : theme.textSecondary,
                  border: passwordSaved ? '1px solid rgba(22,163,74,0.2)' : `1px solid ${theme.cardBorder}`,
                  borderRadius: 12,
                  padding: '11px 14px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'left' as const,
                  transition: 'all 0.2s ease',
                }}
              >
                {passwordSaved ? 'Password updated' : 'Change Password'}
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  style={{
                    width: '100%', border: `1px solid ${theme.cardBorder}`, borderRadius: 12,
                    padding: '12px 14px', fontSize: 15, color: theme.textPrimary,
                    background: theme.inputBg, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                  }}
                />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmNewPassword}
                  onChange={e => setConfirmNewPassword(e.target.value)}
                  autoComplete="new-password"
                  onKeyDown={e => e.key === 'Enter' && handlePasswordChange()}
                  style={{
                    width: '100%', border: `1px solid ${theme.cardBorder}`, borderRadius: 12,
                    padding: '12px 14px', fontSize: 15, color: theme.textPrimary,
                    background: theme.inputBg, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                  }}
                />
                {passwordError && (
                  <p style={{ fontSize: 12, color: '#dc2626', margin: 0, fontWeight: 500 }}>{passwordError}</p>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => { setShowPasswordForm(false); setPasswordError(''); setNewPassword(''); setConfirmNewPassword(''); }}
                    style={{
                      flex: 1, padding: '11px', borderRadius: 12,
                      background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                      border: `1px solid ${theme.cardBorder}`, fontSize: 14, fontWeight: 600,
                      color: theme.textSecondary, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePasswordChange}
                    disabled={passwordLoading}
                    style={{
                      flex: 1, padding: '11px', borderRadius: 12,
                      background: theme.textPrimary, border: 'none', fontSize: 14, fontWeight: 700,
                      color: isDark ? '#0f1117' : '#ffffff',
                      cursor: passwordLoading ? 'default' : 'pointer',
                      opacity: passwordLoading ? 0.7 : 1, fontFamily: 'inherit',
                    }}
                  >
                    {passwordLoading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Appearance */}
        <div style={{
          background: theme.card,
          borderRadius: 20,
          padding: '16px',
          boxShadow: theme.cardShadow,
          border: `1px solid ${theme.cardBorder}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: theme.textPrimary, margin: 0 }}>Dark Mode</p>
              <p style={{ fontSize: 12, color: theme.textSecondary, margin: '2px 0 0' }}>Switch to a darker theme</p>
            </div>
            <button
              onClick={onToggleDark}
              style={{
                width: 50,
                height: 28,
                borderRadius: 14,
                background: darkMode ? '#111827' : 'rgba(0,0,0,0.15)',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.25s ease',
                flexShrink: 0,
              }}
            >
              <span style={{
                position: 'absolute',
                top: 3,
                left: darkMode ? 25 : 3,
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#ffffff',
                transition: 'left 0.25s ease',
                boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                display: 'block',
              }} />
            </button>
          </div>
        </div>

        {/* Body info */}
        <div style={{
          background: theme.card,
          borderRadius: 20,
          padding: '16px',
          boxShadow: theme.cardShadow,
          border: `1px solid ${theme.cardBorder}`,
        }}>
          <SectionHeader
            icon={<WaterIcon size={18} color={theme.textSecondary} />}
            title="Body Info"
            sub="Used to personalize your hydration targets"
            theme={theme}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <InputField label="AGE" value={form.age} onChange={set('age')} placeholder="30" type="number" unit="yrs" theme={theme} />

            {/* Height: ft + in side by side */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: theme.textSecondary, letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                HEIGHT
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    value={form.heightFt}
                    onChange={e => set('heightFt')(e.target.value)}
                    placeholder="5"
                    inputMode="numeric"
                    style={{
                      width: '100%', border: `1px solid ${theme.cardBorder}`, borderRadius: 12,
                      padding: '12px 36px 12px 14px', fontSize: 15, color: theme.textPrimary,
                      background: theme.inputBg, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                    }}
                  />
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: theme.textTertiary, pointerEvents: 'none' }}>ft</span>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    value={form.heightIn}
                    onChange={e => set('heightIn')(e.target.value)}
                    placeholder="10"
                    inputMode="numeric"
                    style={{
                      width: '100%', border: `1px solid ${theme.cardBorder}`, borderRadius: 12,
                      padding: '12px 36px 12px 14px', fontSize: 15, color: theme.textPrimary,
                      background: theme.inputBg, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                    }}
                  />
                  <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: theme.textTertiary, pointerEvents: 'none' }}>in</span>
                </div>
              </div>
            </div>

            <InputField label="WEIGHT" value={form.weightLbs} onChange={set('weightLbs')} placeholder="155" type="number" unit="lbs" theme={theme} />
          </div>

          {/* Personalized target preview */}
          {(form.weightLbs || form.age) && (
            <div style={{
              marginTop: 14,
              padding: '10px 14px',
              background: 'rgba(6,182,212,0.06)',
              borderRadius: 10,
              border: '1px solid rgba(6,182,212,0.15)',
            }}>
              <p style={{ fontSize: 12, color: '#0891b2', fontWeight: 500, margin: 0 }}>
                Your personalized daily target: <strong>{dailyOz} oz</strong>
              </p>
              <p style={{ fontSize: 11, color: theme.textSecondary, margin: '2px 0 0' }}>
                {customDailyTargetOz ? 'Based on your setup answers' : 'Based on your weight'} — hydration decay will adjust accordingly
              </p>
            </div>
          )}
        </div>

        {/* My Profile card */}
        <div style={{
          background: theme.card, borderRadius: 20, padding: '16px',
          boxShadow: theme.cardShadow, border: `1px solid ${theme.cardBorder}`,
        }}>
          <SectionHeader
            icon={
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.textSecondary} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
              </svg>
            }
            title="My Profile"
            sub="Based on your setup answers"
            theme={theme}
          />

          {/* Summary + target */}
          {(profileSummary || customDailyTargetOz) ? (
            <div style={{ marginBottom: 12 }}>
              {customDailyTargetOz && (
                <div style={{
                  padding: '12px 14px', borderRadius: 12, marginBottom: 10,
                  background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.15)',
                }}>
                  <p style={{ fontSize: 12, color: '#0891b2', fontWeight: 600, margin: '0 0 2px', letterSpacing: '0.04em' }}>DAILY GOAL</p>
                  <p style={{ fontSize: 22, fontWeight: 800, color: theme.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>
                    {customDailyTargetOz} <span style={{ fontSize: 14, fontWeight: 500, color: theme.textSecondary }}>oz / day</span>
                  </p>
                </div>
              )}
              {profileSummary && (
                <p style={{ fontSize: 13, color: theme.textSecondary, margin: 0, lineHeight: 1.6 }}>
                  {profileSummary}
                </p>
              )}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: theme.textTertiary, marginBottom: 12, lineHeight: 1.5 }}>
              Answer a few questions so we can calculate your perfect daily hydration goal.
            </p>
          )}

          <button
            onClick={() => setShowSetupModal(true)}
            style={{
              width: '100%',
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              color: theme.textPrimary, border: `1px solid ${theme.cardBorder}`,
              borderRadius: 12, padding: '11px 14px', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' as const,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <span>{onboardingAnswers ? 'Redo Setup Questions' : 'Start Setup Questions'}</span>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={theme.textTertiary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          style={{
            width: '100%',
            background: saved ? '#16a34a' : '#111827',
            color: '#ffffff',
            border: 'none',
            borderRadius: 16,
            padding: '15px 20px',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.3s ease',
            letterSpacing: '-0.01em',
          }}
        >
          {saved ? 'Saved!' : 'Save Settings'}
        </button>

        {/* Sign out */}
        {session && (
          <button
            onClick={() => setShowLogoutConfirm(true)}
            style={{
              width: '100%',
              background: 'transparent',
              color: '#dc2626',
              border: '1px solid rgba(220,38,38,0.25)',
              borderRadius: 16,
              padding: '15px 20px',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: '-0.01em',
              fontFamily: 'inherit',
            }}
          >
            Sign Out
          </button>
        )}
      </div>

      {/* Logout confirm modal */}
      {showLogoutConfirm && (
        <>
          <div
            onClick={() => setShowLogoutConfirm(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 100,
              animation: 'fadeIn 0.15s ease forwards',
            }}
          />
          <div style={{
            position: 'fixed',
            bottom: 0, left: 0, right: 0,
            margin: '0 auto',
            maxWidth: 420,
            background: theme.card,
            borderRadius: '24px 24px 0 0',
            zIndex: 110,
            padding: '24px 20px',
            paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
            boxShadow: '0 -4px 32px rgba(0,0,0,0.2)',
            animation: 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1) forwards',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: theme.divider }} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: theme.textPrimary, margin: '0 0 8px', letterSpacing: '-0.02em' }}>
              Sign out?
            </h3>
            <p style={{ fontSize: 14, color: theme.textSecondary, margin: '0 0 24px', lineHeight: 1.5 }}>
              You'll need to sign back in to access your account.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                style={{
                  flex: 1, padding: '14px', borderRadius: 14,
                  background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  border: 'none', fontSize: 15, fontWeight: 600,
                  color: theme.textPrimary, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Cancel
              </button>
              <button
                onClick={onLogout}
                style={{
                  flex: 1, padding: '14px', borderRadius: 14,
                  background: '#dc2626', border: 'none',
                  fontSize: 15, fontWeight: 700,
                  color: '#ffffff', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}

      {/* Setup questions modal */}
      {showSetupModal && (
        <SetupQuestionsModal
          initialAnswers={onboardingAnswers ?? undefined}
          onComplete={(answers, profile) => {
            setShowSetupModal(false);
            onSetupComplete(answers, profile);
          }}
          onClose={() => setShowSetupModal(false)}
        />
      )}
    </div>
  );
}
