import { useRef, useState } from 'react';
import { useTheme, getTheme } from '../context/ThemeContext';
import type { DrinkType } from '../engine/hydrationEngine';
import { analyzeDrinkPhoto } from '../api/drinkAnalyzer';
import {
  WaterIcon,
  CoffeeIcon,
  EnergyIcon,
  TeaIcon,
  JuiceIcon,
  SodaIcon,
  ElectrolyteIcon,
  AlcoholIcon,
  ScanDrinkIcon,
} from './Icons';

interface Props {
  onSelectDrink: (type: DrinkType) => void;
  onScanConfirm: (type: DrinkType, volumeMl: number, displayName: string) => void;
  hangoverMode?: boolean;
}

// Recovery priority: 'best' = highlight green, 'good' = subtle green, 'avoid' = dim + warn
const RECOVERY_PRIORITY: Partial<Record<DrinkType, 'best' | 'good' | 'avoid'>> = {
  water:        'best',
  electrolyte:  'best',
  juice:        'good',
  tea:          'good',
  coffee:       'avoid',
  energy_drink: 'avoid',
  soda:         'avoid',
  alcohol:      'avoid',
};

const QUICK_DRINKS: Array<{ type: DrinkType; label: string }> = [
  { type: 'water',        label: 'Water' },
  { type: 'coffee',       label: 'Coffee' },
  { type: 'energy_drink', label: 'Energy' },
  { type: 'tea',          label: 'Tea' },
  { type: 'juice',        label: 'Juice' },
  { type: 'soda',         label: 'Soda' },
  { type: 'electrolyte',  label: 'Electro.' },
  { type: 'alcohol',      label: 'Alcohol' },
];

function getDrinkIcon(type: DrinkType, size: number = 20, color: string = 'rgba(0,0,0,0.45)') {
  switch (type) {
    case 'water': return <WaterIcon size={size} color={color} />;
    case 'coffee': return <CoffeeIcon size={size} color={color} />;
    case 'energy_drink': return <EnergyIcon size={size} color={color} />;
    case 'tea': return <TeaIcon size={size} color={color} />;
    case 'juice': return <JuiceIcon size={size} color={color} />;
    case 'soda': return <SodaIcon size={size} color={color} />;
    case 'electrolyte': return <ElectrolyteIcon size={size} color={color} />;
    case 'alcohol': return <AlcoholIcon size={size} color={color} />;
    default: return <WaterIcon size={size} color={color} />;
  }
}

interface AnalyzingState {
  status: 'idle' | 'analyzing' | 'confirming' | 'error';
  displayName?: string;
  type?: DrinkType;
  volume?: number;
  notes?: string;
  error?: string;
}

export default function DrinkInput({ onSelectDrink, onScanConfirm, hangoverMode = false }: Props) {
  const isDark = useTheme();
  const theme = getTheme(isDark);
  const fileRef = useRef<HTMLInputElement>(null);
  const [analyzing, setAnalyzing] = useState<AnalyzingState>({ status: 'idle' });

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setAnalyzing({ status: 'analyzing' });
    try {
      const base64 = await fileToBase64(file);
      const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
      const result = await analyzeDrinkPhoto(base64, mediaType);
      setAnalyzing({
        status: 'confirming',
        displayName: result.display_name,
        type: result.drink_type,
        volume: result.estimated_volume_ml,
        notes: result.notes,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to analyze';
      setAnalyzing({ status: 'error', error: msg });
      setTimeout(() => setAnalyzing({ status: 'idle' }), 3000);
    }
  };

  const confirmPhoto = () => {
    if (!analyzing.type || !analyzing.volume) return;
    if (analyzing.type === 'alcohol') {
      // Alcohol needs modal — type (beer/wine/liquor) and count matter too much
      onSelectDrink(analyzing.type);
    } else {
      // Type and volume are known — log directly, no modal needed
      onScanConfirm(analyzing.type, analyzing.volume, analyzing.displayName ?? '');
    }
    setAnalyzing({ status: 'idle' });
  };

  return (
    <div className="w-full px-4 flex flex-col gap-3">
      {/* Photo confirmation */}
      {analyzing.status === 'confirming' && (
        <div
          className="glass-strong rounded-2xl p-4 animate-fade-up flex flex-col gap-3"
          style={{ borderLeft: '3px solid rgba(6,182,212,0.5)' }}
        >
          <div className="flex items-center gap-3">
            <div style={{ flexShrink: 0 }}>
              {analyzing.type ? getDrinkIcon(analyzing.type, 24, '#111827') : <WaterIcon size={24} color="#111827" />}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: theme.textPrimary }}>{analyzing.displayName}</p>
              <p className="text-xs" style={{ color: theme.textSecondary }}>
                ~{analyzing.volume}ml detected
              </p>
            </div>
          </div>
          {analyzing.notes && (
            <p className="text-xs" style={{ color: theme.textSecondary }}>{analyzing.notes}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={confirmPhoto}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold"
              style={{
                background: '#111827',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Add this drink
            </button>
            <button
              onClick={() => setAnalyzing({ status: 'idle' })}
              className="rounded-xl px-4 py-2.5 text-sm"
              style={{
                background: 'transparent',
                color: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(0,0,0,0.1)',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Analyzing spinner */}
      {analyzing.status === 'analyzing' && (
        <div className="glass rounded-2xl px-4 py-3 flex items-center gap-3 animate-fade-up">
          <div style={{
            width: 16, height: 16, borderRadius: '50%',
            border: '2px solid rgba(0,0,0,0.1)',
            borderTopColor: '#111827',
            animation: 'spin 0.8s linear infinite',
            flexShrink: 0,
          }} />
          <p className="text-sm" style={{ color: theme.textSecondary }}>Analyzing your drink...</p>
        </div>
      )}

      {/* Error */}
      {analyzing.status === 'error' && (
        <div className="glass rounded-2xl px-4 py-3 animate-fade-up" style={{ borderLeft: '3px solid #dc2626' }}>
          <p className="text-sm" style={{ color: '#dc2626' }}>
            {analyzing.error?.includes('VITE_ANTHROPIC_API_KEY')
              ? 'Add your API key to .env to use photo detection'
              : 'Could not analyze — try again'}
          </p>
        </div>
      )}

      {/* Photo button — primary CTA */}
      <button
        onClick={() => fileRef.current?.click()}
        disabled={analyzing.status === 'analyzing'}
        className="w-full rounded-2xl drink-btn"
        style={{
          opacity: analyzing.status === 'analyzing' ? 0.55 : 1,
          cursor: 'pointer',
          background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
          border: 'none',
          padding: '15px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          boxShadow: '0 4px 20px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.12)',
        }}
      >
        <ScanDrinkIcon size={20} color="rgba(255,255,255,0.9)" />
        <span style={{ color: '#ffffff', fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>
          Scan your drink
        </span>
        <span style={{
          marginLeft: 'auto',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.4)',
          paddingLeft: 4,
        }}>
          AI
        </span>
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoChange}
        style={{ display: 'none' }}
      />

      {/* Recovery mode label */}
      {hangoverMode && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 2 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', flexShrink: 0, display: 'inline-block' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: '#15803d', letterSpacing: '0.04em' }}>
            RECOVERY PICKS HIGHLIGHTED
          </span>
        </div>
      )}

      {/* Quick drink grid — row 1: Water, Coffee, Energy, Tea */}
      <div className="grid grid-cols-4 gap-2">
        {QUICK_DRINKS.slice(0, 4).map((d) => (
          <QuickDrinkButton key={d.type} type={d.type} label={d.label} onSelectDrink={onSelectDrink} hangoverMode={hangoverMode} />
        ))}
      </div>
      {/* Quick drink grid — row 2: Juice, Soda, Electrolytes, Alcohol */}
      <div className="grid grid-cols-4 gap-2">
        {QUICK_DRINKS.slice(4).map((d) => (
          <QuickDrinkButton key={d.type} type={d.type} label={d.label} onSelectDrink={onSelectDrink} hangoverMode={hangoverMode} />
        ))}
      </div>
    </div>
  );
}

function QuickDrinkButton({
  type, label, onSelectDrink, hangoverMode,
}: {
  type: DrinkType;
  label: string;
  onSelectDrink: (t: DrinkType) => void;
  hangoverMode: boolean;
}) {
  const isDark = useTheme();
  const theme = getTheme(isDark);
  const [flash, setFlash] = useState(false);

  const handleClick = () => {
    setFlash(true);
    setTimeout(() => setFlash(false), 300);
    onSelectDrink(type);
  };

  const priority = hangoverMode ? RECOVERY_PRIORITY[type] : undefined;

  // Style tokens per priority
  const isBest   = priority === 'best';
  const isGood   = priority === 'good';
  const isAvoid  = priority === 'avoid';

  const bg = flash
    ? isBest ? '#f0fdf4' : isGood ? '#f0fdf4' : theme.inputBg
    : isBest ? '#f0fdf4' : isGood ? '#f7fef9' : theme.card;

  const border = isBest
    ? '1.5px solid #16a34a'
    : isGood
    ? '1.5px solid rgba(22,163,74,0.35)'
    : isAvoid
    ? `1px solid ${theme.cardBorder}`
    : `1px solid ${theme.cardBorder}`;

  const iconColor = isBest
    ? '#15803d'
    : isGood
    ? '#22c55e'
    : isAvoid
    ? theme.textTertiary
    : theme.textSecondary;

  const labelColor = isBest
    ? '#15803d'
    : isGood
    ? '#16a34a'
    : isAvoid
    ? theme.textTertiary
    : theme.textSecondary;

  const opacity = isAvoid ? 0.55 : 1;

  const boxShadow = isBest
    ? '0 2px 12px rgba(22,163,74,0.18), 0 1px 3px rgba(22,163,74,0.1)'
    : isGood
    ? '0 1px 6px rgba(22,163,74,0.1)'
    : theme.cardShadow;

  return (
    <button
      data-drink={type}
      onClick={handleClick}
      className="rounded-2xl py-3 flex flex-col items-center gap-1.5 drink-btn"
      style={{
        position: 'relative',
        background: bg,
        border,
        boxShadow,
        opacity,
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      }}
    >
      {/* Best pick dot indicator */}
      {isBest && (
        <span style={{
          position: 'absolute',
          top: 6, right: 6,
          width: 6, height: 6,
          borderRadius: '50%',
          background: '#16a34a',
        }} />
      )}
      {getDrinkIcon(type, 20, iconColor)}
      <span className="text-xs font-medium leading-tight text-center" style={{ color: labelColor }}>
        {label}
      </span>
    </button>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
