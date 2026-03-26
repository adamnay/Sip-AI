import { useState } from 'react';
import { useTheme, getTheme } from '../context/ThemeContext';
import { XIcon } from './Icons';

export interface UrineColorResult {
  label: string;
  adjustment: number;
  feedback: string;
}

const COLORS: Array<{
  hex: string;
  label: string;
  sub: string;
  adjustment: number;
  feedback: string;
}> = [
  {
    hex: '#fef9c3',
    label: 'Clear',
    sub: 'Very pale',
    adjustment: 8,
    feedback: "You're very well hydrated — maybe a little over. Ease up if you're forcing it.",
  },
  {
    hex: '#fef08a',
    label: 'Pale straw',
    sub: 'Great',
    adjustment: 4,
    feedback: "Excellent hydration — keep doing what you're doing.",
  },
  {
    hex: '#fde047',
    label: 'Yellow',
    sub: 'Normal',
    adjustment: 0,
    feedback: "You're hydrated normally. Drink a glass soon to stay on track.",
  },
  {
    hex: '#eab308',
    label: 'Dark yellow',
    sub: 'Drink soon',
    adjustment: -6,
    feedback: "A little low — drink 8–12 oz of water now.",
  },
  {
    hex: '#d97706',
    label: 'Amber',
    sub: 'Dehydrated',
    adjustment: -13,
    feedback: "You're dehydrated. Drink 16 oz of water now and skip caffeine.",
  },
  {
    hex: '#b45309',
    label: 'Orange',
    sub: 'Very low',
    adjustment: -20,
    feedback: "Significantly dehydrated. Drink 20+ oz right away — electrolytes will help.",
  },
  {
    hex: '#7c2d12',
    label: 'Brown',
    sub: 'Urgent',
    adjustment: -28,
    feedback: "Severely dehydrated. Hydrate immediately with water and electrolytes.",
  },
];

interface Props {
  onResult: (result: UrineColorResult) => void;
  onClose: () => void;
}

export default function UrineColorSheet({ onResult, onClose }: Props) {
  const isDark = useTheme();
  const theme = getTheme(isDark);
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleSelect = (i: number) => {
    if (confirmed) return;
    setSelected(i);
  };

  const handleConfirm = () => {
    if (selected === null || confirmed) return;
    setConfirmed(true);
    const c = COLORS[selected];
    setTimeout(() => {
      onResult({ label: c.label, adjustment: c.adjustment, feedback: c.feedback });
    }, 400);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
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
          paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
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
              Hydration Check
            </p>
            <p style={{ fontSize: 12, color: theme.textSecondary, margin: '2px 0 0' }}>
              Match your urine color to calibrate your level
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

        {/* Color scale */}
        <div style={{ padding: '20px 20px 0', display: 'flex', gap: 8 }}>
          {COLORS.map((c, i) => {
            const isSelected = selected === i;
            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {/* Color swatch */}
                <div style={{
                  width: '100%',
                  aspectRatio: '1',
                  borderRadius: 12,
                  background: c.hex,
                  border: isSelected
                    ? `2.5px solid ${theme.textPrimary}`
                    : `1.5px solid rgba(0,0,0,0.1)`,
                  boxShadow: isSelected
                    ? `0 0 0 3px ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`
                    : 'none',
                  transition: 'all 0.15s ease',
                  transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                }} />
                {/* Label */}
                <span style={{
                  fontSize: 9,
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? theme.textPrimary : theme.textTertiary,
                  textAlign: 'center',
                  lineHeight: 1.2,
                }}>
                  {c.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected feedback */}
        <div style={{
          minHeight: 52,
          margin: '16px 20px 0',
          padding: selected !== null ? '11px 14px' : 0,
          borderRadius: 12,
          background: selected !== null
            ? isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
            : 'transparent',
          border: selected !== null ? `1px solid ${theme.cardBorder}` : 'none',
          transition: 'all 0.2s ease',
        }}>
          {selected !== null && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: 3, background: COLORS[selected].hex,
                  border: '1px solid rgba(0,0,0,0.15)', flexShrink: 0,
                }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: theme.textPrimary }}>
                  {COLORS[selected].label} · {COLORS[selected].sub}
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 600, marginLeft: 'auto', flexShrink: 0,
                  color: COLORS[selected].adjustment >= 0 ? '#16a34a' : '#dc2626',
                }}>
                  {COLORS[selected].adjustment >= 0 ? '+' : ''}{COLORS[selected].adjustment}%
                </span>
              </div>
              <p style={{ fontSize: 12, color: theme.textSecondary, margin: 0, lineHeight: 1.5 }}>
                {COLORS[selected].feedback}
              </p>
            </>
          )}
        </div>

        {/* Confirm button */}
        <div style={{ padding: '14px 20px 0' }}>
          <button
            onClick={handleConfirm}
            disabled={selected === null || confirmed}
            style={{
              width: '100%',
              background: confirmed ? '#16a34a' : theme.textPrimary,
              color: isDark ? '#0f1117' : '#ffffff',
              border: 'none', borderRadius: 14,
              padding: '14px', fontSize: 15, fontWeight: 700,
              cursor: selected === null || confirmed ? 'default' : 'pointer',
              opacity: selected === null ? 0.4 : 1,
              fontFamily: 'inherit', letterSpacing: '-0.01em',
              transition: 'all 0.2s ease',
            }}
          >
            {confirmed ? 'Calibrated!' : 'Log this color'}
          </button>
        </div>
      </div>
    </>
  );
}
