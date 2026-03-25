import { useState } from 'react';
import { analyzeActivity } from '../api/activityAnalyzer';
import type { ActivityResult } from '../engine/hydrationEngine';
import { ActivityIcon } from './Icons';
import { useTheme, getTheme } from '../context/ThemeContext';

interface Props {
  onActivity: (result: ActivityResult) => void;
}

type Status = 'idle' | 'loading' | 'confirming' | 'error';

interface InputState {
  text: string;
  status: Status;
  result: ActivityResult | null;
  error: string | null;
}

export default function ActivityInput({ onActivity }: Props) {
  const isDark = useTheme();
  const theme = getTheme(isDark);
  const [state, setState] = useState<InputState>({
    text: '',
    status: 'idle',
    result: null,
    error: null,
  });

  const handleSubmit = async () => {
    const trimmed = state.text.trim();
    if (!trimmed || state.status === 'loading') return;

    setState(prev => ({ ...prev, status: 'loading', error: null }));

    try {
      const result = await analyzeActivity(trimmed);
      setState(prev => ({ ...prev, status: 'confirming', result, error: null }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'NOT_AN_ACTIVITY') {
        setState(prev => ({
          ...prev,
          status: 'error',
          error: "That doesn't look like an activity — try something like 'went for a run' or 'swam for 30 minutes'",
        }));
      } else if (msg.includes('VITE_ANTHROPIC_API_KEY')) {
        setState(prev => ({
          ...prev,
          status: 'error',
          error: 'Add your API key to .env to use activity tracking',
        }));
      } else {
        setState(prev => ({
          ...prev,
          status: 'error',
          error: 'Could not analyze — try again',
        }));
      }
      setTimeout(() => setState(prev => ({ ...prev, status: 'idle', error: null })), 5000);
    }
  };

  const handleConfirm = () => {
    if (state.result) {
      onActivity(state.result);
      setState({ text: '', status: 'idle', result: null, error: null });
    }
  };

  const handleCancel = () => {
    setState(prev => ({ ...prev, status: 'idle', result: null }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const deltaText = state.result
    ? `${state.result.hydrationDelta.toFixed(1)}%`
    : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

      {/* Confirming card */}
      {state.status === 'confirming' && state.result && (
        <div
          className="glass-strong animate-fade-up"
          style={{
            borderRadius: 16,
            padding: '14px 16px',
            borderLeft: '3px solid rgba(239,68,68,0.4)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ActivityIcon size={18} color="#dc2626" />
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, fontSize: 14, color: theme.textPrimary, margin: 0 }}>
                {state.result.activityType}
              </p>
              <p style={{ fontSize: 12, color: theme.textSecondary, margin: '2px 0 0' }}>
                {state.result.durationMin >= 60
                  ? `${(state.result.durationMin / 60).toFixed(1).replace('.0', '')}h`
                  : `${Math.round(state.result.durationMin)} min`}
                {' '}· ~{Math.round(state.result.sweatLossML)}ml sweat lost
              </p>
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#dc2626', flexShrink: 0 }}>
              {deltaText}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleConfirm}
              style={{
                flex: 1,
                borderRadius: 12,
                padding: '10px 0',
                background: '#111827',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Log activity
            </button>
            <button
              onClick={handleCancel}
              style={{
                borderRadius: 12,
                padding: '10px 16px',
                background: 'transparent',
                color: theme.textSecondary,
                border: `1px solid ${theme.cardBorder}`,
                fontWeight: 500,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {state.status === 'error' && state.error && (
        <div
          className="glass animate-fade-up"
          style={{ borderRadius: 14, padding: '10px 14px', borderLeft: '3px solid #dc2626' }}
        >
          <p style={{ fontSize: 13, color: '#dc2626', margin: 0 }}>{state.error}</p>
        </div>
      )}

      {/* Input row — always visible unless confirming */}
      {state.status !== 'confirming' && (
        <div
          className="glass"
          style={{
            borderRadius: 16,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <ActivityIcon size={18} color={theme.textTertiary} />
          <input
            type="text"
            value={state.text}
            onChange={e => setState(prev => ({ ...prev, text: e.target.value }))}
            onKeyDown={handleKeyDown}
            placeholder="Log an activity — AI will calculate fluid loss"
            disabled={state.status === 'loading'}
            style={{
              color: theme.textPrimary,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              flex: 1,
              fontSize: 14,
              fontFamily: 'inherit',
              opacity: state.status === 'loading' ? 0.5 : 1,
            }}
          />

          {/* Loading spinner */}
          {state.status === 'loading' ? (
            <div style={{
              width: 28, height: 28,
              borderRadius: 8,
              background: theme.divider,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <div style={{
                width: 14, height: 14,
                borderRadius: '50%',
                border: `2px solid ${theme.cardBorder}`,
                borderTopColor: theme.textPrimary,
                animation: 'spin 0.7s linear infinite',
              }} />
            </div>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!state.text.trim()}
              style={{
                width: 28, height: 28,
                borderRadius: 8,
                background: state.text.trim() ? theme.textPrimary : theme.divider,
                border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: state.text.trim() ? 'pointer' : 'default',
                flexShrink: 0,
                transition: 'background 0.15s ease',
              }}
            >
              <svg
                width={14} height={14} viewBox="0 0 24 24" fill="none"
                stroke={state.text.trim() ? (isDark ? '#0f1117' : '#ffffff') : theme.textTertiary}
                strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="M12 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
