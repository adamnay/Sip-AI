import { useRef, useState } from 'react';
import { useTheme, getTheme } from '../context/ThemeContext';
import type { DrinkType, DrinkOverrides } from '../engine/hydrationEngine';
import { analyzeDrinkPhoto, analyzeDrinkName } from '../api/drinkAnalyzer';
import { feedbackAdd } from '../utils/feedback';
import CameraScanner from './CameraScanner';
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
  onScanConfirm: (type: DrinkType, volumeMl: number, displayName: string, thumbnail?: string) => void;
  onScanEditConfirm?: (type: DrinkType, volumeMl: number, overrides: DrinkOverrides) => void;
  hangoverMode?: boolean;
}

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

// ── Helpers shared with BottomNav scan ────────────────────────────────────────

function detectTypeFromText(text: string): DrinkType {
  const l = text.toLowerCase();
  if (/coffee|latte|espresso|cappuccino|macchiato|mocha|americano|cold brew/.test(l)) return 'coffee';
  if (/\btea\b|matcha|chai/.test(l)) return 'tea';
  if (/juice|lemonade|cider/.test(l)) return 'juice';
  if (/\bsoda\b|cola|pepsi|sprite|fanta|ginger ale|dr pepper|7.?up/.test(l)) return 'soda';
  if (/red bull|monster|celsius|bang|prime|reign|energy drink/.test(l)) return 'energy_drink';
  if (/gatorade|pedialyte|liquid i\.?v|lmnt|electrolyte|nuun|powerade|bodyarmor/.test(l)) return 'electrolyte';
  if (/\bwater\b/.test(l)) return 'water';
  if (/beer|wine|vodka|whiskey|rum|gin|tequila|cocktail|champagne|prosecco/.test(l)) return 'alcohol';
  if (/smoothie|protein shake|\bshake\b/.test(l)) return 'smoothie';
  return 'unknown';
}

function parseOzFromText(text: string): number | null {
  const match = text.match(/(\d+(?:\.\d+)?)\s*oz/i);
  return match ? parseFloat(match[1]) : null;
}

// ─────────────────────────────────────────────────────────────────────────────

interface AnalyzingState {
  status: 'idle' | 'analyzing' | 'confirming' | 'editing' | 'error';
  displayName?: string;
  type?: DrinkType;
  volume?: number;
  notes?: string;
  error?: string;
  thumbnail?: string;
}

export default function DrinkInput({ onSelectDrink, onScanConfirm, onScanEditConfirm, hangoverMode = false }: Props) {
  const isDark = useTheme();
  const theme = getTheme(isDark);
  const fileRef = useRef<HTMLInputElement>(null);
  const [analyzing, setAnalyzing] = useState<AnalyzingState>({ status: 'idle' });
  const [editText, setEditText] = useState('');
  const [editAnalyzing, setEditAnalyzing] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);
  const [showScanner, setShowScanner] = useState(false);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setAnalyzing({ status: 'analyzing' });
    try {
      const [base64, thumbnail] = await Promise.all([
        fileToBase64(file),
        makeThumbnail(file),
      ]);
      const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
      const result = await analyzeDrinkPhoto(base64, mediaType);
      setAnalyzing({
        status: 'confirming',
        displayName: result.display_name,
        type: result.drink_type,
        volume: result.estimated_volume_ml,
        notes: result.notes,
        thumbnail,
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
      onSelectDrink(analyzing.type);
    } else {
      onScanConfirm(analyzing.type, analyzing.volume, analyzing.displayName ?? '', analyzing.thumbnail);
    }
    setAnalyzing({ status: 'idle' });
  };

  const handleStartEdit = () => {
    setEditText(analyzing.displayName ?? '');
    setAnalyzing(prev => ({ ...prev, status: 'editing' }));
    setTimeout(() => editInputRef.current?.focus(), 120);
  };

  const handleEditSubmit = async () => {
    if (!editText.trim() || editAnalyzing) return;
    setEditAnalyzing(true);
    try {
      const detectedType = detectTypeFromText(editText);
      const parsedOz = parseOzFromText(editText);
      const volumeMl = parsedOz ? Math.round(parsedOz * 29.57) : (analyzing.volume ?? 473);
      // Strip the size from the name before sending to AI
      const drinkName = editText.replace(/\d+(?:\.\d+)?\s*oz/gi, '').trim().replace(/,\s*$/, '').trim() || editText.trim();
      const analysis = await analyzeDrinkName(drinkName, detectedType);
      feedbackAdd();
      const overrides: DrinkOverrides = {
        hydrationPerMl: analysis.hydrationPerMl,
        caffeinePer100ml: analysis.caffeinePer100ml || undefined,
        electrolyte: analysis.electrolyte || undefined,
        label: analysis.label,
        ...(analyzing.thumbnail ? { scanThumbnail: analyzing.thumbnail } : {}),
      };
      if (onScanEditConfirm) {
        onScanEditConfirm(detectedType, volumeMl, overrides);
      } else {
        onScanConfirm(detectedType, volumeMl, analysis.label, analyzing.thumbnail);
      }
      setAnalyzing({ status: 'idle' });
    } catch {
      // Fallback: log with just the edited name
      feedbackAdd();
      const parsedOz = parseOzFromText(editText);
      const volumeMl = parsedOz ? Math.round(parsedOz * 29.57) : (analyzing.volume ?? 473);
      const label = editText.replace(/\d+(?:\.\d+)?\s*oz/gi, '').trim().slice(0, 20) || editText.slice(0, 20);
      if (onScanEditConfirm) {
        onScanEditConfirm('unknown', volumeMl, { label, ...(analyzing.thumbnail ? { scanThumbnail: analyzing.thumbnail } : {}) });
      } else {
        onScanConfirm('unknown', volumeMl, label, analyzing.thumbnail);
      }
      setAnalyzing({ status: 'idle' });
    } finally {
      setEditAnalyzing(false);
    }
  };

  // ── Camera scanner handlers ───────────────────────────────────────────────
  const handleScanClick = () => {
    if (navigator.mediaDevices) {
      setShowScanner(true);
    } else {
      fileRef.current?.click();
    }
  };

  const handleCameraCapture = async (base64: string) => {
    setShowScanner(false);
    setAnalyzing({ status: 'analyzing' });
    try {
      const [result, thumbnail] = await Promise.all([
        analyzeDrinkPhoto(base64, 'image/jpeg'),
        base64ToThumbnail(base64),
      ]);
      setAnalyzing({
        status: 'confirming',
        displayName: result.display_name,
        type: result.drink_type,
        volume: result.estimated_volume_ml,
        notes: result.notes,
        thumbnail,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to analyze';
      setAnalyzing({ status: 'error', error: msg });
      setTimeout(() => setAnalyzing({ status: 'idle' }), 3000);
    }
  };

  return (
    <>
    {showScanner && (
      <CameraScanner
        onCapture={handleCameraCapture}
        onClose={() => setShowScanner(false)}
      />
    )}
    <div className="w-full px-4 flex flex-col gap-3">

      {/* ── Photo confirmation ─────────────────────────────────────────────── */}
      {analyzing.status === 'confirming' && (
        <div
          className="glass-strong rounded-2xl p-4 animate-fade-up flex flex-col gap-3"
          style={{ borderLeft: '3px solid rgba(6,182,212,0.5)' }}
        >
          <div className="flex items-center gap-3">
            <div style={{ flexShrink: 0 }}>
              {analyzing.thumbnail
                ? <img src={analyzing.thumbnail} alt="" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover', display: 'block' }} />
                : analyzing.type ? getDrinkIcon(analyzing.type, 24, '#111827') : <WaterIcon size={24} color="#111827" />
              }
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: theme.textPrimary }}>{analyzing.displayName}</p>
              <p className="text-xs" style={{ color: theme.textSecondary }}>
                ~{Math.round((analyzing.volume ?? 0) / 29.57)} oz detected
              </p>
            </div>
          </div>
          {analyzing.notes && (
            <p className="text-xs" style={{ color: theme.textSecondary }}>{analyzing.notes}</p>
          )}

          {/* Edit link */}
          <button
            onClick={handleStartEdit}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: '2px 0', fontFamily: 'inherit',
            }}
          >
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={theme.textSecondary} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <span style={{ fontSize: 12, fontWeight: 600, color: theme.textSecondary }}>Not right? Edit</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={confirmPhoto}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold"
              style={{ background: '#111827', color: '#ffffff', border: 'none', cursor: 'pointer' }}
            >
              Add this drink
            </button>
            <button
              onClick={() => setAnalyzing({ status: 'idle' })}
              className="rounded-xl px-4 py-2.5 text-sm"
              style={{ background: 'transparent', color: theme.textSecondary, border: `1px solid ${theme.cardBorder}`, cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Edit / override step ───────────────────────────────────────────── */}
      {analyzing.status === 'editing' && (
        <div
          className="glass-strong rounded-2xl p-4 animate-fade-up flex flex-col gap-3"
          style={{ borderLeft: '3px solid rgba(6,182,212,0.5)' }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setAnalyzing(prev => ({ ...prev, status: 'confirming' }))}
              style={{
                width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center',
                justifyContent: 'center', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                border: 'none', cursor: 'pointer', flexShrink: 0,
              }}
            >
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke={theme.textSecondary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <span style={{ fontSize: 14, fontWeight: 700, color: theme.textPrimary, letterSpacing: '-0.02em' }}>
              Fix the scan
            </span>
          </div>

          <p style={{ fontSize: 12, color: theme.textSecondary, margin: 0 }}>
            What did you actually have? AI will re-analyze the hydration values.
          </p>

          <input
            ref={editInputRef}
            type="text"
            value={editText}
            onChange={e => setEditText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !editAnalyzing && handleEditSubmit()}
            placeholder={`e.g. "iced coffee, 16 oz"`}
            style={{
              width: '100%', border: `1px solid ${theme.cardBorder}`, borderRadius: 12,
              padding: '11px 14px', fontSize: 14, color: theme.textPrimary,
              background: theme.inputBg, outline: 'none', boxSizing: 'border-box',
              fontFamily: 'inherit',
            }}
          />
          <p style={{ fontSize: 11, color: theme.textTertiary, margin: '-6px 0 0' }}>
            Include the size for accuracy — e.g. "16 oz"
          </p>

          <div className="flex gap-2">
            <button
              onClick={handleEditSubmit}
              disabled={!editText.trim() || editAnalyzing}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold"
              style={{
                background: '#111827', color: '#ffffff', border: 'none',
                cursor: (!editText.trim() || editAnalyzing) ? 'default' : 'pointer',
                opacity: (!editText.trim() || editAnalyzing) ? 0.5 : 1,
                transition: 'opacity 0.15s ease',
              }}
            >
              {editAnalyzing ? 'Analyzing...' : 'Analyze & Log →'}
            </button>
            <button
              onClick={() => setAnalyzing({ status: 'idle' })}
              className="rounded-xl px-4 py-2.5 text-sm"
              style={{ background: 'transparent', color: theme.textSecondary, border: `1px solid ${theme.cardBorder}`, cursor: 'pointer' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Analyzing spinner ──────────────────────────────────────────────── */}
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

      {/* ── Error ─────────────────────────────────────────────────────────── */}
      {analyzing.status === 'error' && (
        <div className="glass rounded-2xl px-4 py-3 animate-fade-up" style={{ borderLeft: '3px solid #dc2626' }}>
          <p className="text-sm" style={{ color: '#dc2626' }}>
            {analyzing.error?.includes('VITE_ANTHROPIC_API_KEY')
              ? 'Add your API key to .env to use photo detection'
              : 'Could not analyze — try again'}
          </p>
        </div>
      )}

      {/* ── Scan button ────────────────────────────────────────────────────── */}
      <button
        onClick={handleScanClick}
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
          marginLeft: 'auto', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', paddingLeft: 4,
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

      {/* Quick drink grid */}
      <div className="grid grid-cols-4 gap-2">
        {QUICK_DRINKS.slice(0, 4).map((d) => (
          <QuickDrinkButton key={d.type} type={d.type} label={d.label} onSelectDrink={onSelectDrink} hangoverMode={hangoverMode} />
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {QUICK_DRINKS.slice(4).map((d) => (
          <QuickDrinkButton key={d.type} type={d.type} label={d.label} onSelectDrink={onSelectDrink} hangoverMode={hangoverMode} />
        ))}
      </div>
    </div>
  </>
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
  const isBest  = priority === 'best';
  const isGood  = priority === 'good';
  const isAvoid = priority === 'avoid';

  const bg = flash
    ? isBest ? '#f0fdf4' : isGood ? '#f0fdf4' : theme.inputBg
    : isBest ? '#f0fdf4' : isGood ? '#f7fef9' : theme.card;

  const border = isBest
    ? '1.5px solid #16a34a'
    : isGood ? '1.5px solid rgba(22,163,74,0.35)'
    : `1px solid ${theme.cardBorder}`;

  const iconColor  = isBest ? '#15803d' : isGood ? '#22c55e' : isAvoid ? theme.textTertiary : theme.textSecondary;
  const labelColor = isBest ? '#15803d' : isGood ? '#16a34a' : isAvoid ? theme.textTertiary : theme.textSecondary;
  const boxShadow  = isBest
    ? '0 2px 12px rgba(22,163,74,0.18), 0 1px 3px rgba(22,163,74,0.1)'
    : isGood ? '0 1px 6px rgba(22,163,74,0.1)' : theme.cardShadow;

  return (
    <button
      data-drink={type}
      onClick={handleClick}
      className="rounded-2xl py-3 flex flex-col items-center gap-1.5 drink-btn"
      style={{
        position: 'relative', background: bg, border, boxShadow,
        opacity: isAvoid ? 0.55 : 1, transition: 'all 0.2s ease', cursor: 'pointer',
      }}
    >
      {isBest && (
        <span style={{ position: 'absolute', top: 6, right: 6, width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }} />
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
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function makeThumbnail(file: File, size = 56): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) { URL.revokeObjectURL(url); resolve(''); return; }
      const min = Math.min(img.width, img.height);
      const sx = (img.width - min) / 2;
      const sy = (img.height - min) / 2;
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.75));
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(''); };
    img.src = url;
  });
}

function base64ToThumbnail(base64: string, size = 56): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(''); return; }
      const min = Math.min(img.width, img.height);
      const sx = (img.width - min) / 2;
      const sy = (img.height - min) / 2;
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
      resolve(canvas.toDataURL('image/jpeg', 0.75));
    };
    img.onerror = () => resolve('');
    img.src = `data:image/jpeg;base64,${base64}`;
  });
}
