import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (loading) return <div className="p-6 text-center">Loading…</div>;

  if (!session) {
    const signInEmail = async () => {
      const email = prompt('Enter your email for a magic link:');
      if (email) {
        await supabase.auth.signInWithOtp({ email });
        alert('Check your email for the login link.');
      }
    };
    const signInGoogle = async () => {
      await supabase.auth.signInWithOAuth({ provider: 'google' });
    };

    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-2">Routine Buddy</h1>
        <p className="text-slate-600 mb-4">Sign in to sync across devices.</p>
        <div className="flex flex-col gap-2">
          <button onClick={signInEmail} className="bg-purple-600 text-white py-2 rounded-lg">
            Sign in with Email
          </button>
          <button onClick={signInGoogle} className="bg-slate-200 py-2 rounded-lg">
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
