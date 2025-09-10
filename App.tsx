import React from 'react';
import { ParentMode } from './components/ParentMode';
import { ChildMode } from './components/ChildMode';
import { useAppContext } from './hooks/useAppContext';
import { Mode } from './types';
import { PasswordModal } from './components/PasswordModal';
import { PASSWORD_KEY } from './hooks/useAppContext';

const App: React.FC = () => {
    const { state, dispatch } = useAppContext();

    const handleToggleMode = () => {
        if (state.mode === Mode.Parent) {
            dispatch({ type: 'TOGGLE_MODE' });
        } else {
            // Check if password exists before switching to Parent mode
            const password = localStorage.getItem(PASSWORD_KEY);
            if (password) {
                dispatch({ type: 'SHOW_PASSWORD_MODAL' });
            } else {
                dispatch({ type: 'TOGGLE_MODE' }); // No password set, allow access
            }
        }
    };

    const getBackgroundColor = () => {
        if (state.mode === Mode.Child) {
            // Check if activeRoutine is a valid routine ID before accessing theme
            if (state.activeRoutine !== 'Quests' && state.routines[state.activeRoutine]) {
                return state.routines[state.activeRoutine].theme.color;
            } else if (state.activeRoutine === 'Quests') {
                return 'bg-purple-100';
            }
            return 'bg-gray-100'; // Fallback
        }
        return 'bg-slate-100';
    };

    return (
        <div className={`min-h-screen font-sans transition-colors duration-500 ${getBackgroundColor()}`}>
            <div className="max-w-md md:max-w-3xl mx-auto p-4 md:p-8 relative">
                <button
                    onClick={handleToggleMode}
                    className="absolute top-4 right-4 md:top-8 md:right-8 z-20 bg-white/70 backdrop-blur-sm rounded-full p-3 shadow-md hover:bg-white transition-all focus:outline-none focus:ring-2 focus:ring-purple-500"
                    aria-label={state.mode === Mode.Child ? "Switch to Parent Mode" : "Back to Child Mode"}
                >
                    {state.mode === Mode.Child ? (
                        <i className="fa-solid fa-user-tie text-slate-600 w-6 h-6"></i>
                    ) : (
                        <i className="fa-solid fa-arrow-left text-slate-600 w-6 h-6"></i>
                    )}
                </button>

                {state.mode === Mode.Child ? <ChildMode /> : <ParentMode />}
            </div>
            {state.showPasswordModal && <PasswordModal />}
        </div>
    );
};

export default App;