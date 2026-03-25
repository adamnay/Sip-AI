import { useEffect, useState } from 'react';
import { getStatusColor, getSmartSuggestion, getWasteInsight } from '../engine/hydrationEngine';
import type { HydrationState } from '../engine/hydrationEngine';
import { BrainIcon, FlaskIcon } from './Icons';
import { useTheme, getTheme } from '../context/ThemeContext';

interface Props {
  feedback: string | null;
  state: HydrationState;
}

export default function FeedbackCard({ feedback, state }: Props) {
  const isDark = useTheme();
  const theme = getTheme(isDark);
  const [visible, setVisible] = useState(false);
  const color = getStatusColor(state.level);
  const suggestion = getSmartSuggestion(state);
  const wasteInsight = getWasteInsight(state.drinkLog);

  useEffect(() => {
    if (feedback) {
      setVisible(false);
      const t = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  return (
    <div className="w-full flex flex-col gap-2 px-4">
      {/* Instant feedback */}
      {feedback && (
        <div
          className="glass rounded-2xl px-4 py-3"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 0.35s ease, transform 0.35s ease',
            borderColor: `${color}30`,
            borderLeftWidth: 3,
            borderLeftColor: color,
          }}
        >
          <p className="text-sm font-medium leading-snug" style={{ color: theme.textPrimary }}>
            {feedback}
          </p>
        </div>
      )}

      {/* Smart suggestion */}
      <div className="glass rounded-2xl px-4 py-3 flex items-start gap-3">
        <span style={{ flexShrink: 0, marginTop: 2 }}>
          <BrainIcon size={16} color={theme.textTertiary} />
        </span>
        <p className="text-sm leading-snug" style={{ color: theme.textSecondary }}>
          {suggestion}
        </p>
      </div>

      {/* Binge warning */}
      {wasteInsight && (
        <div
          className="glass rounded-2xl px-4 py-3 flex items-start gap-3 animate-fade-up"
          style={{
            borderColor: 'rgba(217,119,6,0.2)',
            borderLeftWidth: 3,
            borderLeftColor: '#d97706',
          }}
        >
          <span style={{ flexShrink: 0, marginTop: 2 }}>
            <FlaskIcon size={16} color="#d97706" />
          </span>
          <p className="text-sm leading-snug" style={{ color: '#92400e' }}>
            {wasteInsight}
          </p>
        </div>
      )}
    </div>
  );
}
