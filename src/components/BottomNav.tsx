import { useRef, useState } from 'react';
import type { DrinkType } from '../engine/hydrationEngine';
import { analyzeDrinkPhoto } from '../api/drinkAnalyzer';
import { HomeIcon, BarChartIcon, GearIcon } from './Icons';
import { useTheme, getTheme } from '../context/ThemeContext';

type Page = 'home' | 'analytics' | 'settings';

interface Props {
  activePage: Page;
  onNavigate: (page: Page) => void;
  onScanComplete: (type: DrinkType) => void;
}

const LEFT_TABS: Array<{ page: Page; label: string; Icon: React.FC<{ size?: number; color?: string }> }> = [
  { page: 'home',      label: 'Home',      Icon: HomeIcon },
  { page: 'analytics', label: 'Analytics', Icon: BarChartIcon },
];
const RIGHT_TABS: Array<{ page: Page; label: string; Icon: React.FC<{ size?: number; color?: string }> }> = [
  { page: 'settings', label: 'Settings', Icon: GearIcon },
];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function BottomNav({ activePage, onNavigate, onScanComplete }: Props) {
  const isDark = useTheme();
  const theme = getTheme(isDark);
  const fileRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setScanning(true);
    try {
      const base64 = await fileToBase64(file);
      const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
      const result = await analyzeDrinkPhoto(base64, mediaType);
      onScanComplete(result.drink_type);
    } catch {
      onScanComplete('water');
    } finally {
      setScanning(false);
    }
  };

  const NavTab = ({ page, label, Icon }: typeof LEFT_TABS[0]) => {
    const active = activePage === page;
    const color = active ? theme.textPrimary : theme.textTertiary;
    return (
      <button
        onClick={() => onNavigate(page)}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          padding: '13px 0 10px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <Icon size={21} color={color} />
        <span style={{
          fontSize: 10,
          fontWeight: active ? 600 : 400,
          color,
          letterSpacing: active ? '0.02em' : '0.01em',
          transition: 'all 0.15s ease',
        }}>
          {label}
        </span>
        {/* Active underline pill */}
        <span style={{
          width: active ? 16 : 0,
          height: 2,
          borderRadius: 1,
          background: theme.textPrimary,
          marginTop: 1,
          transition: 'width 0.2s ease',
          display: 'block',
        }} />
      </button>
    );
  };

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        margin: '0 auto',
        maxWidth: 420,
        background: theme.nav,
        borderRadius: '22px 22px 0 0',
        display: 'flex',
        alignItems: 'flex-end',
        zIndex: 30,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        boxShadow: '0 -4px 30px rgba(0,0,0,0.09), 0 -1px 0 rgba(0,0,0,0.04)',
      }}
    >
      {/* Left tabs */}
      {LEFT_TABS.map(tab => <NavTab key={tab.page} {...tab} />)}

      {/* Center scan button — raised */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingBottom: 10,
        gap: 4,
      }}>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={scanning}
          style={{
            width: 54,
            height: 54,
            borderRadius: '50%',
            background: isDark ? theme.textPrimary : '#000000',
            border: `3px solid ${theme.bg}`,
            boxShadow: '0 6px 20px rgba(0,0,0,0.25), 0 2px 6px rgba(0,0,0,0.1)',
            cursor: scanning ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: -22,
            transition: 'transform 0.15s ease, opacity 0.15s ease',
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
              style={{ width: 24, height: 24, objectFit: 'contain', filter: 'invert(1)' }}
            />
          )}
        </button>
        <span style={{ fontSize: 10, fontWeight: 500, color: theme.textTertiary, letterSpacing: '0.01em' }}>
          Scan
        </span>
      </div>

      {/* Right tabs */}
      {RIGHT_TABS.map(tab => <NavTab key={tab.page} {...tab} />)}

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoChange}
        style={{ display: 'none' }}
      />
    </nav>
  );
}
