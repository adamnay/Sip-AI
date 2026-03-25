import { useState } from 'react';
import { useTheme, getTheme } from '../context/ThemeContext';
import type { DrinkEntry, DrinkType, ActivityEntry } from '../engine/hydrationEngine';
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
  CheckIcon,
  ActivityIcon,
} from './Icons';

interface Props {
  log: DrinkEntry[];
  activityLog?: ActivityEntry[];
  onRemove: (id: string) => void;
}

export function getDrinkIcon(type: DrinkType, size: number = 18, color: string = 'rgba(0,0,0,0.45)') {
  switch (type) {
    case 'water': return <WaterIcon size={size} color={color} />;
    case 'coffee': return <CoffeeIcon size={size} color={color} />;
    case 'energy_drink': return <EnergyIcon size={size} color={color} />;
    case 'tea': return <TeaIcon size={size} color={color} />;
    case 'juice': return <JuiceIcon size={size} color={color} />;
    case 'soda': return <SodaIcon size={size} color={color} />;
    case 'electrolyte': return <ElectrolyteIcon size={size} color={color} />;
    case 'alcohol': return <AlcoholIcon size={size} color={color} />;
    case 'smoothie': return <JuiceIcon size={size} color={color} />;
    default: return <WaterIcon size={size} color={color} />;
  }
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

type CombinedEntry =
  | { kind: 'drink'; data: DrinkEntry }
  | { kind: 'activity'; data: ActivityEntry };

export default function DrinkLog({ log, activityLog = [], onRemove }: Props) {
  const isDark = useTheme();
  const theme = getTheme(isDark);
  const [expanded, setExpanded] = useState(false);

  // Merge drinks + activities sorted by most recent
  const combined: CombinedEntry[] = [
    ...log.map(d => ({ kind: 'drink' as const, data: d })),
    ...activityLog.map(a => ({ kind: 'activity' as const, data: a })),
  ].sort((a, b) => b.data.timestamp - a.data.timestamp);

  if (combined.length === 0) {
    return (
      <div className="px-4 pb-4">
        <p className="text-center text-xs" style={{ color: theme.textTertiary }}>
          Log your first drink above
        </p>
      </div>
    );
  }

  const visible = expanded ? combined : combined.slice(0, 4);

  return (
    <div className="px-4 pb-6 flex flex-col gap-2">
      <p className="text-xs font-semibold tracking-wider uppercase px-1" style={{ color: theme.textTertiary }}>
        Recent
      </p>

      <div className="flex flex-col gap-1.5">
        {visible.map((item, i) =>
          item.kind === 'drink'
            ? <LogItem key={item.data.id} entry={item.data} index={i} onRemove={onRemove} theme={theme} />
            : <ActivityItem key={item.data.id} entry={item.data} index={i} theme={theme} />
        )}
      </div>

      {combined.length > 4 && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-xs text-center py-2"
          style={{ color: theme.textTertiary, cursor: 'pointer' }}
        >
          {expanded ? 'Show less' : `+${combined.length - 4} more`}
        </button>
      )}
    </div>
  );
}

function LogItem({
  entry, index, onRemove, theme,
}: {
  entry: DrinkEntry; index: number; onRemove: (id: string) => void; theme: ReturnType<typeof getTheme>;
}) {
  const [confirming, setConfirming] = useState(false);

  const isPositive = entry.hydrationDelta > 0;
  const deltaText = isPositive
    ? `+${entry.hydrationDelta.toFixed(0)}%`
    : `${entry.hydrationDelta.toFixed(0)}%`;
  const deltaColor = isPositive ? '#16a34a' : '#dc2626';

  const handleDelete = () => {
    if (confirming) {
      onRemove(entry.id);
    } else {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
    }
  };

  return (
    <div
      className="glass rounded-xl px-3 py-2.5 flex items-center gap-3 log-item"
      style={{
        animationDelay: `${index * 0.04}s`,
        borderColor: confirming ? 'rgba(239,68,68,0.2)' : theme.cardBorder,
        transition: 'border-color 0.2s ease',
      }}
    >
      <span style={{ flexShrink: 0 }}>
        {getDrinkIcon(entry.type, 18, theme.textSecondary)}
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight truncate" style={{ color: theme.textPrimary }}>
          {entry.label}
        </p>
        <p className="text-xs leading-tight" style={{ color: theme.textSecondary }}>
          {mlToOz(entry.volume_ml)}oz · {timeAgo(entry.timestamp)}
        </p>
      </div>

      <span className="text-sm font-semibold tabular-nums" style={{ color: deltaColor, flexShrink: 0 }}>
        {deltaText}
      </span>

      {/* Delete button — tap once to arm, tap again to confirm */}
      <button
        onClick={handleDelete}
        style={{
          flexShrink: 0,
          width: 28, height: 28,
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: confirming ? 'rgba(239,68,68,0.1)' : theme.divider,
          border: `1px solid ${confirming ? 'rgba(239,68,68,0.3)' : theme.cardBorder}`,
          transition: 'all 0.15s ease',
          cursor: 'pointer',
        }}
        title={confirming ? 'Tap again to confirm removal' : 'Remove drink'}
      >
        {confirming
          ? <CheckIcon size={12} color="#dc2626" />
          : <XIcon size={12} color={theme.textTertiary} />
        }
      </button>
    </div>
  );
}

function ActivityItem({
  entry, index, theme,
}: {
  entry: ActivityEntry; index: number; theme: ReturnType<typeof getTheme>;
}) {
  const deltaColor = '#dc2626';
  const deltaText = `${entry.hydrationDelta.toFixed(0)}%`;

  return (
    <div
      className="glass rounded-xl px-3 py-2.5 flex items-center gap-3 log-item"
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      <span style={{ flexShrink: 0 }}>
        <ActivityIcon size={18} color={theme.textSecondary} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight truncate" style={{ color: theme.textPrimary }}>
          {entry.label}
        </p>
        <p className="text-xs leading-tight" style={{ color: theme.textSecondary }}>
          {timeAgo(entry.timestamp)}
        </p>
      </div>
      <span className="text-sm font-semibold tabular-nums" style={{ color: deltaColor, flexShrink: 0 }}>
        {deltaText}
      </span>
    </div>
  );
}

function mlToOz(ml: number): string {
  return (ml / 29.5735).toFixed(0);
}
