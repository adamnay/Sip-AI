import { useRef } from 'react';
import type { DrinkType } from '../engine/hydrationEngine';
import {
  WaterIcon, CoffeeIcon, EnergyIcon, TeaIcon,
  JuiceIcon, SodaIcon, ElectrolyteIcon, AlcoholIcon,
  ScanDrinkIcon, XIcon,
} from './Icons';
import { analyzeDrinkPhoto } from '../api/drinkAnalyzer';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelectDrink: (type: DrinkType) => void;
}

const DRINKS: Array<{ type: DrinkType; label: string }> = [
  { type: 'water',        label: 'Water' },
  { type: 'coffee',       label: 'Coffee' },
  { type: 'energy_drink', label: 'Energy' },
  { type: 'tea',          label: 'Tea' },
  { type: 'juice',        label: 'Juice' },
  { type: 'soda',         label: 'Soda' },
  { type: 'electrolyte',  label: 'Electro.' },
  { type: 'alcohol',      label: 'Alcohol' },
];

function getDrinkIcon(type: DrinkType) {
  const color = 'rgba(0,0,0,0.55)';
  switch (type) {
    case 'water':        return <WaterIcon size={22} color={color} />;
    case 'coffee':       return <CoffeeIcon size={22} color={color} />;
    case 'energy_drink': return <EnergyIcon size={22} color={color} />;
    case 'tea':          return <TeaIcon size={22} color={color} />;
    case 'juice':        return <JuiceIcon size={22} color={color} />;
    case 'soda':         return <SodaIcon size={22} color={color} />;
    case 'electrolyte':  return <ElectrolyteIcon size={22} color={color} />;
    case 'alcohol':      return <AlcoholIcon size={22} color={color} />;
    default:             return <WaterIcon size={22} color={color} />;
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function QuickAddSheet({ open, onClose, onSelectDrink }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    onClose();
    try {
      const base64 = await fileToBase64(file);
      const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
      const result = await analyzeDrinkPhoto(base64, mediaType);
      onSelectDrink(result.drink_type);
    } catch {
      onSelectDrink('water');
    }
  };

  const handleDrink = (type: DrinkType) => {
    onClose();
    onSelectDrink(type);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.35)',
          zIndex: 45,
          animation: 'fadeIn 0.18s ease forwards',
        }}
      />

      {/* Sheet */}
      <div
        className="animate-slide-up"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          margin: '0 auto',
          maxWidth: 420,
          background: '#ffffff',
          borderRadius: '24px 24px 0 0',
          zIndex: 55,
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
          boxShadow: '0 -4px 32px rgba(0,0,0,0.12)',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 2 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.12)' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px 8px' }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#111827', letterSpacing: '-0.02em' }}>
            Log a drink
          </span>
          <button
            onClick={onClose}
            style={{ width: 30, height: 30, borderRadius: 10, background: 'rgba(0,0,0,0.05)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <XIcon size={14} color="rgba(0,0,0,0.4)" />
          </button>
        </div>

        <div style={{ padding: '4px 16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Scan CTA */}
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              border: 'none',
              borderRadius: 16,
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            }}
          >
            <ScanDrinkIcon size={20} color="rgba(255,255,255,0.9)" />
            <span style={{ color: '#ffffff', fontWeight: 600, fontSize: 14 }}>Scan your drink</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)' }}>AI</span>
          </button>

          {/* Drink grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {DRINKS.map(({ type, label }) => (
              <button
                key={type}
                onClick={() => handleDrink(type)}
                style={{
                  background: '#f8f9fa',
                  border: '1px solid rgba(0,0,0,0.07)',
                  borderRadius: 16,
                  padding: '12px 4px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                {getDrinkIcon(type)}
                <span style={{ fontSize: 11, fontWeight: 500, color: 'rgba(0,0,0,0.5)' }}>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoChange}
          style={{ display: 'none' }}
        />
      </div>
    </>
  );
}
