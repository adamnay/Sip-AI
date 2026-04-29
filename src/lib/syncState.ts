import { supabase } from './supabase';
import type { HydrationState, DrinkEntry } from '../engine/hydrationEngine';

export async function loadStateFromCloud(
  userId: string,
  localState?: HydrationState,
): Promise<HydrationState | null> {
  try {
    const { data, error } = await supabase
      .from('hydration_states')
      .select('state, updated_at')
      .eq('user_id', userId)
      .single();
    if (error || !data) return null;

    const cloudState = data.state as HydrationState;

    // If we have a local state, compare timestamps and return whichever is newer.
    // This means the last device to log a drink always wins — no data gets lost.
    if (localState) {
      const cloudTs = new Date(data.updated_at as string).getTime();
      const localTs = localState.lastUpdate ?? 0;
      return cloudTs >= localTs ? cloudState : null; // null = keep local
    }

    return cloudState;
  } catch {
    return null;
  }
}

export async function saveStateToCloud(userId: string, state: HydrationState): Promise<void> {
  try {
    await supabase
      .from('hydration_states')
      .upsert({ user_id: userId, state, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  } catch {
    // Fail silently — local state is source of truth
  }
}

// Write a single drink entry to the drink_logs table.
// This gives us a permanent history of every drink ever logged —
// separate from the JSON blob, queryable, and never lost on state reset.
export async function logDrinkToCloud(userId: string, entry: DrinkEntry): Promise<void> {
  try {
    const hydrationPerMl    = entry.volume_ml > 0 ? entry.hydrationDelta / entry.volume_ml : 0.035;
    const caffeinePer100ml  = entry.volume_ml > 0 ? Math.round((entry.caffeineMg / entry.volume_ml) * 100) : 0;
    const electrolyte       = entry.type === 'electrolyte';

    await supabase.from('drink_logs').insert({
      id:                entry.id,
      user_id:           userId,
      drink_type:        entry.type,
      display_name:      entry.label,
      volume_ml:         entry.volume_ml,
      hydration_per_ml:  hydrationPerMl,
      caffeine_per_100ml: caffeinePer100ml,
      electrolyte,
      logged_at:         new Date(entry.timestamp).toISOString(),
    });
  } catch {
    // Fail silently — local state is still the source of truth
  }
}
