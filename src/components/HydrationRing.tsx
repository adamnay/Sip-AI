import { useEffect, useRef, useState } from 'react';
import { getStatusColor, getStatusText } from '../engine/hydrationEngine';
import { EnergyIcon } from './Icons';

interface Props {
  level: number;
  activeCaffeineMg: number;
  hasRecentElectrolytes: boolean;
  hangoverMode?: boolean;
}

const SIZE = 260;
const RADIUS = 108;
const CX = SIZE / 2;
const CY = SIZE / 2;
const WAVE_AMP = 6;

function buildWavePath(yBase: number): string {
  let d = `M 0,${yBase}`;
  for (let i = 0; i < 6; i++) {
    const qx = i * (SIZE / 2) + SIZE / 4;
    const qy = yBase + (i % 2 === 0 ? -WAVE_AMP : WAVE_AMP);
    const ex = (i + 1) * (SIZE / 2);
    d += ` Q ${qx},${qy} ${ex},${yBase}`;
  }
  d += ` L ${SIZE * 3},${SIZE * 2} L 0,${SIZE * 2} Z`;
  return d;
}

export default function HydrationRing({ level, activeCaffeineMg, hasRecentElectrolytes, hangoverMode = false }: Props) {
  const [displayLevel, setDisplayLevel] = useState(level);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const start = displayLevel;
    const end = level;
    if (Math.abs(start - end) < 0.1) { setDisplayLevel(end); return; }
    const duration = 900;
    const startTime = performance.now();
    const animate = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayLevel(start + (end - start) * eased);
      if (t < 1) animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  // In hangover mode, use an amber/red color instead of the normal status color
  const isCritical = level < 20;
  const baseColor = getStatusColor(level);
  const color = hangoverMode ? '#f97316' : isCritical ? '#ef4444' : baseColor;
  const statusText = hangoverMode ? 'HANGOVER' : getStatusText(level);
  const clamped = Math.min(Math.max(displayLevel, 0), 100) / 100;
  const fillY = SIZE * (1 - clamped);

  const wave1Path = buildWavePath(fillY);
  const wave2Path = buildWavePath(fillY + WAVE_AMP * 0.6);

  const caffeineActive = activeCaffeineMg > 80;
  const electrolytesActive = hasRecentElectrolytes;

  return (
    <div className="flex flex-col items-center select-none">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE}>
          <defs>
            <clipPath id="water-clip">
              <circle cx={CX} cy={CY} r={RADIUS} />
            </clipPath>
            {/* Light background circle gradient */}
            <radialGradient id="bg-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor={hangoverMode ? '#fff7ed' : '#f0f2f5'} />
            </radialGradient>
          </defs>

          {/* Background circle */}
          <circle cx={CX} cy={CY} r={RADIUS} fill="url(#bg-grad)" />

          {/* Subtle inner shadow ring */}
          <circle
            cx={CX} cy={CY} r={RADIUS}
            fill="none"
            stroke="rgba(0,0,0,0.06)"
            strokeWidth={1}
          />

          {/* Water fill — clipped inside the circle */}
          <g clipPath="url(#water-clip)">
            {/* Solid body below the waves */}
            <rect
              x={0}
              y={fillY + WAVE_AMP}
              width={SIZE}
              height={SIZE * 2}
              fill={color}
              opacity={0.22}
              style={{ transition: 'y 0.9s cubic-bezier(0.4,0,0.2,1)' }}
            />

            {/* Wave 1 */}
            <g style={{ animation: 'wave1scroll 3s linear infinite' }}>
              <path d={wave1Path} fill={color} opacity={0.45} />
            </g>

            {/* Wave 2 — slower, offset */}
            <g style={{ animation: 'wave2scroll 4.5s linear infinite' }}>
              <path d={wave2Path} fill={color} opacity={0.28} />
            </g>
          </g>

          {/* Circle border */}
          <circle
            cx={CX} cy={CY} r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={isCritical ? 3.5 : hangoverMode ? 3 : 2.5}
            opacity={isCritical ? 0.85 : hangoverMode ? 0.5 : 0.35}
            style={{ transition: 'stroke 0.5s ease' }}
            className={isCritical ? 'ring-flash' : undefined}
          />

          {/* Outer soft ring */}
          <circle
            cx={CX} cy={CY} r={RADIUS + 8}
            fill="none"
            stroke={color}
            strokeWidth={isCritical ? 2 : 1}
            opacity={isCritical ? 0.4 : 0.1}
            className={isCritical ? 'ring-flash' : undefined}
          />
        </svg>

        {/* Text overlay */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-1"
          style={{ pointerEvents: 'none' }}
        >
          {/* Dark text + white glow so it reads on both light bg and colored water */}
          <span
            className="font-bold leading-none"
            style={{
              fontSize: 56,
              color: '#000000',
              textShadow: '0 0 16px rgba(255,255,255,0.95), 0 0 8px rgba(255,255,255,1)',
            }}
          >
            {Math.round(displayLevel)}%
          </span>
          <span
            className="font-semibold tracking-widest uppercase"
            style={{
              fontSize: hangoverMode ? 10 : 12,
              color,
              letterSpacing: '0.18em',
              textShadow: '0 0 10px rgba(255,255,255,0.9)',
            }}
          >
            {statusText}
          </span>

          <div className="flex gap-2 mt-1">
            {hangoverMode && (
              <span
                className="animate-shimmer"
                style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 999,
                  background: 'rgba(249,115,22,0.15)', color: '#c2410c',
                  border: '1px solid rgba(249,115,22,0.3)',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                }}
              >
                RECOVERY MODE
              </span>
            )}
            {!hangoverMode && caffeineActive && (
              <span
                className="animate-shimmer"
                style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 999,
                  background: 'rgba(251,191,36,0.15)', color: '#b45309',
                  border: '1px solid rgba(217,119,6,0.25)',
                  display: 'flex', alignItems: 'center', gap: 3,
                }}
              >
                <EnergyIcon size={10} color="#b45309" />
                <span>caffeine active</span>
              </span>
            )}
            {!hangoverMode && electrolytesActive && !caffeineActive && (
              <span
                className="animate-shimmer"
                style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 999,
                  background: 'rgba(6,182,212,0.12)', color: '#0e7490',
                  border: '1px solid rgba(6,182,212,0.25)',
                  display: 'flex', alignItems: 'center', gap: 3,
                }}
              >
                <EnergyIcon size={10} color="#0e7490" />
                <span>electrolytes on</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
