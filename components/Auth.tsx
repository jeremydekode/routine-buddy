import * as React from 'react';
import { signInWithGoogle } from '../services/supabase';
import { SunIcon, GoogleIcon } from './icons/Icons';
import { useAppContext } from '../hooks/useAppContext';

export const Auth: React.FC = () => {
    const { dispatch } = useAppContext();
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    // This effect detects when the user returns from the Google login page.
    // If the login doesn't succeed within 5 seconds, it shows an error.
    React.useEffect(() => {
        // Check if the URL hash contains Supabase auth tokens.
        if (window.location.hash.includes('access_token') || window.location.hash.includes('error_description')) {
            setLoading(true);
            const timeout = setTimeout(() => {
                setError("Login failed. Please check your Supabase 'Site URL' configuration and your network connection.");
                setLoading(false);
                // Clean the URL to prevent the error from showing up on a refresh.
                window.history.replaceState(null, '', window.location.pathname);
            }, 5000); // 5-second timeout for Supabase to establish a session.

            return () => clearTimeout(timeout);
        }
    }, []);

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError(null);
        const { error: authError } = await signInWithGoogle();
        if (authError) {
            setError(authError.message);
            setLoading(false);
        }
        // On successful initiation, Supabase redirects to Google.
        // The onAuthStateChange listener in AppContext will handle the successful login upon return.
    };
    
    const handleGuestSignIn = () => {
        dispatch({ type: 'SIGN_IN_AS_GUEST' });
    };

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="inline-block p-4 bg-amber-200 rounded-full mb-4">
                        <SunIcon className="w-12 h-12 text-amber-500" />
                    </div>
                    <h1 className="text-4xl font-bold text-slate-800">Routine Buddy</h1>
                    <p className="text-slate-500 mt-2">Sign in to sync your family's progress.</p>
                </div>
            
                <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
                    <div className="space-y-4">
                        <button
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 text-slate-700 font-bold py-3 px-4 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
                        >
                            <GoogleIcon className="w-6 h-6" />
                            {loading ? 'Connecting...' : 'Sign in with Google'}
                        </button>

                        {error && <p className="text-red-500 text-sm text-center pt-2">{error}</p>}
                    </div>
                    
                    <div className="relative flex py-5 items-center">
                        <div className="flex-grow border-t border-slate-200"></div>
                        <span className="flex-shrink mx-4 text-slate-400 text-sm font-semibold">OR</span>
                        <div className="flex-grow border-t border-slate-200"></div>
                    </div>

                    <button
                        onClick={handleGuestSignIn}
                        className="w-full text-center text-slate-500 font-bold py-2 rounded-lg hover:text-purple-600 hover:bg-purple-50 transition"
                    >
                        Continue as Guest
                    </button>
                </div>
            </div>
        </div>
    );
};