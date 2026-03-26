import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { ThemeContext, getTheme } from './context/ThemeContext';
import {
  addDrink,
  applyTimeDecay,
  applyActivity,
  createInitialState,
  getStatusColor,
  removeDrink,
  activateHangoverMode,
  deactivateHangoverMode,
  loadAndMigrateState,
  saveUserProfile,
  computeDailyTargetFromAnswers,
} from './engine/hydrationEngine';
import type { DrinkType, HydrationState, DrinkOverrides, ActivityResult, UserProfile } from './engine/hydrationEngine';
import { generateProfileSummary } from './api/profileAnalyzer';
import HydrationRing from './components/HydrationRing';
import FeedbackCard from './components/FeedbackCard';
import DrinkInput from './components/DrinkInput';
import DrinkLog from './components/DrinkLog';
import DrinkFlowModal from './components/DrinkFlowModal';
import ActivityInput from './components/ActivityInput';
import BottomNav from './components/BottomNav';
import SciencePage from './pages/SciencePage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import { FlaskIcon, StarIcon } from './components/Icons';

type Page = 'home' | 'analytics' | 'settings' | 'science';

const STORAGE_KEY = 'sip-ai-state-v2';

function loadState(): HydrationState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return loadAndMigrateState(raw);
  } catch { /* ignore */ }
  return createInitialState();
}

function saveState(state: HydrationState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [state, setState] = useState<HydrationState>(() => {
    const s = loadState();
    return applyTimeDecay(s);
  });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [page, setPage] = useState<Page>('home');
  const [selectedDrinkType, setSelectedDrinkType] = useState<DrinkType | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try { return localStorage.getItem('sip-ai-dark') === 'true'; } catch { return false; }
  });

  // Auth init
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    try { localStorage.setItem('sip-ai-dark', String(darkMode)); } catch { /* ignore */ }
    document.body.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const handleToggleDark = useCallback(() => setDarkMode(d => !d), []);

  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const decayIntervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  useEffect(() => {
    decayIntervalRef.current = setInterval(() => {
      setState((prev) => {
        const updated = applyTimeDecay(prev);
        saveState(updated);
        return updated;
      });
    }, 30_000);
    return () => clearInterval(decayIntervalRef.current);
  }, []);

  // On iOS PWA the setInterval is suspended when backgrounded.
  // Apply decay immediately whenever the app becomes visible again.
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        setState((prev) => {
          const updated = applyTimeDecay(prev);
          saveState(updated);
          return updated;
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const showFeedback = useCallback((msg: string) => {
    clearTimeout(feedbackTimerRef.current);
    setFeedback(msg);
    feedbackTimerRef.current = setTimeout(() => setFeedback(null), 5000);
  }, []);

  const handleLogin = useCallback((session: Session, initialProfile?: Partial<UserProfile>) => {
    setSession(session);
    if (initialProfile) {
      setState(prev => {
        const merged: UserProfile = { ...prev.userProfile, ...initialProfile };
        return saveUserProfile(prev, merged);
      });
    }
  }, []);

  const handleLogout = useCallback(() => {
    setSession(null);
    supabase.auth.signOut().catch(() => {});
  }, []);

  const handleSaveSetup = useCallback(async (
    answers: Record<string, string>,
    profileUpdates: Partial<UserProfile>
  ) => {
    const weightLbs = profileUpdates.weightLbs ?? state.userProfile.weightLbs ?? 155;
    const targetOz = computeDailyTargetFromAnswers(answers, weightLbs);

    // Apply immediately with the computed target and profile
    setState(prev => {
      const merged: UserProfile = { ...prev.userProfile, ...profileUpdates };
      return {
        ...saveUserProfile(prev, merged),
        onboardingAnswers: answers,
        customDailyTargetOz: targetOz,
      };
    });

    // Generate AI summary in background
    try {
      const summary = await generateProfileSummary(answers, targetOz);
      setState(prev => ({ ...prev, profileSummary: summary }));
    } catch {
      // summary stays empty — not critical
    }
  }, [state.userProfile]);

  const handleSelectDrink = useCallback((type: DrinkType) => {
    setSelectedDrinkType(type);
  }, []);

  const handleScanConfirm = useCallback((type: DrinkType, volumeMl: number, displayName: string, thumbnail?: string) => {
    setState((prev) => {
      const decayed = applyTimeDecay(prev);
      const overrides = {
        ...(displayName ? { label: displayName } : {}),
        ...(thumbnail ? { scanThumbnail: thumbnail } : {}),
      };
      const { newState, entry } = addDrink(decayed, type, volumeMl, overrides);
      showFeedback(entry.feedback);
      return newState;
    });
  }, [showFeedback]);

  const handleFlowConfirm = useCallback(
    (type: DrinkType, volume_ml: number, overrides: DrinkOverrides) => {
      setSelectedDrinkType(null);
      setState((prev) => {
        const decayed = applyTimeDecay(prev);
        const { newState, entry } = addDrink(decayed, type, volume_ml, overrides);
        showFeedback(entry.feedback);
        return newState;
      });
    },
    [showFeedback]
  );

  const handleFlowClose = useCallback(() => {
    setSelectedDrinkType(null);
  }, []);

  const handleRemove = useCallback((id: string) => {
    setState((prev) => {
      const updated = removeDrink(prev, id);
      saveState(updated);
      return updated;
    });
  }, []);

  const handleActivity = useCallback((result: ActivityResult) => {
    setState((prev) => {
      const updated = applyActivity(prev, result);
      showFeedback(result.feedback);
      saveState(updated);
      return updated;
    });
  }, [showFeedback]);

  const handleHangoverToggle = useCallback(() => {
    setState((prev) => {
      const updated = prev.hangoverMode
        ? deactivateHangoverMode(prev)
        : activateHangoverMode(prev);
      saveState(updated);
      return updated;
    });
  }, []);

  const handleSaveProfile = useCallback((profile: UserProfile) => {
    setState((prev) => {
      const updated = saveUserProfile(prev, profile);
      saveState(updated);
      return updated;
    });
  }, []);

  const ringColor = getStatusColor(state.level);
  const theme = getTheme(darkMode);

  // Loading screen while checking auth
  if (!authReady) {
    return (
      <ThemeContext.Provider value={darkMode}>
        <div style={{ background: theme.bg, minHeight: '100dvh' }} />
      </ThemeContext.Provider>
    );
  }

  // Show login if not authenticated
  if (!session) {
    return (
      <ThemeContext.Provider value={darkMode}>
        <LoginPage onLogin={handleLogin} />
      </ThemeContext.Provider>
    );
  }

  // Science page is full-screen with no bottom nav
  if (page === 'science') {
    return (
      <ThemeContext.Provider value={darkMode}>
        <SciencePage onClose={() => setPage('home')} />
      </ThemeContext.Provider>
    );
  }

  const showBottomNav = page === 'home' || page === 'analytics' || page === 'settings';

  return (
    <ThemeContext.Provider value={darkMode}>
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: theme.bg, maxWidth: 420, margin: '0 auto' }}
    >
      {/* ── Header (always visible) ── */}
      <header className="flex items-center justify-between px-5 pt-5 pb-1" style={{ background: theme.bg }}>
        <div className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="Sip AI"
            style={{ height: 28, width: 'auto', display: 'block', filter: darkMode ? 'invert(1)' : 'none' }}
          />
          {state.streak > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                background: 'rgba(251,191,36,0.12)',
                border: '1px solid rgba(217,119,6,0.2)',
                borderRadius: 999,
                padding: '2px 8px',
                marginLeft: 4,
              }}
            >
              <StarIcon size={10} color="#b45309" />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#b45309' }}>
                {state.streak} day streak
              </span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Recovery / Hangover button */}
          <button
            onClick={handleHangoverToggle}
            style={{
              height: 32,
              padding: '0 12px',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              border: state.hangoverMode
                ? '1px solid rgba(249,115,22,0.35)'
                : darkMode ? '1px solid rgba(255,255,255,0.09)' : '1px solid rgba(0,0,0,0.09)',
              background: state.hangoverMode
                ? 'rgba(249,115,22,0.08)'
                : darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {state.hangoverMode && (
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#f97316',
                flexShrink: 0,
                animation: 'shimmer 1.8s ease infinite',
              }} />
            )}
            <span style={{
              fontSize: 12,
              fontWeight: 600,
              color: state.hangoverMode ? '#c2410c' : (darkMode ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.38)'),
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
            }}>
              {state.hangoverMode ? 'Recovery' : 'Hangover?'}
            </span>
          </button>

          {/* Science / menu */}
          <button
            onClick={() => setPage('science')}
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <FlaskIcon size={20} color={theme.textSecondary} />
          </button>
        </div>
      </header>

      {/* ── Page content ── */}
      {page === 'analytics' && <AnalyticsPage state={state} />}
      {page === 'settings' && <SettingsPage
        profile={state.userProfile}
        onSave={handleSaveProfile}
        darkMode={darkMode}
        onToggleDark={handleToggleDark}
        session={session}
        onLogout={handleLogout}
        onSetupComplete={handleSaveSetup}
        profileSummary={state.profileSummary}
        customDailyTargetOz={state.customDailyTargetOz}
        onboardingAnswers={state.onboardingAnswers}
      />}

      {/* ── Home page ── */}
      {page === 'home' && (
        <>
          {/* Ring */}
          <div className="flex flex-col items-center pt-4 pb-2">
            <HydrationRing
              level={state.level}
              activeCaffeineMg={state.activeCaffeineMg}
              hasRecentElectrolytes={state.hasRecentElectrolytes}
              hangoverMode={state.hangoverMode}
            />
          </div>

          {/* Gradient divider */}
          <div
            className="mx-6 mb-3"
            style={{
              height: 1,
              background: `linear-gradient(90deg, transparent, ${ringColor}40, transparent)`,
            }}
          />

          {/* Feedback + suggestion */}
          <FeedbackCard feedback={feedback} state={state} />

          <div className="flex-1" style={{ minHeight: 16 }} />

          {/* Drink input */}
          <DrinkInput onSelectDrink={handleSelectDrink} onScanConfirm={handleScanConfirm} hangoverMode={state.hangoverMode} />

          {/* Activity input */}
          <div className="px-4 mt-3">
            <ActivityInput onActivity={handleActivity} />
          </div>

          {/* Divider */}
          <div className="mx-6 my-3" style={{ height: 1, background: theme.divider }} />

          {/* Log */}
          <DrinkLog log={state.drinkLog} activityLog={state.activityLog} onRemove={handleRemove} />
        </>
      )}

      {/* Bottom nav spacer */}
      {showBottomNav && <div style={{ height: 74 }} />}

      {/* Drink flow modal — above bottom nav */}
      <DrinkFlowModal
        drinkType={selectedDrinkType}
        onConfirm={handleFlowConfirm}
        onClose={handleFlowClose}
      />

      {/* Bottom Nav with built-in scan button */}
      {showBottomNav && (
        <BottomNav
          activePage={page as 'home' | 'analytics' | 'settings'}
          onNavigate={(p) => setPage(p)}
          onScanComplete={(type) => setSelectedDrinkType(type)}
        />
      )}
    </div>
    </ThemeContext.Provider>
  );
}
