import { useState } from 'react';
import type { UserProfile } from '../engine/hydrationEngine';
import { getDailyTargetOz } from '../engine/hydrationEngine';
import { PersonIcon, LockIcon, GearIcon, WaterIcon } from '../components/Icons';
import { useTheme, getTheme } from '../context/ThemeContext';

import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Props {
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
  darkMode: boolean;
  onToggleDark: () => void;
  onLogout: () => void | Promise<void>;
  onSyncNow?: () => Promise<void>;
  session: Session | null;
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


export default function SettingsPage({ profile, onSave, darkMode, onToggleDark, onLogout, onSyncNow, session }: Props) {
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

  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [passwordMsg, setPasswordMsg] = useState('');

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

  const handleSyncNow = async () => {
    if (!onSyncNow) return;
    setSyncing(true);
    setSyncMsg(null);
    try {
      await onSyncNow();
      setSyncMsg('Synced successfully');
    } catch (e: unknown) {
      setSyncMsg(e instanceof Error ? e.message : 'Sync failed');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(null), 4000);
    }
  };

  const handlePasswordReset = async () => {
    if (!passwordForm.current) { setPasswordMsg('Enter your current password'); return; }
    if (passwordForm.next.length < 6) { setPasswordMsg('New password must be 6+ characters'); return; }
    if (passwordForm.next !== passwordForm.confirm) { setPasswordMsg('Passwords do not match'); return; }
    // Password is managed by Supabase — update via their API
    const { error } = await supabase.auth.updateUser({ password: passwordForm.next });
    if (error) { setPasswordMsg(error.message); return; }
    setPasswordMsg('Password updated');
    setPasswordForm({ current: '', next: '', confirm: '' });
    setTimeout(() => setPasswordMsg(''), 3000);
  };

  // Preview the personalized daily target
  const previewProfile: UserProfile = {
    name: form.name,
    email: form.email,
    age: form.age ? parseInt(form.age, 10) : null,
    heightFt: form.heightFt ? parseInt(form.heightFt, 10) : null,
    heightIn: form.heightIn ? parseInt(form.heightIn, 10) : null,
    weightLbs: form.weightLbs ? parseFloat(form.weightLbs) : null,
  };
  const dailyOz = getDailyTargetOz(previewProfile);

  return (
    <div style={{
      background: theme.bg,
      minHeight: '100dvh',
      maxWidth: 420,
      margin: '0 auto',
      paddingBottom: 'calc(140px + env(safe-area-inset-bottom, 0px))',
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
            {/* Toggle switch */}
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

        {/* Account section */}
        <div style={{
          background: theme.card,
          borderRadius: 20,
          padding: '16px',
          boxShadow: theme.cardShadow,
          border: `1px solid ${theme.cardBorder}`,
        }}>
          <SectionHeader
            icon={<PersonIcon size={18} color={theme.textSecondary} />}
            title="Account"
            sub="Your login details"
            theme={theme}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: theme.textSecondary, letterSpacing: '0.04em' }}>NAME</label>
              <div style={{
                padding: '12px 14px', borderRadius: 12,
                background: theme.inputBg, border: `1px solid ${theme.cardBorder}`,
                fontSize: 15, color: theme.textPrimary, fontWeight: 500,
              }}>
                {session?.user?.user_metadata?.name || '—'}
              </div>
            </div>
            {/* Email */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: theme.textSecondary, letterSpacing: '0.04em' }}>EMAIL</label>
              <div style={{
                padding: '12px 14px', borderRadius: 12,
                background: theme.inputBg, border: `1px solid ${theme.cardBorder}`,
                fontSize: 15, color: theme.textSecondary,
              }}>
                {session?.user?.email || '—'}
              </div>
            </div>
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
                Based on your weight — hydration decay will adjust accordingly
              </p>
            </div>
          )}
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

        {/* Cloud Sync */}
        {session && (
          <div style={{
            background: theme.card,
            borderRadius: 20,
            padding: '16px',
            boxShadow: theme.cardShadow,
            border: `1px solid ${theme.cardBorder}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: theme.textPrimary, margin: 0 }}>Cloud Sync</p>
                <p style={{ fontSize: 12, color: theme.textSecondary, margin: '2px 0 0' }}>Pull latest data from cloud</p>
              </div>
              <button
                onClick={handleSyncNow}
                disabled={syncing}
                style={{
                  padding: '8px 16px',
                  borderRadius: 10,
                  border: `1px solid ${theme.cardBorder}`,
                  background: syncing ? 'rgba(0,0,0,0.04)' : theme.inputBg,
                  color: theme.textPrimary,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: syncing ? 'default' : 'pointer',
                  opacity: syncing ? 0.6 : 1,
                  fontFamily: 'inherit',
                }}
              >
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>
            {syncMsg && (
              <p style={{
                fontSize: 12,
                marginTop: 8,
                color: syncMsg === 'Synced successfully' ? '#16a34a' : '#dc2626',
                fontWeight: 500,
                margin: '8px 0 0',
              }}>
                {syncMsg}
              </p>
            )}
          </div>
        )}

        {/* Password section */}
        <div style={{
          background: theme.card,
          borderRadius: 20,
          padding: '16px',
          boxShadow: theme.cardShadow,
          border: `1px solid ${theme.cardBorder}`,
        }}>
          <SectionHeader
            icon={<LockIcon size={18} color={theme.textSecondary} />}
            title="Password"
            sub="Update your account password"
            theme={theme}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <InputField
              label="CURRENT PASSWORD"
              value={passwordForm.current}
              onChange={v => setPasswordForm(f => ({ ...f, current: v }))}
              placeholder="••••••••"
              type="password"
              theme={theme}
            />
            <InputField
              label="NEW PASSWORD"
              value={passwordForm.next}
              onChange={v => setPasswordForm(f => ({ ...f, next: v }))}
              placeholder="••••••••"
              type="password"
              theme={theme}
            />
            <InputField
              label="CONFIRM NEW PASSWORD"
              value={passwordForm.confirm}
              onChange={v => setPasswordForm(f => ({ ...f, confirm: v }))}
              placeholder="••••••••"
              type="password"
              theme={theme}
            />
          </div>
          {passwordMsg && (
            <p style={{
              fontSize: 12,
              marginTop: 10,
              color: passwordMsg === 'Password updated' ? '#16a34a' : '#dc2626',
              fontWeight: 500,
            }}>
              {passwordMsg}
            </p>
          )}
          <button
            onClick={handlePasswordReset}
            style={{
              marginTop: 12,
              width: '100%',
              background: darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
              color: theme.textPrimary,
              border: `1px solid ${theme.cardBorder}`,
              borderRadius: 12,
              padding: '12px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Update Password
          </button>
        </div>

        {/* Log out */}
        <button
          onClick={onLogout}
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
          Log Out
        </button>

        {/* Delete account */}
        <button
          onClick={async () => {
            if (!window.confirm('Delete your account? This cannot be undone.')) return;
            await supabase.auth.signOut();
            localStorage.clear();
            onLogout();
          }}
          style={{
            width: '100%',
            background: 'transparent',
            color: theme.textTertiary,
            border: 'none',
            borderRadius: 16,
            padding: '10px 20px',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            letterSpacing: '-0.01em',
            fontFamily: 'inherit',
            textDecoration: 'underline',
          }}
        >
          Delete Account
        </button>

      </div>
    </div>
  );
}
