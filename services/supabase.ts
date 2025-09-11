// FIX: Removed `User` from import to resolve module export error.
import { createClient } from '@supabase/supabase-js';
import { AppState } from '../types';

const supabaseUrl = 'https://ayvqicsiocgunoxgfmpj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5dnFpY3Npb2NndW5veGZtcGoiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcxOTkzOTI5MywiZXhwIjoyMDM1NTE1MjkzfQ.1CIy_v1tBev9s2P9yXn3xGv-z-1ZQ_v3tZp0l8Zk2fY';

let supabaseInstance = null;
if (supabaseUrl && supabaseAnonKey) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
} else {
    console.warn('Supabase environment variables not set. Sync features will be disabled.');
}

export const supabase = supabaseInstance;

// --- Auth Functions ---
export const signUp = async (email, password) => {
    if (!supabase) return { error: { message: "Supabase not configured." } };
    return supabase.auth.signUp({ email, password });
};

export const signIn = async (email, password) => {
    if (!supabase) return { error: { message: "Supabase not configured." } };
    return supabase.auth.signInWithPassword({ email, password });
};

export const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
};

// FIX: Removed explicit `Promise<User | null>` return type to let TypeScript infer it.
// This resolves potential import issues with the `User` type from `@supabase/supabase-js`.
export const getUser = async () => {
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getUser();
    if (error) {
        console.error('Error fetching user:', error.message);
        return null;
    }
    return data?.user ?? null;
};

// --- Profile Data Functions ---
export const getUserProfile = async () => {
    if (!supabase) return null;
    const user = await getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('profiles')
        .select('app_state')
        .eq('id', user.id)
        .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116: "object not found"
        console.error('Error fetching profile:', error);
    }
    return data;
};

export const updateUserProfile = async (app_state: Partial<AppState>) => {
    if (!supabase) return;
    const user = await getUser();
    if (!user) return;

    const updates = {
        id: user.id,
        app_state,
        updated_at: new Date(),
    };

    const { error } = await supabase.from('profiles').upsert(updates);

    if (error) {
        console.error('Error updating profile:', error);
    }
};