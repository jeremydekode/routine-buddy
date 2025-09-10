import React, { useState } from 'react';
import { useAppContext, PASSWORD_KEY } from '../hooks/useAppContext';
import { PinSetupModal } from './PinSetupModal';

interface ProfileConfiguratorProps {
    childName: string;
    onChildNameChange: (name: string) => void;
    playtimeDuration: number;
    onPlaytimeDurationChange: (duration: number) => void;
}

export const ProfileConfigurator: React.FC<ProfileConfiguratorProps> = ({ childName, onChildNameChange, playtimeDuration, onPlaytimeDurationChange }) => {
    const { state, dispatch } = useAppContext();
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [isChangingPin, setIsChangingPin] = useState(false);

    const handleOpenSetPinModal = () => {
        setIsChangingPin(false);
        setIsPinModalOpen(true);
    };

    const handleOpenChangePinModal = () => {
        setIsChangingPin(true);
        setIsPinModalOpen(true);
    };
    
    const handleSavePin = (newPin: string) => {
        localStorage.setItem(PASSWORD_KEY, newPin);
        dispatch({ type: 'SET_PASSWORD_STATUS', payload: true });
        setIsPinModalOpen(false);
        alert(`PIN ${state.passwordIsSet ? 'changed' : 'set'} successfully!`);
    };


    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-700 mb-6">Profile & Settings</h2>

            <div className="space-y-6">
                {/* Child Profile Section */}
                <div>
                    <h3 className="text-lg font-semibold text-slate-600 mb-3">Child's Profile</h3>
                    <div className="bg-slate-50 p-4 rounded-xl">
                        <label htmlFor="childName" className="text-sm font-medium text-slate-600">Child's Name</label>
                        <input
                            id="childName"
                            type="text"
                            value={childName}
                            onChange={(e) => onChildNameChange(e.target.value)}
                            className="w-full mt-1 p-2 border border-slate-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                            placeholder="e.g., Buddy"
                        />
                         <p className="text-xs text-slate-400 mt-1">This name will be used in greetings.</p>
                    </div>
                </div>

                {/* Playtime Section */}
                <div>
                    <h3 className="text-lg font-semibold text-slate-600 mb-3">Playtime Settings</h3>
                    <div className="bg-slate-50 p-4 rounded-xl">
                        <label htmlFor="playtimeDuration" className="text-sm font-medium text-slate-600">Playtime Duration (minutes)</label>
                        <input
                            id="playtimeDuration"
                            type="number"
                            value={playtimeDuration === 0 ? '' : playtimeDuration}
                            onChange={(e) => onPlaytimeDurationChange(parseInt(e.target.value, 10) || 0)}
                            min="1"
                            className="w-full mt-1 p-2 border border-slate-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                            placeholder="e.g., 10"
                        />
                         <p className="text-xs text-slate-400 mt-1">Set how long the playtime timer should run after the Bedtime routine.</p>
                    </div>
                </div>

                {/* Security Section */}
                <div>
                    <h3 className="text-lg font-semibold text-slate-600 mb-3">Security</h3>
                     <div className="bg-slate-50 p-4 rounded-xl">
                        <p className="text-sm font-medium text-slate-700 mb-2">Parent Zone PIN</p>
                        <p className="text-xs text-slate-500 mb-3">
                            {state.passwordIsSet 
                                ? "A PIN is set to protect the Parent Zone." 
                                : "Set a PIN to prevent your child from accessing settings."}
                        </p>
                        <button
                            onClick={state.passwordIsSet ? handleOpenChangePinModal : handleOpenSetPinModal}
                            className="w-full sm:w-auto bg-purple-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-600 transition"
                        >
                            {state.passwordIsSet ? 'Change 4-Digit PIN' : 'Set 4-Digit PIN'}
                        </button>
                    </div>
                </div>
            </div>
            
            <PinSetupModal
                isOpen={isPinModalOpen}
                onClose={() => setIsPinModalOpen(false)}
                onSave={handleSavePin}
                isChanging={isChangingPin}
            />
        </div>
    );
};