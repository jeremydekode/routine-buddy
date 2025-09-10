// services/cloudSync.ts
import { supabase } from '../lib/supabaseClient';

export type CloudState = any; // we store your whole app state as JSON

export async function getSessionUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

export async function loadCloudState(): Promise<CloudState | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const { data, error } = await supabase
    .from('app_state')
    .select('state')
    .eq('user_id', userId)
    .single();
  if (error) return null;
  return data?.state ?? null;
}

export async function saveCloudState(state: CloudState) {
  const userId = await getSessionUserId();
  if (!userId) return;
  await supabase
    .from('app_state')
    .upsert({ user_id: userId, state, updated_at: new Date().toISOString() });
}
