
import * as React from 'react';
import { PASSWORD_KEY } from '../hooks/useAppContext';

interface PinSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (newPin: string) => void;
    isChanging: boolean;
}

export const PinSetupModal: React.FC<PinSetupModalProps> = ({ isOpen, onClose, onSave, isChanging }) => {
    const [currentPin, setCurrentPin] = React.useState('');
    const [newPin, setNewPin] = React.useState('');
    const [confirmPin, setConfirmPin] = React.useState('');
    const [error, setError] = React.useState('');

    React.useEffect(() => {
        if (isOpen) {
            // Reset state when modal opens
            setCurrentPin('');
            setNewPin('');
            setConfirmPin('');
            setError('');
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (isChanging) {
            const storedPin = localStorage.getItem(PASSWORD_KEY);
            if (currentPin !== storedPin) {
                setError('Incorrect current PIN.');
                return;
            }
        }

        if (!/^\d{4}$/.test(newPin)) {
            setError('New PIN must be exactly 4 digits.');
            return;
        }

        if (newPin !== confirmPin) {
            setError('New PINs do not match.');
            return;
        }

        onSave(newPin);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
                <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">{isChanging ? 'Change PIN' : 'Set PIN'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {isChanging && (
                        <div>
                            <label className="text-sm font-medium text-slate-600">Current PIN</label>
                            <input
                                type="password"
                                value={currentPin}
                                onChange={(e) => /^\d{0,4}$/.test(e.target.value) && setCurrentPin(e.target.value)}
                                maxLength={4}
                                autoFocus
                                className="w-full mt-1 p-2 border border-slate-300 rounded-lg text-center tracking-[0.5em]"
                            />
                        </div>
                    )}
                    <div>
                        <label className="text-sm font-medium text-slate-600">New 4-Digit PIN</label>
                        <input
                            type="password"
                            value={newPin}
                            onChange={(e) => /^\d{0,4}$/.test(e.target.value) && setNewPin(e.target.value)}
                            maxLength={4}
                            autoFocus={!isChanging}
                            className="w-full mt-1 p-2 border border-slate-300 rounded-lg text-center tracking-[0.5em]"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-600">Confirm New PIN</label>
                        <input
                            type="password"
                            value={confirmPin}
                            onChange={(e) => /^\d{0,4}$/.test(e.target.value) && setConfirmPin(e.target.value)}
                            maxLength={4}
                            className="w-full mt-1 p-2 border border-slate-300 rounded-lg text-center tracking-[0.5em]"
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm text-center pt-2">{error}</p>}
                    <div className="pt-4 flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="font-bold text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-200 transition">
                            Cancel
                        </button>
                        <button type="submit" className="font-bold text-white bg-purple-500 px-4 py-2 rounded-lg hover:bg-purple-600 transition shadow-md">
                            Save PIN
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};