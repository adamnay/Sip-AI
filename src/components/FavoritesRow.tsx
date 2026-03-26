import { useState } from 'react';
import { useTheme, getTheme } from '../context/ThemeContext';
import type { FavoriteDrink, DrinkType } from '../engine/hydrationEngine';
import {
  WaterIcon, CoffeeIcon, EnergyIcon, TeaIcon,
  JuiceIcon, SodaIcon, ElectrolyteIcon, AlcoholIcon, XIcon,
} from './Icons';

interface Props {
  favorites: FavoriteDrink[];
  onLog: (fav: FavoriteDrink) => void;
  onRemove: (id: string) => void;
}

function FavIcon({ type, thumb, size = 18 }: { type: DrinkType; thumb?: string; size?: number }) {
  if (thumb) return <img src={thumb} alt="" style={{ width: size, height: size, borderRadius: 4, objectFit: 'cover', display: 'block' }} />;
  const color = 'rgba(255,255,255,0.85)';
  switch (type) {
    case 'water':       return <WaterIcon size={size} color={color} />;
    case 'coffee':      return <CoffeeIcon size={size} color={color} />;
    case 'energy_drink':return <EnergyIcon size={size} color={color} />;
    case 'tea':         return <TeaIcon size={size} color={color} />;
    case 'juice':       return <JuiceIcon size={size} color={color} />;
    case 'soda':        return <SodaIcon size={size} color={color} />;
    case 'electrolyte': return <ElectrolyteIcon size={size} color={color} />;
    case 'alcohol':     return <AlcoholIcon size={size} color={color} />;
    default:            return <WaterIcon size={size} color={color} />;
  }
}

function mlToOz(ml: number) {
  return Math.round(ml / 29.5735);
}

export default function FavoritesRow({ favorites, onLog, onRemove }: Props) {
  const isDark = useTheme();
  const theme = getTheme(isDark);
  const [removingId, setRemovingId] = useState<string | null>(null);

  if (favorites.length === 0) return null;

  const handleRemoveTap = (e: React.MouseEvent | React.TouchEvent, id: string) => {
    e.stopPropagation();
    if (removingId === id) {
      onRemove(id);
      setRemovingId(null);
    } else {
      setRemovingId(id);
      setTimeout(() => setRemovingId(r => r === id ? null : r), 3000);
    }
  };

  return (
    <div style={{ padding: '0 16px 8px' }}>
      <p style={{
        fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
        color: theme.textTertiary, marginBottom: 8, paddingLeft: 2,
      }}>
        QUICK LOG
      </p>
      <div style={{
        display: 'flex',
        gap: 8,
        overflowX: 'auto',
        paddingBottom: 2,
        WebkitOverflowScrolling: 'touch' as const,
        scrollbarWidth: 'none' as const,
      }}>
        {favorites.map(fav => {
          const isRemoving = removingId === fav.id;
          return (
            <button
              key={fav.id}
              onClick={() => !isRemoving && onLog(fav)}
              style={{
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '8px 10px 8px 10px',
                borderRadius: 14,
                background: isRemoving
                  ? 'rgba(220,38,38,0.12)'
                  : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                border: `1px solid ${isRemoving ? 'rgba(220,38,38,0.3)' : theme.cardBorder}`,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                position: 'relative' as const,
                minWidth: 0,
              }}
            >
              {/* Drink icon / thumbnail */}
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: isRemoving ? 'rgba(220,38,38,0.15)' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, overflow: 'hidden',
              }}>
                <FavIcon type={fav.type} thumb={fav.scanThumbnail} size={16} />
              </div>

              {/* Label + size */}
              <div style={{ minWidth: 0 }}>
                <p style={{
                  fontSize: 12, fontWeight: 600,
                  color: isRemoving ? '#dc2626' : theme.textPrimary,
                  margin: 0, whiteSpace: 'nowrap',
                  maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {isRemoving ? 'Remove?' : fav.label}
                </p>
                {!isRemoving && (
                  <p style={{ fontSize: 10, color: theme.textTertiary, margin: 0 }}>
                    {mlToOz(fav.volume_ml)} oz
                  </p>
                )}
              </div>

              {/* Remove × — always visible, small */}
              <div
                onClick={e => handleRemoveTap(e, fav.id)}
                onTouchEnd={e => handleRemoveTap(e, fav.id)}
                style={{
                  width: 16, height: 16,
                  borderRadius: 4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isRemoving ? 'rgba(220,38,38,0.15)' : 'transparent',
                  flexShrink: 0,
                  cursor: 'pointer',
                }}
              >
                <XIcon size={9} color={isRemoving ? '#dc2626' : theme.textTertiary} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
