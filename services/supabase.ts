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
export const signInWithGoogle = async () => {
    if (!supabase) return { data: null, error: { message: "Supabase not configured." } };
    try {
        return await supabase.auth.signInWithOAuth({
            provider: 'google',
        });
    } catch (error) {
        console.error("Google Sign in failed:", error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred during sign in.';
        return { data: null, error: { message } };
    }
};


export const signOut = async () => {
    if (!supabase) return;
    try {
        await supabase.auth.signOut();
    } catch (error) {
        console.error("Sign out failed:", error);
    }
};

// FIX: Removed explicit `Promise<User | null>` return type to let TypeScript infer it.
// This resolves potential import issues with the `User` type from `@supabase/supabase-js`.
export const getUser = async () => {
    if (!supabase) return null;
    try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
            console.error('Error fetching user:', error.message);
            return null;
        }
        return data?.user ?? null;
    } catch (e) {
        console.error('A network or unexpected error occurred while fetching the user:', e);
        return null;
    }
};

// --- Profile Data Functions ---
export const getUserProfile = async () => {
    if (!supabase) return null;
    try {
        const user = await getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('profiles')
            .select('app_state')
            .eq('id', user.id)
            .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116: "object not found"
            console.error('Error fetching profile:', error);
            return null;
        }
        return data;
    } catch (e) {
        console.error('A network or unexpected error occurred while fetching the profile:', e);
        return null;
    }
};

export const updateUserProfile = async (app_state: Partial<AppState>) => {
    if (!supabase) return;
    try {
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
    } catch (e) {
        console.error('A network or unexpected error occurred while updating the profile:', e);
    }
};