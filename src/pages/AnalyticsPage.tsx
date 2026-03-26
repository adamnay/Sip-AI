import type { HydrationState, DailyRecord } from '../engine/hydrationEngine';
import { getStatusColor } from '../engine/hydrationEngine';
import { TrophyIcon, BarChartIcon, WaterIcon, EnergyIcon, CoffeeIcon } from '../components/Icons';
import { useTheme, getTheme } from '../context/ThemeContext';
import CaffeineTimeline from '../components/CaffeineTimeline';

interface Props {
  state: HydrationState;
}

function getTodayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getWeeklyData(state: HydrationState): Array<{
  date: string;
  level: number | null;
  dayLabel: string;
  isToday: boolean;
}> {
  const today = getTodayDateString();
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const dayLabel = i === 0 ? 'Today' : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
    const isToday = dateStr === today;

    let level: number | null = null;
    if (isToday) {
      level = Math.round(state.level);
    } else {
      const record = state.dailyHistory.find((r: DailyRecord) => r.date === dateStr);
      level = record ? record.closingLevel : null;
    }
    result.push({ date: dateStr, level, dayLabel, isToday });
  }
  return result;
}

/** Maps a hydration level (0–100) to an estimated energy capacity (0–100).
 *  Based on research: 2% dehydration → ~10–20% cognitive/physical performance drop.
 *  In our model, 85% hydration = fully optimal; every point below costs ~1.2 energy pts. */
function hydrationToEnergy(level: number): number {
  if (level >= 85) return 100;
  return Math.max(10, Math.round(100 - (85 - level) * 1.2));
}

function getEnergyColor(score: number): string {
  if (score >= 85) return '#22c55e';
  if (score >= 65) return '#eab308';
  if (score >= 45) return '#f97316';
  return '#ef4444';
}

function StatCard({ label, value, sub, color, theme }: { label: string; value: string; sub?: string; color?: string; theme: ReturnType<typeof getTheme> }) {
  return (
    <div style={{
      background: theme.card,
      borderRadius: 16,
      padding: '14px 16px',
      boxShadow: theme.cardShadow,
      border: `1px solid ${theme.cardBorder}`,
      flex: 1,
    }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: theme.textSecondary, letterSpacing: '0.06em', marginBottom: 4, minHeight: 30 }}>
        {label}
      </p>
      <p style={{ fontSize: 24, fontWeight: 700, color: color ?? theme.textPrimary, letterSpacing: '-0.03em', lineHeight: 1 }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: 11, color: theme.textSecondary, marginTop: 3 }}>{sub}</p>}
    </div>
  );
}

export default function AnalyticsPage({ state }: Props) {
  const isDark = useTheme();
  const theme = getTheme(isDark);
  const weekData = getWeeklyData(state);
  const maxLevel = 100;

  // Stats calculations
  const thisWeekDrinks = state.drinkLog.filter(e => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return e.timestamp > sevenDaysAgo;
  });

  const validLevels = weekData.filter(d => d.level !== null).map(d => d.level as number);
  const avgLevel = validLevels.length > 0
    ? Math.round(validLevels.reduce((a, b) => a + b, 0) / validLevels.length)
    : 0;

  const bestDay = weekData.reduce<{ label: string; level: number } | null>((best, d) => {
    if (d.level === null) return best;
    if (!best || d.level > best.level) return { label: d.dayLabel, level: d.level };
    return best;
  }, null);

  // Energy calculations
  const currentEnergy = hydrationToEnergy(state.level);
  const avgEnergy = validLevels.length > 0
    ? Math.round(validLevels.reduce((sum, l) => sum + hydrationToEnergy(l), 0) / validLevels.length)
    : 0;

  // Energy recovered today (from today's drink log)
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayDrinks = state.drinkLog.filter(e => e.timestamp >= todayStart.getTime());
  const energyRecoveredToday = Math.round(
    todayDrinks.reduce((sum, e) => sum + Math.max(0, e.hydrationDelta) * 1.2, 0)
  );

  // Drink type breakdown this week
  const typeCount: Record<string, number> = {};
  thisWeekDrinks.forEach(e => {
    typeCount[e.label] = (typeCount[e.label] ?? 0) + 1;
  });
  const topTypes = Object.entries(typeCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div
      style={{
        background: theme.bg,
        minHeight: '100dvh',
        maxWidth: 420,
        margin: '0 auto',
        paddingBottom: 90,
      }}
    >
      {/* Header */}
      <div style={{ padding: '20px 20px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <BarChartIcon size={18} color={theme.textPrimary} />
          <h1 style={{ fontSize: 20, fontWeight: 700, color: theme.textPrimary, letterSpacing: '-0.02em', margin: 0 }}>
            Analytics
          </h1>
        </div>
        <p style={{ fontSize: 13, color: theme.textSecondary, margin: 0 }}>Your hydration over time</p>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Streak cards */}
        <div style={{ display: 'flex', gap: 10 }}>
          <StatCard
            label="LOGGING STREAK"
            value={`${state.streak}`}
            sub={state.streak === 1 ? 'day' : 'days'}
            color={state.streak >= 3 ? '#16a34a' : theme.textPrimary}
            theme={theme}
          />
          <StatCard
            label="BEST STREAK"
            value={`${state.bestStreak}`}
            sub={state.bestStreak === 1 ? 'day' : 'days'}
            color="#b45309"
            theme={theme}
          />
        </div>

        {/* 7-day bar chart */}
        <div style={{
          background: theme.card,
          borderRadius: 20,
          padding: '16px 16px 12px',
          boxShadow: theme.cardShadow,
          border: `1px solid ${theme.cardBorder}`,
        }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: theme.textSecondary, letterSpacing: '0.06em', marginBottom: 14 }}>
            7-DAY HYDRATION
          </p>

          {/* Bars */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 100 }}>
            {weekData.map((d) => {
              const barHeight = d.level !== null ? (d.level / maxLevel) * 100 : 0;
              const isEmpty = d.level === null;
              const barColor = isEmpty
                ? theme.divider
                : d.isToday
                ? theme.textPrimary
                : getStatusColor(d.level!);

              return (
                <div
                  key={d.date}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}
                >
                  {/* Level label */}
                  {d.level !== null && (
                    <span style={{ fontSize: 9, fontWeight: 600, color: d.isToday ? theme.textPrimary : theme.textSecondary }}>
                      {d.level}%
                    </span>
                  )}
                  {/* Bar */}
                  <div style={{ width: '100%', position: 'relative', height: `${Math.max(barHeight, 4)}%`, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    <div style={{
                      width: '100%',
                      height: isEmpty ? 4 : '100%',
                      background: barColor,
                      borderRadius: 6,
                      transition: 'height 0.6s cubic-bezier(0.16,1,0.3,1)',
                      border: isEmpty ? `1px dashed ${theme.textTertiary}` : 'none',
                      minHeight: 4,
                    }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Day labels */}
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            {weekData.map((d) => (
              <div key={d.date} style={{ flex: 1, textAlign: 'center' }}>
                <span style={{
                  fontSize: 10,
                  fontWeight: d.isToday ? 700 : 400,
                  color: d.isToday ? theme.textPrimary : theme.textSecondary,
                }}>
                  {d.dayLabel === 'Today' ? 'Now' : d.dayLabel.slice(0, 3)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Energy section */}
        <div style={{
          background: theme.card,
          borderRadius: 20,
          padding: '16px',
          boxShadow: theme.cardShadow,
          border: `1px solid ${theme.cardBorder}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <EnergyIcon size={14} color={theme.textSecondary} />
            <p style={{ fontSize: 12, fontWeight: 600, color: theme.textSecondary, letterSpacing: '0.06em', margin: 0 }}>
              ENERGY FROM HYDRATION
            </p>
          </div>

          {/* Score + bar */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <span style={{ fontSize: 40, fontWeight: 700, color: getEnergyColor(currentEnergy), letterSpacing: '-0.03em', lineHeight: 1 }}>
                {currentEnergy}%
              </span>
              <p style={{ fontSize: 11, color: theme.textSecondary, margin: '4px 0 0' }}>estimated energy capacity</p>
            </div>
            {energyRecoveredToday > 0 && (
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#22c55e', letterSpacing: '-0.02em' }}>
                  +{energyRecoveredToday}pts
                </span>
                <p style={{ fontSize: 11, color: theme.textSecondary, margin: '2px 0 0' }}>recovered today</p>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div style={{ height: 6, borderRadius: 3, background: theme.divider, overflow: 'hidden', marginBottom: 14 }}>
            <div style={{
              height: '100%',
              width: `${currentEnergy}%`,
              background: `linear-gradient(90deg, ${getEnergyColor(Math.min(currentEnergy, 50))}, ${getEnergyColor(currentEnergy)})`,
              borderRadius: 3,
              transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
            }} />
          </div>

          {/* Weekly average + insight */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <div style={{
              flex: 1, background: theme.inputBg, borderRadius: 12, padding: '10px 12px',
              border: `1px solid ${theme.cardBorder}`,
            }}>
              <p style={{ fontSize: 11, color: theme.textSecondary, margin: '0 0 2px' }}>WEEKLY AVG</p>
              <p style={{ fontSize: 17, fontWeight: 700, color: avgEnergy > 0 ? getEnergyColor(avgEnergy) : theme.textTertiary, margin: 0, letterSpacing: '-0.02em' }}>
                {avgEnergy > 0 ? `${avgEnergy}%` : '—'}
              </p>
            </div>
            <div style={{
              flex: 1, background: theme.inputBg, borderRadius: 12, padding: '10px 12px',
              border: `1px solid ${theme.cardBorder}`,
            }}>
              <p style={{ fontSize: 11, color: theme.textSecondary, margin: '0 0 2px' }}>TODAY DRINKS</p>
              <p style={{ fontSize: 17, fontWeight: 700, color: theme.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>
                {todayDrinks.length}
              </p>
            </div>
          </div>

          {/* Science note */}
          <p style={{ fontSize: 11, color: theme.textTertiary, margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>
            Even 2% dehydration can reduce cognitive and physical performance by 10–20%. Staying above 70% keeps energy near peak.
          </p>
        </div>

        {/* Caffeine Timeline */}
        <div style={{
          background: theme.card,
          borderRadius: 20,
          padding: '16px',
          boxShadow: theme.cardShadow,
          border: `1px solid ${theme.cardBorder}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <CoffeeIcon size={14} color={theme.textSecondary} />
            <p style={{ fontSize: 12, fontWeight: 600, color: theme.textSecondary, letterSpacing: '0.06em', margin: 0 }}>
              CAFFEINE TIMELINE
            </p>
          </div>
          <CaffeineTimeline drinkLog={state.drinkLog} />
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 10 }}>
          <StatCard
            label="WEEKLY AVG"
            value={avgLevel > 0 ? `${avgLevel}%` : '—'}
            sub="hydration"
            color={avgLevel > 0 ? getStatusColor(avgLevel) : theme.textTertiary}
            theme={theme}
          />
          <StatCard
            label="DRINKS LOGGED"
            value={`${thisWeekDrinks.length}`}
            sub="this week"
            theme={theme}
          />
        </div>

        {bestDay && (
          <div style={{ display: 'flex', gap: 10 }}>
            <StatCard
              label="BEST DAY"
              value={`${bestDay.level}%`}
              sub={bestDay.label}
              color={getStatusColor(bestDay.level)}
              theme={theme}
            />
            <StatCard
              label="TODAY"
              value={`${Math.round(state.level)}%`}
              sub="current level"
              color={getStatusColor(state.level)}
              theme={theme}
            />
          </div>
        )}

        {/* Streak badge if earned */}
        {state.streak >= 3 && (
          <div style={{
            background: 'rgba(251,191,36,0.1)',
            border: '1px solid rgba(217,119,6,0.2)',
            borderRadius: 16,
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <TrophyIcon size={20} color="#b45309" />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#92400e', margin: 0 }}>
                {state.streak} day streak — keep it going
              </p>
              <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)', margin: '2px 0 0' }}>
                Best: {state.bestStreak} days
              </p>
            </div>
          </div>
        )}

        {/* Top drink types */}
        {topTypes.length > 0 && (
          <div style={{
            background: theme.card,
            borderRadius: 20,
            padding: '16px',
            boxShadow: theme.cardShadow,
            border: `1px solid ${theme.cardBorder}`,
          }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: theme.textSecondary, letterSpacing: '0.06em', marginBottom: 12 }}>
              MOST LOGGED THIS WEEK
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topTypes.map(([label, count], i) => {
                const pct = Math.round((count / thisWeekDrinks.length) * 100);
                return (
                  <div key={label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: theme.textPrimary }}>{label}</span>
                      <span style={{ fontSize: 13, color: theme.textSecondary }}>{count}×</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: theme.divider, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: i === 0 ? theme.textPrimary : theme.textTertiary,
                        borderRadius: 2,
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {thisWeekDrinks.length === 0 && (
          <div style={{
            background: theme.card,
            borderRadius: 20,
            padding: '32px 20px',
            textAlign: 'center',
            border: `1px solid ${theme.cardBorder}`,
          }}>
            <WaterIcon size={32} color={theme.textTertiary} />
            <p style={{ fontSize: 14, color: theme.textSecondary, marginTop: 10 }}>
              Log some drinks to see your analytics
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
