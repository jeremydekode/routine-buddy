
import * as React from 'react';
import { signIn, signUp } from '../services/supabase';
import { SunIcon } from './icons/Icons';

export const Auth: React.FC = () => {
    const [isLoginView, setIsLoginView] = React.useState(true);
    const [email, setEmail] = React.useState('jeremytehh@gmail.com');
    const [password, setPassword] = React.useState('123123');
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error: authError } = isLoginView
            ? await signIn(email, password)
            : await signUp(email, password);
        
        if (authError) {
            setError(authError.message);
        } else if (!isLoginView) {
            setError('Check your email for a confirmation link!');
        }
        // On successful login, the onAuthStateChange listener in AppContext will handle the redirect.

        setLoading(false);
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
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-slate-600">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full mt-1 p-3 border border-slate-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-600">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full mt-1 p-3 border border-slate-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                                required
                            />
                        </div>

                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 bg-purple-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-600 transition disabled:bg-purple-300"
                        >
                            {loading ? 'Processing...' : (isLoginView ? 'Sign In' : 'Sign Up')}
                        </button>
                    </form>

                    <p className="text-center text-sm text-slate-500 mt-6">
                        {isLoginView ? "Don't have an account?" : "Already have an account?"}
                        <button onClick={() => { setIsLoginView(!isLoginView); setError(null); }} className="font-bold text-purple-500 hover:underline ml-1">
                             {isLoginView ? 'Sign Up' : 'Sign In'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};