import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { DrinkType, DrinkOverrides } from '../engine/hydrationEngine';
import { DRINK_PROFILES } from '../engine/hydrationEngine';
import { analyzeDrinkPhoto, analyzeDrinkName } from '../api/drinkAnalyzer';
import type { DrinkAnalysis } from '../api/drinkAnalyzer';
import { HomeIcon, BarChartIcon, GearIcon, XIcon } from './Icons';
import { useTheme, getTheme } from '../context/ThemeContext';
import { feedbackAdd } from '../utils/feedback';
import CameraScanner from './CameraScanner';

type Page = 'home' | 'analytics' | 'settings';

interface Props {
  activePage: Page;
  onNavigate: (page: Page) => void;
  onScanComplete: (type: DrinkType) => void;
  onScanDirectConfirm: (type: DrinkType, volumeMl: number, overrides: DrinkOverrides) => void;
}

type ScanStep = 'result' | 'edit';
type ScanSheet = { step: ScanStep; result: DrinkAnalysis } | null;

const LEFT_TABS: Array<{ page: Page; label: string; Icon: React.FC<{ size?: number; color?: string }> }> = [
  { page: 'home',      label: 'Home',      Icon: HomeIcon },
  { page: 'analytics', label: 'Analytics', Icon: BarChartIcon },
];
const RIGHT_TABS: Array<{ page: Page; label: string; Icon: React.FC<{ size?: number; color?: string }> }> = [
  { page: 'settings', label: 'Settings', Icon: GearIcon },
];

const DRINK_TYPE_LABELS: Partial<Record<DrinkType, string>> = {
  water: 'Water', coffee: 'Coffee', energy_drink: 'Energy Drink',
  tea: 'Tea', juice: 'Juice', soda: 'Soda', electrolyte: 'Electrolytes',
  alcohol: 'Alcohol', smoothie: 'Smoothie', unknown: 'Drink',
};

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
      ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, size, size);
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
      ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, size, size);
      resolve(canvas.toDataURL('image/jpeg', 0.75));
    };
    img.onerror = () => resolve('');
    img.src = `data:image/jpeg;base64,${base64}`;
  });
}

export default function BottomNav({ activePage, onNavigate, onScanComplete, onScanDirectConfirm }: Props) {
  const isDark = useTheme();
  const theme = getTheme(isDark);
  const fileRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanSheet, setScanSheet] = useState<ScanSheet>(null);
  const [scanThumbnail, setScanThumbnail] = useState<string>('');
  const [editText, setEditText] = useState('');
  const [editAnalyzing, setEditAnalyzing] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setScanning(true);
    try {
      const [base64, thumb] = await Promise.all([fileToBase64(file), makeThumbnail(file)]);
      const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
      const result = await analyzeDrinkPhoto(base64, mediaType);
      setScanThumbnail(thumb);
      setScanSheet({ step: 'result', result });
    } catch {
      onScanComplete('water');
    } finally {
      setScanning(false);
    }
  };

  const handleScanClick = () => {
    if (navigator.mediaDevices) {
      setShowScanner(true);
    } else {
      fileRef.current?.click();
    }
  };

  const handleCameraCapture = async (base64: string) => {
    setShowScanner(false);
    setScanning(true);
    try {
      const [result, thumb] = await Promise.all([
        analyzeDrinkPhoto(base64, 'image/jpeg'),
        base64ToThumbnail(base64),
      ]);
      setScanThumbnail(thumb);
      setScanSheet({ step: 'result', result });
    } catch {
      onScanComplete('water');
    } finally {
      setScanning(false);
    }
  };

  const handleLogResult = () => {
    if (!scanSheet) return;
    const { result } = scanSheet;
    feedbackAdd();
    onScanDirectConfirm(result.drink_type, result.estimated_volume_ml, {
      label: result.display_name,
      ...(scanThumbnail ? { scanThumbnail } : {}),
    });
    setScanSheet(null);
    setScanThumbnail('');
  };

  const handleStartEdit = () => {
    setScanSheet(prev => prev ? { ...prev, step: 'edit' } : null);
    setEditText('');
    setTimeout(() => editInputRef.current?.focus(), 150);
  };

  const handleEditSubmit = async () => {
    if (!scanSheet || !editText.trim()) return;
    const { result: original } = scanSheet;
    setEditAnalyzing(true);
    try {
      const detectedType = detectTypeFromText(editText);
      const parsedOz = parseOzFromText(editText);
      const volumeMl = parsedOz ? Math.round(parsedOz * 29.57) : original.estimated_volume_ml;
      // Strip the "16 oz" / "16oz" part so the name is clean for AI
      const drinkName = editText.replace(/\d+(?:\.\d+)?\s*oz/gi, '').trim().replace(/,\s*$/, '').trim() || editText.trim();
      const analysis = await analyzeDrinkName(drinkName, detectedType);
      feedbackAdd();
      onScanDirectConfirm(detectedType, volumeMl, {
        hydrationPerMl: analysis.hydrationPerMl,
        caffeinePer100ml: analysis.caffeinePer100ml || undefined,
        electrolyte: analysis.electrolyte || undefined,
        label: analysis.label,
        ...(scanThumbnail ? { scanThumbnail } : {}),
      });
      setScanSheet(null);
      setScanThumbnail('');
    } catch {
      const parsedOz = parseOzFromText(editText);
      const volumeMl = parsedOz ? Math.round(parsedOz * 29.57) : scanSheet.result.estimated_volume_ml;
      feedbackAdd();
      onScanDirectConfirm('unknown', volumeMl, {
        label: editText.replace(/\d+(?:\.\d+)?\s*oz/gi, '').trim().slice(0, 20) || editText.slice(0, 20),
        ...(scanThumbnail ? { scanThumbnail } : {}),
      });
      setScanSheet(null);
      setScanThumbnail('');
    } finally {
      setEditAnalyzing(false);
    }
  };

  const NavTab = ({ page, label, Icon }: typeof LEFT_TABS[0]) => {
    const active = activePage === page;
    const color = active ? theme.textPrimary : theme.textTertiary;
    return (
      <button
        onClick={() => onNavigate(page)}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 3, padding: '17px 0 13px',
          background: 'none', border: 'none', cursor: 'pointer',
        }}
      >
        <Icon size={21} color={color} />
        <span style={{
          fontSize: 10, fontWeight: active ? 600 : 400, color,
          letterSpacing: active ? '0.02em' : '0.01em', transition: 'all 0.15s ease',
        }}>
          {label}
        </span>
        <span style={{
          width: active ? 16 : 0, height: 2, borderRadius: 1, background: theme.textPrimary,
          marginTop: 1, transition: 'width 0.2s ease', display: 'block',
        }} />
      </button>
    );
  };

  // ── Scan result / edit sheet ────────────────────────────────────────────────
  const renderScanSheet = () => {
    if (!scanSheet) return null;
    const { step, result } = scanSheet;
    const emoji = DRINK_PROFILES[result.drink_type]?.emoji ?? '🥛';
    const typeLabel = DRINK_TYPE_LABELS[result.drink_type] ?? 'Drink';
    const estimatedOz = Math.round(result.estimated_volume_ml / 29.57);

    let confidenceLabel: string;
    let confidenceColor: string;
    if (result.confidence >= 0.8) {
      confidenceLabel = '✓ Detected';
      confidenceColor = '#0891b2';
    } else if (result.confidence >= 0.5) {
      confidenceLabel = '~ Pretty sure';
      confidenceColor = '#d97706';
    } else {
      confidenceLabel = '? Low confidence — check below';
      confidenceColor = '#ef4444';
    }

    const closeBtnStyle: React.CSSProperties = {
      width: 30, height: 30, borderRadius: 8, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
      border: 'none', cursor: 'pointer', flexShrink: 0,
    };

    return (
      <>
        {/* Backdrop */}
        <div
          onClick={() => { setScanSheet(null); setScanThumbnail(''); }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            zIndex: 45, animation: 'fadeIn 0.2s ease forwards',
          }}
        />
        {/* Sheet */}
        <div
          className="animate-slide-up"
          style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            margin: '0 auto', width: '100%', maxWidth: 420,
            background: theme.card, borderRadius: '24px 24px 0 0',
            zIndex: 55, paddingBottom: 'env(safe-area-inset-bottom, 16px)',
            boxShadow: '0 -4px 32px rgba(0,0,0,0.2)',
          }}
        >
          {/* Handle */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: theme.divider }} />
          </div>

          {/* ── RESULT STEP ── */}
          {step === 'result' && (
            <div style={{ padding: '10px 20px 28px' }}>
              {/* Top row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: confidenceColor }}>
                  {confidenceLabel}
                </span>
                <button onClick={() => { setScanSheet(null); setScanThumbnail(''); }} style={closeBtnStyle}>
                  <XIcon size={14} color={theme.textSecondary} />
                </button>
              </div>

              {/* Drink info */}
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                  {scanThumbnail
                    ? <img src={scanThumbnail} alt="" style={{ width: 72, height: 72, borderRadius: 16, objectFit: 'cover', display: 'block', boxShadow: '0 2px 12px rgba(0,0,0,0.15)' }} />
                    : <span style={{ fontSize: 56, lineHeight: 1 }}>{emoji}</span>
                  }
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: theme.textPrimary, letterSpacing: '-0.03em', marginBottom: 5 }}>
                  {result.display_name}
                </div>
                <div style={{ fontSize: 13, color: theme.textSecondary }}>
                  {typeLabel} · ~{estimatedOz} oz
                </div>
                {result.notes && (
                  <div style={{ fontSize: 12, color: theme.textTertiary, marginTop: 10, lineHeight: 1.55, padding: '0 8px' }}>
                    {result.notes}
                  </div>
                )}
              </div>

              {/* Edit button */}
              <button
                onClick={handleStartEdit}
                style={{
                  width: '100%', padding: '12px', borderRadius: 14,
                  background: 'transparent', border: `1px solid ${theme.cardBorder}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 7, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10,
                  transition: 'background 0.15s ease',
                }}
              >
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={theme.textSecondary} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <span style={{ fontSize: 13, fontWeight: 600, color: theme.textSecondary }}>Not right? Edit</span>
              </button>

              {/* Log button */}
              <button
                onClick={handleLogResult}
                style={{
                  width: '100%', padding: '15px', borderRadius: 16,
                  background: theme.textPrimary, color: isDark ? '#0f1117' : '#fff',
                  border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  fontFamily: 'inherit', letterSpacing: '-0.01em',
                }}
              >
                Log this →
              </button>
            </div>
          )}

          {/* ── EDIT STEP ── */}
          {step === 'edit' && (
            <div style={{ padding: '10px 20px 28px' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <button
                  onClick={() => setScanSheet(prev => prev ? { ...prev, step: 'result' } : null)}
                  style={closeBtnStyle}
                >
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={theme.textSecondary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <span style={{ fontSize: 16, fontWeight: 700, color: theme.textPrimary, letterSpacing: '-0.02em' }}>
                  Fix the Scan
                </span>
              </div>

              <p style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 14, lineHeight: 1.5 }}>
                What did you actually have? AI will re-analyze the hydration.
              </p>

              <input
                ref={editInputRef}
                type="text"
                value={editText}
                onChange={e => setEditText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !editAnalyzing && handleEditSubmit()}
                placeholder={`e.g. "iced coffee, 16 oz"`}
                style={{
                  width: '100%', border: `1px solid ${theme.cardBorder}`, borderRadius: 14,
                  padding: '13px 16px', fontSize: 15, color: theme.textPrimary,
                  background: theme.inputBg, outline: 'none', boxSizing: 'border-box',
                  fontFamily: 'inherit', marginBottom: 8,
                }}
              />
              <p style={{ fontSize: 11, color: theme.textTertiary, marginBottom: 16 }}>
                Include the size for accuracy — e.g. "16 oz"
              </p>

              <button
                onClick={handleEditSubmit}
                disabled={!editText.trim() || editAnalyzing}
                style={{
                  width: '100%', padding: '15px', borderRadius: 16,
                  background: theme.textPrimary, color: isDark ? '#0f1117' : '#fff',
                  border: 'none', fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
                  letterSpacing: '-0.01em',
                  cursor: (!editText.trim() || editAnalyzing) ? 'default' : 'pointer',
                  opacity: (!editText.trim() || editAnalyzing) ? 0.5 : 1,
                  transition: 'opacity 0.15s ease',
                }}
              >
                {editAnalyzing ? 'Analyzing...' : 'Analyze & Log →'}
              </button>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <>
      {/* Portal both the scanner and result sheet to document.body so
          they escape the App's overflowX:hidden stacking context */}
      {showScanner && createPortal(
        <CameraScanner
          onCapture={handleCameraCapture}
          onClose={() => setShowScanner(false)}
        />,
        document.body
      )}
      {scanSheet && createPortal(renderScanSheet(), document.body)}

      <nav
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          margin: '0 auto', maxWidth: 420, background: theme.nav,
          borderRadius: '22px 22px 0 0', display: 'flex', alignItems: 'flex-end',
          zIndex: 30, paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          boxShadow: '0 -4px 30px rgba(0,0,0,0.09), 0 -1px 0 rgba(0,0,0,0.04)',
        }}
      >
        {LEFT_TABS.map(tab => <NavTab key={tab.page} {...tab} />)}

        {/* Center scan button */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: 13, gap: 4 }}>
          <button
            onClick={handleScanClick}
            disabled={scanning}
            style={{
              width: 54, height: 54, borderRadius: '50%',
              background: isDark ? '#ffffff' : '#000000',
              border: `3px solid ${theme.bg}`,
              boxShadow: '0 6px 20px rgba(0,0,0,0.25), 0 2px 6px rgba(0,0,0,0.1)',
              cursor: scanning ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginTop: -22, transition: 'transform 0.15s ease, opacity 0.15s ease',
              opacity: scanning ? 0.7 : 1,
            }}
          >
            {scanning ? (
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.2)',
                borderTopColor: '#ffffff',
                animation: 'spin 0.8s linear infinite',
              }} />
            ) : (
              <img
                src="/scan-icon.png"
                alt="Scan"
                style={{ width: 24, height: 24, objectFit: 'contain', filter: isDark ? 'none' : 'invert(1)' }}
              />
            )}
          </button>
          <span style={{ fontSize: 10, fontWeight: 500, color: theme.textTertiary, letterSpacing: '0.01em' }}>
            Scan
          </span>
        </div>

        {RIGHT_TABS.map(tab => <NavTab key={tab.page} {...tab} />)}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoChange}
          style={{ display: 'none' }}
        />
      </nav>
    </>
  );
}
