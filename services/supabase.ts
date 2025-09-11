import { createClient, User } from '@supabase/supabase-js';
import { AppState } from '../types';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

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

export const getUser = async (): Promise<User | null> => {
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