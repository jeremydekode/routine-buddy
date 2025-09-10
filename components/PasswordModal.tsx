import React, { useState } from 'react';
import { useAppContext, PASSWORD_KEY } from '../hooks/useAppContext';

export const PasswordModal: React.FC = () => {
    const { dispatch } = useAppContext();
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const storedPassword = localStorage.getItem(PASSWORD_KEY);
        if (pin === storedPassword) {
            setError('');
            dispatch({ type: 'TOGGLE_MODE' });
            dispatch({ type: 'HIDE_PASSWORD_MODAL' });
        } else {
            setError('Incorrect PIN. Please try again.');
            setPin('');
        }
    };

    const handleClose = () => {
        dispatch({ type: 'HIDE_PASSWORD_MODAL' });
        setError('');
        setPin('');
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-sm text-center">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Enter PIN</h2>
                <p className="text-slate-500 mb-6">Please enter your 4-digit PIN to access the Parent Zone.</p>
                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        value={pin}
                        onChange={(e) => {
                            if (/^\d{0,4}$/.test(e.target.value)) {
                                setPin(e.target.value);
                                setError('');
                            }
                        }}
                        maxLength={4}
                        autoFocus
                        className="w-full text-center text-3xl tracking-[1em] p-3 border-2 border-slate-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                        placeholder="----"
                    />
                    {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
                    <button
                        type="submit"
                        disabled={pin.length !== 4}
                        className="w-full mt-6 bg-purple-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-600 transition disabled:bg-slate-300"
                    >
                        Unlock
                    </button>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="w-full mt-3 bg-transparent text-slate-500 font-bold py-2 px-4 rounded-lg hover:bg-slate-100 transition"
                    >
                        Cancel
                    </button>
                </form>
            </div>
        </div>
    );
};