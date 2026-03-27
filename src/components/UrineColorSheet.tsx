import { useRef, useState } from 'react';
import { useTheme, getTheme } from '../context/ThemeContext';
import { XIcon } from './Icons';
import { analyzeUrineColor } from '../api/urineAnalyzer';

export interface UrineColorResult {
  label: string;
  adjustment: number;
  feedback: string;
}

const STOPS = [
  { hex: '#fef9c3', label: 'Clear',       sub: 'Very pale'  },
  { hex: '#fef08a', label: 'Pale straw',  sub: 'Great'      },
  { hex: '#fde047', label: 'Yellow',      sub: 'Normal'     },
  { hex: '#eab308', label: 'Dark yellow', sub: 'Drink soon' },
  { hex: '#d97706', label: 'Amber',       sub: 'Dehydrated' },
  { hex: '#b45309', label: 'Orange',      sub: 'Very low'   },
  { hex: '#7c2d12', label: 'Brown',       sub: 'Urgent'     },
];

const GRADIENT = `linear-gradient(to right, ${STOPS.map(s => s.hex).join(', ')})`;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
}

function interpolateColor(t: number): string {
  const n = STOPS.length - 1;
  const i = Math.min(Math.floor(t * n), n - 1);
  const f = t * n - i;
  const [r1, g1, b1] = hexToRgb(STOPS[i].hex);
  const [r2, g2, b2] = hexToRgb(STOPS[i + 1].hex);
  return rgbToHex(r1 + (r2 - r1) * f, g1 + (g2 - g1) * f, b1 + (b2 - b1) * f);
}

function getNearestStop(t: number) {
  const idx = Math.round(t * (STOPS.length - 1));
  return STOPS[Math.max(0, Math.min(STOPS.length - 1, idx))];
}

interface Props {
  currentLevel: number;
  onResult: (result: UrineColorResult) => void;
  onClose: () => void;
}

type Phase = 'sliding' | 'analyzing' | 'result';

export default function UrineColorSheet({ currentLevel, onResult, onClose }: Props) {
  const isDark = useTheme();
  const theme = getTheme(isDark);
  const trackRef = useRef<HTMLDivElement>(null);

  const [position, setPosition] = useState(0.3); // start near yellow
  const [phase, setPhase] = useState<Phase>('sliding');
  const [aiResult, setAiResult] = useState<{ adjustment: number; newLevel: number; feedback: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentColor = interpolateColor(position);
  const currentStop = getNearestStop(position);

  const getPos = (clientX: number) => {
    if (!trackRef.current) return position;
    const rect = trackRef.current.getBoundingClientRect();
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (phase !== 'sliding') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setPosition(getPos(e.clientX));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (phase !== 'sliding' || !e.buttons) return;
    setPosition(getPos(e.clientX));
  };

  const handleSelect = async () => {
    if (phase !== 'sliding') return;
    setPhase('analyzing');
    setError(null);
    try {
      const result = await analyzeUrineColor(currentStop.label, currentLevel);
      setAiResult(result);
      setPhase('result');
    } catch {
      setError('Could not analyze — tap Apply to use a standard calibration.');
      // Fallback adjustments mirroring the original static table
      const fallbackMap: Record<string, number> = {
        'Clear': 8, 'Pale straw': 4, 'Yellow': 0,
        'Dark yellow': -6, 'Amber': -13, 'Orange': -20, 'Brown': -28,
      };
      const adj = fallbackMap[currentStop.label] ?? 0;
      setAiResult({ adjustment: adj, newLevel: Math.max(0, Math.min(100, currentLevel + adj)), feedback: '' });
      setPhase('result');
    }
  };

  const handleApply = () => {
    if (!aiResult) return;
    onResult({
      label: currentStop.label,
      adjustment: aiResult.adjustment,
      feedback: aiResult.feedback,
    });
  };

  const isPositive = (aiResult?.adjustment ?? 0) >= 0;
  const deltaColor = isPositive ? '#16a34a' : '#dc2626';
  const deltaText = aiResult
    ? `${isPositive ? '+' : ''}${aiResult.adjustment}%`
    : null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={phase === 'sliding' ? onClose : undefined}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 40,
          animation: 'fadeIn 0.2s ease forwards',
        }}
      />

      {/* Sheet */}
      <div
        className="animate-slide-up"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          margin: '0 auto', maxWidth: 420,
          background: theme.card,
          borderRadius: '24px 24px 0 0',
          zIndex: 50,
          paddingBottom: 'calc(28px + env(safe-area-inset-bottom, 0px))',
          boxShadow: '0 -4px 32px rgba(0,0,0,0.2)',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: theme.divider }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px 0' }}>
          <div>
            <p style={{ fontSize: 17, fontWeight: 700, color: theme.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>
              Color Check
            </p>
            <p style={{ fontSize: 12, color: theme.textSecondary, margin: '2px 0 0' }}>
              Slide to match your urine color
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 9,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
              border: 'none', cursor: 'pointer',
            }}
          >
            <XIcon size={14} color={theme.textSecondary} />
          </button>
        </div>

        {/* Current color display */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px 0' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
            background: currentColor,
            border: '2px solid rgba(0,0,0,0.1)',
            boxShadow: `0 4px 12px ${currentColor}66`,
            transition: 'background 0.05s ease, box-shadow 0.05s ease',
          }} />
          <div>
            <p style={{ fontSize: 18, fontWeight: 700, color: theme.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>
              {currentStop.label}
            </p>
            <p style={{ fontSize: 13, color: theme.textSecondary, margin: '2px 0 0' }}>
              {currentStop.sub}
            </p>
          </div>
          {/* Show delta once result is in */}
          {phase === 'result' && deltaText && (
            <div style={{ marginLeft: 'auto' }}>
              <p style={{ fontSize: 20, fontWeight: 800, color: deltaColor, margin: 0, letterSpacing: '-0.02em', textAlign: 'right' }}>
                {deltaText}
              </p>
              {aiResult && (
                <p style={{ fontSize: 11, color: theme.textTertiary, margin: '2px 0 0', textAlign: 'right' }}>
                  → {aiResult.newLevel}%
                </p>
              )}
            </div>
          )}
        </div>

        {/* Slider */}
        <div style={{ padding: '20px 20px 0' }}>
          {/* Track wrapper — this is the touch target */}
          <div
            ref={trackRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            style={{
              position: 'relative',
              height: 48,
              display: 'flex',
              alignItems: 'center',
              cursor: phase === 'sliding' ? 'pointer' : 'default',
              touchAction: 'none',
              userSelect: 'none',
            }}
          >
            {/* Gradient track */}
            <div style={{
              position: 'absolute', left: 0, right: 0,
              height: 14, borderRadius: 7,
              background: GRADIENT,
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.25)',
            }} />

            {/* Thumb */}
            <div style={{
              position: 'absolute',
              left: `${position * 100}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 34, height: 34,
              borderRadius: '50%',
              background: currentColor,
              border: `3px solid ${isDark ? '#1a1a2e' : '#ffffff'}`,
              boxShadow: '0 2px 10px rgba(0,0,0,0.35)',
              transition: 'background 0.05s ease',
              pointerEvents: 'none',
              zIndex: 1,
            }} />
          </div>

          {/* End labels */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 500, color: theme.textTertiary }}>Clear</span>
            <span style={{ fontSize: 10, fontWeight: 500, color: theme.textTertiary }}>Brown</span>
          </div>
        </div>

        {/* AI result feedback */}
        {phase === 'result' && aiResult?.feedback && (
          <div style={{
            margin: '14px 20px 0',
            padding: '12px 14px',
            borderRadius: 12,
            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
            border: `1px solid ${theme.cardBorder}`,
          }}>
            <p style={{ fontSize: 13, color: theme.textSecondary, margin: 0, lineHeight: 1.55 }}>
              {aiResult.feedback}
            </p>
          </div>
        )}

        {error && (
          <p style={{ fontSize: 12, color: '#dc2626', margin: '10px 20px 0' }}>{error}</p>
        )}

        {/* Action button */}
        <div style={{ padding: '14px 20px 0' }}>
          {phase === 'sliding' && (
            <button
              onClick={handleSelect}
              style={{
                width: '100%', border: 'none', borderRadius: 14,
                padding: '14px', fontSize: 15, fontWeight: 700,
                background: theme.textPrimary,
                color: isDark ? '#0f1117' : '#ffffff',
                cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.01em',
              }}
            >
              Select this color
            </button>
          )}

          {phase === 'analyzing' && (
            <div style={{
              width: '100%', borderRadius: 14, padding: '14px',
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              border: `1px solid ${theme.cardBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}>
              <div style={{
                width: 16, height: 16, borderRadius: '50%',
                border: `2px solid ${theme.cardBorder}`,
                borderTopColor: theme.textPrimary,
                animation: 'spin 0.7s linear infinite',
              }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: theme.textSecondary }}>
                AI is calibrating…
              </span>
            </div>
          )}

          {phase === 'result' && (
            <button
              onClick={handleApply}
              style={{
                width: '100%', border: 'none', borderRadius: 14,
                padding: '14px', fontSize: 15, fontWeight: 700,
                background: isPositive ? '#16a34a' : '#dc2626',
                color: '#ffffff',
                cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.01em',
              }}
            >
              Apply Calibration
            </button>
          )}
        </div>
      </div>
    </>
  );
}
