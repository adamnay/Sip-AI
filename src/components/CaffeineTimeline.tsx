import { useTheme, getTheme } from '../context/ThemeContext';
import type { DrinkEntry } from '../engine/hydrationEngine';

interface Props {
  drinkLog: DrinkEntry[];
}

const CAFFEINE_HALF_LIFE_MS = 5 * 3_600_000; // 5-hour half-life

function computeCaffeineAt(drinks: DrinkEntry[], atTime: number): number {
  return drinks.reduce((total, d) => {
    if (d.timestamp > atTime) return total;
    const elapsed = atTime - d.timestamp;
    return total + d.caffeineMg * Math.pow(0.5, elapsed / CAFFEINE_HALF_LIFE_MS);
  }, 0);
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'pm' : 'am';
  const displayH = h % 12 || 12;
  return m === 0 ? `${displayH}${ampm}` : `${displayH}:${String(m).padStart(2, '0')}${ampm}`;
}

function caffeineStatus(mg: number): { label: string; color: string } {
  if (mg < 30)  return { label: 'Minimal', color: '#6b7280' };
  if (mg < 100) return { label: 'Low', color: '#22c55e' };
  if (mg < 200) return { label: 'Optimal', color: '#16a34a' };
  if (mg < 300) return { label: 'High', color: '#f59e0b' };
  if (mg < 400) return { label: 'Very High', color: '#f97316' };
  return { label: 'Excessive', color: '#ef4444' };
}

export default function CaffeineTimeline({ drinkLog }: Props) {
  const isDark = useTheme();
  const theme = getTheme(isDark);

  const now = Date.now();

  // Only today's caffeinated drinks
  const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
  const caffeineDrinks = drinkLog
    .filter(d => d.caffeineMg > 0 && d.timestamp >= todayMidnight.getTime())
    .sort((a, b) => a.timestamp - b.timestamp);

  const totalCaffeineConsumed = caffeineDrinks.reduce((s, d) => s + d.caffeineMg, 0);
  const currentCaffeine = computeCaffeineAt(caffeineDrinks, now);
  const status = caffeineStatus(currentCaffeine);

  // ── Empty state ────────────────────────────────────────────────────────────
  if (caffeineDrinks.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0 4px' }}>
        <p style={{ fontSize: 13, color: theme.textTertiary, margin: 0 }}>
          No caffeinated drinks logged today
        </p>
        <p style={{ fontSize: 11, color: theme.textTertiary, margin: '4px 0 0' }}>
          Coffee, tea, energy drinks will appear here
        </p>
      </div>
    );
  }

  // ── Chart data ─────────────────────────────────────────────────────────────
  // X range: from 1h before first drink (or 6am) to 10h after last drink (or midnight)
  const dayStart = new Date(); dayStart.setHours(6, 0, 0, 0);
  const dayEnd   = new Date(); dayEnd.setHours(23, 59, 0, 0);

  const rangeStart = Math.max(
    dayStart.getTime(),
    caffeineDrinks[0].timestamp - 60 * 60_000,
  );
  const rangeEnd = Math.min(
    dayEnd.getTime(),
    Math.max(
      now + 2 * 3_600_000,
      caffeineDrinks[caffeineDrinks.length - 1].timestamp + 10 * 3_600_000,
    ),
  );

  // Sample every 15 min
  const STEP = 15 * 60_000;
  const samples: { time: number; mg: number }[] = [];
  for (let t = rangeStart; t <= rangeEnd; t += STEP) {
    samples.push({ time: t, mg: computeCaffeineAt(caffeineDrinks, t) });
  }
  if (samples[samples.length - 1].time < rangeEnd) {
    samples.push({ time: rangeEnd, mg: computeCaffeineAt(caffeineDrinks, rangeEnd) });
  }

  // Peak
  const peak = samples.reduce((b, s) => s.mg > b.mg ? s : b, samples[0]);

  // Crash (caffeine drops below 50mg after peak, in the future)
  const peakIdx = samples.indexOf(peak);
  let crashTime: number | null = null;
  for (let i = peakIdx; i < samples.length; i++) {
    if (samples[i].mg < 50 && samples[i].time > now) { crashTime = samples[i].time; break; }
  }

  // ── SVG chart ──────────────────────────────────────────────────────────────
  const W = 300; const H = 110;
  const PAD = { top: 10, right: 10, bottom: 22, left: 30 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  const maxMg = Math.max(peak.mg * 1.15, 200);
  const xS = (t: number) => PAD.left + ((t - rangeStart) / (rangeEnd - rangeStart)) * cW;
  const yS = (mg: number) => PAD.top + cH - Math.min((mg / maxMg) * cH, cH);

  // Build paths
  const pts = samples.map(s => `${xS(s.time).toFixed(1)},${yS(s.mg).toFixed(1)}`);
  const linePath  = `M ${pts.join(' L ')}`;
  const areaPath  = [
    `M ${xS(rangeStart).toFixed(1)},${(PAD.top + cH).toFixed(1)}`,
    ...samples.map(s => `L ${xS(s.time).toFixed(1)},${yS(s.mg).toFixed(1)}`),
    `L ${xS(rangeEnd).toFixed(1)},${(PAD.top + cH).toFixed(1)}`,
    'Z',
  ].join(' ');

  const nowX = xS(now);

  // X-axis hour labels
  const hourLabels: { time: number; label: string }[] = [];
  const twoHours = 2 * 3_600_000;
  const firstHour = Math.ceil(rangeStart / twoHours) * twoHours;
  for (let t = firstHour; t <= rangeEnd; t += twoHours) {
    const d = new Date(t);
    const h = d.getHours();
    const lbl = h === 0 ? '12am' : h === 12 ? '12pm' : h > 12 ? `${h - 12}pm` : `${h}am`;
    const lx = xS(t);
    if (lx > PAD.left + 12 && lx < PAD.left + cW - 12) hourLabels.push({ time: t, label: lbl });
  }

  // Y-axis tick values
  const yTicks = [0, 100, 200, 300].filter(v => v <= maxMg);

  const amber = '#d97706';
  const amberFill = isDark ? 'rgba(217,119,6,0.18)' : 'rgba(217,119,6,0.12)';
  const optZoneTop = yS(200); const optZoneBot = yS(100);

  return (
    <div>
      {/* Stat chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {/* Current */}
        <div style={{
          flex: 1, padding: '10px 12px', borderRadius: 12,
          background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
          border: `1px solid ${theme.cardBorder}`,
        }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: theme.textSecondary, letterSpacing: '0.05em', margin: '0 0 3px' }}>NOW</p>
          <p style={{ fontSize: 20, fontWeight: 800, color: status.color, letterSpacing: '-0.03em', margin: 0 }}>
            {Math.round(currentCaffeine)}
            <span style={{ fontSize: 11, fontWeight: 500, color: theme.textSecondary, marginLeft: 2 }}>mg</span>
          </p>
          <p style={{ fontSize: 10, color: status.color, margin: '2px 0 0', fontWeight: 600 }}>{status.label}</p>
        </div>

        {/* Peak */}
        <div style={{
          flex: 1, padding: '10px 12px', borderRadius: 12,
          background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
          border: `1px solid ${theme.cardBorder}`,
        }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: theme.textSecondary, letterSpacing: '0.05em', margin: '0 0 3px' }}>PEAK</p>
          <p style={{ fontSize: 20, fontWeight: 800, color: theme.textPrimary, letterSpacing: '-0.03em', margin: 0 }}>
            {Math.round(peak.mg)}
            <span style={{ fontSize: 11, fontWeight: 500, color: theme.textSecondary, marginLeft: 2 }}>mg</span>
          </p>
          <p style={{ fontSize: 10, color: theme.textTertiary, margin: '2px 0 0' }}>{formatTime(peak.time)}</p>
        </div>

        {/* Clears / Total */}
        <div style={{
          flex: 1, padding: '10px 12px', borderRadius: 12,
          background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
          border: `1px solid ${theme.cardBorder}`,
        }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: theme.textSecondary, letterSpacing: '0.05em', margin: '0 0 3px' }}>
            {crashTime ? 'CLEARS' : 'TODAY TOTAL'}
          </p>
          <p style={{ fontSize: 20, fontWeight: 800, color: theme.textPrimary, letterSpacing: '-0.03em', margin: 0 }}>
            {crashTime ? formatTime(crashTime) : `${Math.round(totalCaffeineConsumed)}`}
            {!crashTime && <span style={{ fontSize: 11, fontWeight: 500, color: theme.textSecondary, marginLeft: 2 }}>mg</span>}
          </p>
          <p style={{ fontSize: 10, color: theme.textTertiary, margin: '2px 0 0' }}>
            {crashTime ? '< 50mg active' : `${caffeineDrinks.length} drink${caffeineDrinks.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* SVG chart */}
      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        style={{ overflow: 'visible', display: 'block' }}
      >
        {/* Optimal zone highlight (100–200mg) */}
        {optZoneBot > optZoneTop && (
          <rect
            x={PAD.left} y={optZoneTop}
            width={cW} height={optZoneBot - optZoneTop}
            fill="rgba(34,197,94,0.07)"
          />
        )}

        {/* Area fill */}
        <defs>
          <linearGradient id="cafGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={amber} stopOpacity={isDark ? 0.3 : 0.2} />
            <stop offset="100%" stopColor={amber} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#cafGrad)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke={amber} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Optimal zone label */}
        {optZoneBot - optZoneTop > 14 && (
          <text
            x={PAD.left + cW - 2} y={optZoneTop + (optZoneBot - optZoneTop) / 2 + 3}
            textAnchor="end" fontSize="7.5" fill="rgba(22,163,74,0.6)"
            fontFamily="-apple-system, BlinkMacSystemFont, sans-serif"
          >
            optimal
          </text>
        )}

        {/* Now line */}
        {nowX > PAD.left && nowX < PAD.left + cW && (
          <g>
            <line
              x1={nowX} y1={PAD.top} x2={nowX} y2={PAD.top + cH}
              stroke={theme.textTertiary} strokeWidth="1" strokeDasharray="3,2"
            />
            <text
              x={nowX + 2} y={PAD.top + 8}
              fontSize="7.5" fill={theme.textTertiary}
              fontFamily="-apple-system, BlinkMacSystemFont, sans-serif"
            >
              now
            </text>
          </g>
        )}

        {/* Drink markers */}
        {caffeineDrinks.map((d, i) => {
          const mx = xS(d.timestamp);
          const my = yS(computeCaffeineAt(caffeineDrinks, d.timestamp));
          return (
            <circle
              key={i} cx={mx} cy={my} r={3.5}
              fill={isDark ? '#111827' : '#ffffff'}
              stroke={amber} strokeWidth="2"
            />
          );
        })}

        {/* Y-axis */}
        {yTicks.map(v => (
          <g key={v}>
            <line
              x1={PAD.left - 3} y1={yS(v)} x2={PAD.left} y2={yS(v)}
              stroke={theme.textTertiary} strokeWidth="0.5"
            />
            <text
              x={PAD.left - 5} y={yS(v) + 3}
              textAnchor="end" fontSize="7.5" fill={theme.textTertiary}
              fontFamily="-apple-system, BlinkMacSystemFont, sans-serif"
            >
              {v}
            </text>
          </g>
        ))}

        {/* X-axis baseline */}
        <line
          x1={PAD.left} y1={PAD.top + cH} x2={PAD.left + cW} y2={PAD.top + cH}
          stroke={theme.divider} strokeWidth="0.5"
        />

        {/* X-axis labels */}
        {hourLabels.map(({ time, label }) => (
          <text
            key={time} x={xS(time)} y={H - 4}
            textAnchor="middle" fontSize="7.5" fill={theme.textTertiary}
            fontFamily="-apple-system, BlinkMacSystemFont, sans-serif"
          >
            {label}
          </text>
        ))}
      </svg>

      {/* Drink breakdown */}
      <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {caffeineDrinks.map((d, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 9px', borderRadius: 20,
            background: isDark ? 'rgba(217,119,6,0.1)' : 'rgba(217,119,6,0.08)',
            border: '1px solid rgba(217,119,6,0.2)',
          }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: amber }}>{d.label}</span>
            <span style={{ fontSize: 10, color: theme.textTertiary }}>{Math.round(d.caffeineMg)}mg</span>
            <span style={{ fontSize: 10, color: theme.textTertiary }}>·</span>
            <span style={{ fontSize: 10, color: theme.textTertiary }}>{formatTime(d.timestamp)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
