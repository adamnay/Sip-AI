import { useEffect, useRef, useState } from 'react';
import { analyzeDrinkName } from '../api/drinkAnalyzer';
import { useTheme, getTheme } from '../context/ThemeContext';
import type { DrinkType, DrinkOverrides } from '../engine/hydrationEngine';
import {
  WaterIcon,
  CoffeeIcon,
  EnergyIcon,
  TeaIcon,
  JuiceIcon,
  SodaIcon,
  ElectrolyteIcon,
  AlcoholIcon,
  XIcon,
} from './Icons';

interface Props {
  drinkType: DrinkType | null; // null = closed
  onConfirm: (type: DrinkType, volume_ml: number, overrides: DrinkOverrides) => void;
  onClose: () => void;
}

type FlowStep = 'size' | 'detail' | 'count' | 'other_input';

interface FlowState {
  step: FlowStep;
  sizeOz: number | null;
  customOzStr: string;
  selectedDetailValue: string | null;
  alcoholCount: number;
  alcoholTypeMl: number;
  alcoholTypeOverrides: DrinkOverrides | null;
  alcoholTypeLabel: string;
  otherDrinkName: string;
}

const SIZE_OPTIONS = [
  { label: 'Small', sublabel: '8 oz', oz: 8, ml: 237 },
  { label: 'Medium', sublabel: '16 oz', oz: 16, ml: 473 },
  { label: 'Large', sublabel: '24 oz', oz: 24, ml: 709 },
  { label: 'Custom', sublabel: 'enter oz', oz: -1, ml: -1 },
];

const ALCOHOL_TYPES = [
  {
    label: 'Beer',
    sublabel: '12 oz / drink',
    mlPerDrink: 355,
    overrides: { hydrationPerMl: -0.015, label: 'Beer' } as DrinkOverrides,
  },
  {
    label: 'Wine',
    sublabel: '5 oz / drink',
    mlPerDrink: 148,
    overrides: { hydrationPerMl: -0.028, label: 'Wine' } as DrinkOverrides,
  },
  {
    label: 'Liquor',
    sublabel: '1.5 oz / shot',
    mlPerDrink: 44,
    overrides: { hydrationPerMl: -0.045, label: 'Liquor' } as DrinkOverrides,
  },
];

const ALCOHOL_COUNTS = [
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '3+', value: 4 },
];

interface DetailOption {
  label: string;
  value: string;
  overrides: DrinkOverrides;
}

interface DetailQuestion {
  question: string;
  options: DetailOption[];
}

const DETAIL_QUESTIONS: Partial<Record<DrinkType, DetailQuestion>> = {
  coffee: {
    question: 'What kind of coffee?',
    options: [
      { label: 'Black', value: 'black', overrides: { hydrationPerMl: 0.008, caffeinePer100ml: 40, label: 'Black Coffee' } },
      { label: 'Latte', value: 'latte', overrides: { hydrationPerMl: 0.018, caffeinePer100ml: 30, label: 'Latte' } },
      { label: 'Iced', value: 'iced', overrides: { hydrationPerMl: 0.012, caffeinePer100ml: 35, label: 'Iced Coffee' } },
    ],
  },
  energy_drink: {
    question: 'Which brand?',
    options: [
      { label: 'Red Bull', value: 'redbull', overrides: { caffeinePer100ml: 32, hydrationPerMl: 0.006, label: 'Red Bull' } },
      { label: 'Celsius', value: 'celsius', overrides: { caffeinePer100ml: 60, hydrationPerMl: 0.005, label: 'Celsius' } },
      { label: 'Monster', value: 'monster', overrides: { caffeinePer100ml: 36, hydrationPerMl: 0.006, label: 'Monster' } },
      { label: 'Other', value: 'other', overrides: { caffeinePer100ml: 35, hydrationPerMl: 0.006, label: 'Energy Drink' } },
    ],
  },
  tea: {
    question: 'What type of tea?',
    options: [
      { label: 'Green Tea', value: 'green', overrides: { caffeinePer100ml: 12, hydrationPerMl: 0.030, label: 'Green Tea' } },
      { label: 'Black Tea', value: 'black', overrides: { caffeinePer100ml: 20, hydrationPerMl: 0.026, label: 'Black Tea' } },
      { label: 'Herbal', value: 'herbal', overrides: { caffeinePer100ml: 0, hydrationPerMl: 0.034, label: 'Herbal Tea' } },
    ],
  },
  juice: {
    question: 'Which juice?',
    options: [
      { label: 'Orange', value: 'orange', overrides: { hydrationPerMl: 0.031, label: 'OJ' } },
      { label: 'Apple', value: 'apple', overrides: { hydrationPerMl: 0.028, label: 'Apple Juice' } },
      { label: 'Green Juice', value: 'green', overrides: { hydrationPerMl: 0.026, label: 'Green Juice' } },
      { label: 'Other', value: 'other', overrides: { hydrationPerMl: 0.028, label: 'Juice' } },
    ],
  },
  soda: {
    question: 'Which soda?',
    options: [
      { label: 'Coke', value: 'coke', overrides: { caffeinePer100ml: 10, hydrationPerMl: 0.012, label: 'Coca-Cola' } },
      { label: 'Diet Coke', value: 'diet', overrides: { caffeinePer100ml: 12, hydrationPerMl: 0.010, label: 'Diet Coke' } },
      { label: 'Sprite', value: 'sprite', overrides: { caffeinePer100ml: 0, hydrationPerMl: 0.018, label: 'Sprite' } },
      { label: 'Other', value: 'other', overrides: { caffeinePer100ml: 8, hydrationPerMl: 0.013, label: 'Soda' } },
    ],
  },
  electrolyte: {
    question: 'What form?',
    options: [
      { label: 'Powder (1 scoop)', value: 'powder1', overrides: { hydrationPerMl: 0.055, electrolyte: true, label: 'Electrolyte Powder' } },
      { label: 'Powder (2+ scoops)', value: 'powder2', overrides: { hydrationPerMl: 0.065, electrolyte: true, label: 'Double Electrolytes' } },
      { label: 'Gatorade / LMNT', value: 'drink', overrides: { hydrationPerMl: 0.042, electrolyte: true, label: 'Electrolyte Drink' } },
      { label: 'Other', value: 'other', overrides: { hydrationPerMl: 0.042, electrolyte: true, label: 'Electrolytes' } },
    ],
  },
};

function getDrinkIcon(type: DrinkType, size: number = 22, color: string = '#111827') {
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

function getDrinkLabel(type: DrinkType): string {
  const labels: Partial<Record<DrinkType, string>> = {
    water: 'Water',
    coffee: 'Coffee',
    energy_drink: 'Energy Drink',
    tea: 'Tea',
    juice: 'Juice',
    soda: 'Soda',
    electrolyte: 'Electrolytes',
    alcohol: 'Alcohol',
  };
  return labels[type] ?? 'Drink';
}

function getInitialStep(type: DrinkType): FlowStep {
  if (type === 'alcohol') return 'detail';
  return 'size';
}

export default function DrinkFlowModal({ drinkType, onConfirm, onClose }: Props) {
  const isDark = useTheme();
  const theme = getTheme(isDark);
  const [flow, setFlow] = useState<FlowState>({
    step: 'size',
    sizeOz: null,
    customOzStr: '',
    selectedDetailValue: null,
    alcoholCount: 1,
    alcoholTypeMl: 355,
    alcoholTypeOverrides: null,
    alcoholTypeLabel: '',
    otherDrinkName: '',
  });
  const [customInputActive, setCustomInputActive] = useState(false);
  const [analyzingOther, setAnalyzingOther] = useState(false);
  const otherInputRef = useRef<HTMLInputElement>(null);

  // Reset state when a new drink type is selected
  useEffect(() => {
    if (drinkType) {
      setFlow({
        step: getInitialStep(drinkType),
        sizeOz: null,
        customOzStr: '',
        selectedDetailValue: null,
        alcoholCount: 1,
        alcoholTypeMl: 355,
        alcoholTypeOverrides: null,
        alcoholTypeLabel: '',
        otherDrinkName: '',
      });
      setCustomInputActive(false);
      setAnalyzingOther(false);
    }
  }, [drinkType]);

  if (!drinkType) return null;

  const hasDetail = drinkType in DETAIL_QUESTIONS;
  const isAlcohol = drinkType === 'alcohol';
  const isWater = drinkType === 'water';

  // How many step dots to show
  const stepCount = isWater ? 1 : isAlcohol ? 2 : 2;
  const currentStepIndex = flow.step === 'size' ? 0 : flow.step === 'detail' ? (isAlcohol ? 0 : 1) : 1;

  const handleSizeSelect = (option: typeof SIZE_OPTIONS[0]) => {
    if (option.oz === -1) {
      setCustomInputActive(true);
      setFlow(prev => ({ ...prev, sizeOz: -1 }));
      return;
    }
    setCustomInputActive(false);
    const ml = option.ml;

    if (isWater) {
      onConfirm(drinkType, ml, {});
      return;
    }
    if (hasDetail) {
      setFlow(prev => ({ ...prev, step: 'detail', sizeOz: option.oz }));
    } else {
      onConfirm(drinkType, ml, {});
    }
  };

  const handleCustomSizeSet = () => {
    const oz = parseFloat(flow.customOzStr);
    if (isNaN(oz) || oz <= 0) return;
    const ml = Math.round(oz * 29.57);

    if (isWater) {
      onConfirm(drinkType, ml, {});
      return;
    }
    if (hasDetail) {
      setFlow(prev => ({ ...prev, step: 'detail' }));
    } else {
      onConfirm(drinkType, ml, {});
    }
  };

  const handleDetailSelect = (option: DetailOption) => {
    if (option.value === 'other') {
      setFlow(prev => ({ ...prev, step: 'other_input', otherDrinkName: '' }));
      setTimeout(() => otherInputRef.current?.focus(), 100);
      return;
    }
    let ml: number;
    if (flow.sizeOz === -1) {
      ml = Math.round(parseFloat(flow.customOzStr || '8') * 29.57);
    } else {
      const sizeOpt = SIZE_OPTIONS.find(s => s.oz === flow.sizeOz);
      ml = sizeOpt ? sizeOpt.ml : 473;
    }
    onConfirm(drinkType, ml, option.overrides);
  };

  const handleOtherSubmit = async () => {
    const name = flow.otherDrinkName.trim();
    if (!name) return;
    setAnalyzingOther(true);
    try {
      const analysis = await analyzeDrinkName(name, drinkType);
      let ml: number;
      if (flow.sizeOz === -1) {
        ml = Math.round(parseFloat(flow.customOzStr || '8') * 29.57);
      } else {
        const sizeOpt = SIZE_OPTIONS.find(s => s.oz === flow.sizeOz);
        ml = sizeOpt ? sizeOpt.ml : 473;
      }
      const overrides: DrinkOverrides = {
        hydrationPerMl: analysis.hydrationPerMl,
        caffeinePer100ml: analysis.caffeinePer100ml || undefined,
        electrolyte: analysis.electrolyte || undefined,
        label: analysis.label,
      };
      onConfirm(drinkType, ml, overrides);
    } catch {
      // fallback to generic
      onConfirm(drinkType, 473, { label: name.slice(0, 20) });
    } finally {
      setAnalyzingOther(false);
    }
  };

  const handleAlcoholTypeSelect = (alcoholType: typeof ALCOHOL_TYPES[0]) => {
    setFlow(prev => ({
      ...prev,
      step: 'count',
      alcoholTypeMl: alcoholType.mlPerDrink,
      alcoholTypeOverrides: alcoholType.overrides,
      alcoholTypeLabel: alcoholType.label,
    }));
  };

  const handleAlcoholCountSelect = (count: number) => {
    const totalMl = count * flow.alcoholTypeMl;
    const overrides: DrinkOverrides = {
      ...(flow.alcoholTypeOverrides ?? {}),
      alcoholDecayBoost: true,
    };
    onConfirm(drinkType, totalMl, overrides);
  };

  const detailQuestion = DETAIL_QUESTIONS[drinkType];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 40,
          animation: 'fadeIn 0.2s ease forwards',
        }}
      />

      {/* Bottom sheet */}
      <div
        className="animate-slide-up"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          margin: '0 auto',
          width: '100%',
          maxWidth: 420,
          background: theme.card,
          borderRadius: '24px 24px 0 0',
          zIndex: 50,
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
          boxShadow: '0 -4px 32px rgba(0,0,0,0.2)',
        }}
      >
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: theme.divider }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px 8px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {getDrinkIcon(drinkType, 22, theme.textPrimary)}
            <span style={{ fontWeight: 700, fontSize: 18, color: theme.textPrimary, letterSpacing: '-0.02em' }}>
              {getDrinkLabel(drinkType)}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <XIcon size={16} color={theme.textSecondary} />
          </button>
        </div>

        {/* Step dots */}
        {stepCount > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, paddingBottom: 8 }}>
            {Array.from({ length: stepCount }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === currentStepIndex ? 16 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === currentStepIndex ? theme.textPrimary : theme.divider,
                  transition: 'width 0.2s ease, background 0.2s ease',
                }}
              />
            ))}
          </div>
        )}

        {/* Content */}
        <div style={{ padding: '8px 20px 24px' }}>

          {/* STEP: SIZE */}
          {flow.step === 'size' && (
            <>
              <p style={{ fontWeight: 700, fontSize: 16, color: theme.textPrimary, marginBottom: 14 }}>
                How much did you have?
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {SIZE_OPTIONS.map((option) => {
                  const isSelected = flow.sizeOz === option.oz;
                  return (
                    <button
                      key={option.label}
                      onClick={() => handleSizeSelect(option)}
                      style={{
                        border: isSelected ? `1.5px solid ${theme.textPrimary}` : `1px solid ${theme.cardBorder}`,
                        borderRadius: 16,
                        background: isSelected ? theme.inputBg : theme.card,
                        padding: '14px 12px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <p style={{ fontWeight: 600, fontSize: 15, color: theme.textPrimary, margin: 0 }}>{option.label}</p>
                      <p style={{ fontSize: 12, color: theme.textSecondary, margin: '2px 0 0' }}>{option.sublabel}</p>
                    </button>
                  );
                })}
              </div>

              {/* Custom input */}
              {customInputActive && (
                <div style={{ marginTop: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input
                    type="number"
                    min="1"
                    max="128"
                    placeholder="oz"
                    value={flow.customOzStr}
                    onChange={e => setFlow(prev => ({ ...prev, customOzStr: e.target.value }))}
                    style={{
                      flex: 1,
                      border: `1px solid ${theme.cardBorder}`,
                      borderRadius: 12,
                      padding: '10px 14px',
                      fontSize: 15,
                      color: theme.textPrimary,
                      outline: 'none',
                      background: theme.inputBg,
                    }}
                  />
                  <button
                    onClick={handleCustomSizeSet}
                    disabled={!flow.customOzStr || parseFloat(flow.customOzStr) <= 0}
                    style={{
                      background: theme.textPrimary,
                      color: isDark ? '#0f1117' : '#ffffff',
                      border: 'none',
                      borderRadius: 12,
                      padding: '10px 18px',
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: 'pointer',
                      opacity: !flow.customOzStr || parseFloat(flow.customOzStr) <= 0 ? 0.4 : 1,
                    }}
                  >
                    Set size
                  </button>
                </div>
              )}
            </>
          )}

          {/* STEP: DETAIL (for non-alcohol drinks) */}
          {flow.step === 'detail' && detailQuestion && !isAlcohol && (
            <>
              <p style={{ fontWeight: 700, fontSize: 16, color: theme.textPrimary, marginBottom: 14 }}>
                {detailQuestion.question}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {detailQuestion.options.map((option) => {
                  const isSelected = flow.selectedDetailValue === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        setFlow(prev => ({ ...prev, selectedDetailValue: option.value }));
                        handleDetailSelect(option);
                      }}
                      style={{
                        border: isSelected ? `1.5px solid ${theme.textPrimary}` : `1px solid ${theme.cardBorder}`,
                        borderRadius: 16,
                        background: isSelected ? theme.inputBg : theme.card,
                        padding: '14px 16px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: 15,
                        color: theme.textPrimary,
                        transition: 'all 0.15s ease',
                        width: '100%',
                      }}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* STEP: OTHER (AI analysis) */}
          {flow.step === 'other_input' && (
            <>
              <p style={{ fontWeight: 700, fontSize: 16, color: theme.textPrimary, marginBottom: 6 }}>
                What did you have?
              </p>
              <p style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 14 }}>
                AI will figure out the hydration for you.
              </p>
              <input
                ref={otherInputRef}
                type="text"
                placeholder={`e.g. "Liquid IV", "Snapple Peach Tea"...`}
                value={flow.otherDrinkName}
                onChange={e => setFlow(prev => ({ ...prev, otherDrinkName: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && !analyzingOther && handleOtherSubmit()}
                style={{
                  width: '100%',
                  border: `1px solid ${theme.cardBorder}`,
                  borderRadius: 14,
                  padding: '13px 16px',
                  fontSize: 15,
                  color: theme.textPrimary,
                  background: theme.inputBg,
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  marginBottom: 12,
                }}
              />
              <button
                onClick={handleOtherSubmit}
                disabled={!flow.otherDrinkName.trim() || analyzingOther}
                style={{
                  width: '100%',
                  background: theme.textPrimary,
                  color: isDark ? '#0f1117' : '#ffffff',
                  border: 'none',
                  borderRadius: 14,
                  padding: '14px',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: (!flow.otherDrinkName.trim() || analyzingOther) ? 'default' : 'pointer',
                  opacity: (!flow.otherDrinkName.trim() || analyzingOther) ? 0.5 : 1,
                  fontFamily: 'inherit',
                  letterSpacing: '-0.01em',
                  transition: 'opacity 0.15s ease',
                }}
              >
                {analyzingOther ? 'Analyzing...' : 'Log Drink'}
              </button>
            </>
          )}

          {/* STEP: ALCOHOL TYPE (detail step for alcohol) */}
          {flow.step === 'detail' && isAlcohol && (
            <>
              <p style={{ fontWeight: 700, fontSize: 16, color: theme.textPrimary, marginBottom: 14 }}>
                What are you drinking?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ALCOHOL_TYPES.map((alcoholType) => (
                  <button
                    key={alcoholType.label}
                    onClick={() => handleAlcoholTypeSelect(alcoholType)}
                    style={{
                      border: `1px solid ${theme.cardBorder}`,
                      borderRadius: 16,
                      background: theme.card,
                      padding: '14px 16px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      width: '100%',
                    }}
                  >
                    <p style={{ fontWeight: 600, fontSize: 15, color: theme.textPrimary, margin: 0 }}>{alcoholType.label}</p>
                    <p style={{ fontSize: 12, color: theme.textSecondary, margin: '2px 0 0' }}>{alcoholType.sublabel}</p>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* STEP: ALCOHOL COUNT */}
          {flow.step === 'count' && isAlcohol && (
            <>
              <p style={{ fontWeight: 700, fontSize: 16, color: theme.textPrimary, marginBottom: 4 }}>
                How many {flow.alcoholTypeLabel.toLowerCase()} drinks?
              </p>
              <p style={{ fontSize: 12, color: theme.textSecondary, marginBottom: 14 }}>
                Standard drink = {Math.round(flow.alcoholTypeMl / 29.57)} oz
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {ALCOHOL_COUNTS.map((countOption) => (
                  <button
                    key={countOption.label}
                    onClick={() => handleAlcoholCountSelect(countOption.value)}
                    style={{
                      border: `1px solid ${theme.cardBorder}`,
                      borderRadius: 16,
                      background: theme.card,
                      padding: '18px 12px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      fontWeight: 700,
                      fontSize: 20,
                      color: theme.textPrimary,
                    }}
                  >
                    {countOption.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
