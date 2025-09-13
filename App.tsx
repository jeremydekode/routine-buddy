
import * as React from 'react';
import { ParentMode } from './components/ParentMode';
import { ChildMode } from './components/ChildMode';
import { useAppContext } from './hooks/useAppContext';
import { Mode, ActiveRoutineId } from './types';
// FIX: Import CHARACTER_QUESTS_THEME to use for background color
import { QUESTS_THEME, PLAYTIME_THEME, CHARACTER_QUESTS_THEME } from './constants';
import { Auth } from './components/Auth';
import { OnboardingTutorial } from './components/OnboardingTutorial';

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center h-screen bg-slate-100">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500"></div>
    </div>
);


const App: React.FC = () => {
    const { state, dispatch } = useAppContext();

    const handleToggleMode = () => {
        dispatch({ type: 'TOGGLE_MODE' });
    };

    const getBackgroundColor = () => {
        if (state.mode === Mode.Child) {
            if (state.activeRoutine === 'Quests') {
                return QUESTS_THEME.theme.color;
            }
            if (state.activeRoutine === 'Playtime') {
                return PLAYTIME_THEME.theme.color;
            }
            // FIX: Add a case for the 'Character' routine to set the correct background color.
            if (state.activeRoutine === 'Character') {
                return CHARACTER_QUESTS_THEME.theme.color;
            }
            // Check if activeRoutine is a routine ID and safely access its properties
            if (state.activeRoutine in state.routines) {
                const routineId = state.activeRoutine as ActiveRoutineId;
                const routine = state.routines[routineId];
                // Safely access theme and color to prevent crashes on invalid state
                if (routine && routine.theme) {
                    return routine.theme.color;
                }
            }
            // Fallback for invalid routines or routines without themes
            return 'bg-gray-100';
        }
        return 'bg-slate-100';
    };

    if (state.isLoading) {
        return <LoadingSpinner />;
    }
    
    if (!state.isLoggedIn) {
        return <Auth />;
    }

    return (
        <div className={`min-h-screen font-sans transition-colors duration-500 ${getBackgroundColor()}`}>
            {state.showOnboarding && <OnboardingTutorial />}
            <div className="max-w-md md:max-w-3xl mx-auto p-4 md:p-8 relative">
                <button
                    onClick={handleToggleMode}
                    className="absolute top-4 left-4 md:top-8 md:left-8 z-20 bg-white/70 backdrop-blur-sm rounded-full p-3 shadow-md hover:bg-white transition-all focus:outline-none focus:ring-2 focus:ring-purple-500"
                    aria-label={state.mode === Mode.Child ? "Switch to Parent Mode" : "Exit Parent Zone"}
                >
                    {state.mode === Mode.Child ? (
                        <i className="fa-solid fa-user-tie text-slate-600 w-6 h-6"></i>
                    ) : (
                        <i className="fa-solid fa-arrow-left text-slate-600 w-6 h-6"></i>
                    )}
                </button>

                {state.mode === Mode.Child ? <ChildMode /> : <ParentMode />}
            </div>
        </div>
    );
};

export default App;