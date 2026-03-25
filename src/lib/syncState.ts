import { supabase } from './supabase';
import type { HydrationState } from '../engine/hydrationEngine';

export async function loadStateFromCloud(userId: string): Promise<HydrationState | null> {
  try {
    const { data, error } = await supabase
      .from('hydration_states')
      .select('state')
      .eq('user_id', userId)
      .single();
    if (error || !data) return null;
    return data.state as HydrationState;
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
