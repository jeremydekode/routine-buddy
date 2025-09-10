import React, { useMemo, useState, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { RoutineView } from './RoutineView';
import { QuestView } from './QuestView';
import { PlaytimeView } from './PlaytimeView';
import { Routine, DAYS_OF_WEEK } from '../types';
import { QUESTS_THEME, PLAYTIME_THEME } from '../constants';
// FIX: Import StarIcon component to resolve 'Cannot find name' error.
import { StarIcon } from './icons/Icons';
import { ThemedProgressBar } from './ThemedProgressBar';

let audioContext: AudioContext | null = null;
const getAudioContext = (): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (!audioContext) {
        try {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.error("Web Audio API is not supported in this browser");
            return null;
        }
    }
    return audioContext;
};

const playStarEarnedSound = () => {
    const context = getAudioContext();
    if (!context) return;

    if (context.state === 'suspended') {
        context.resume();
    }

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.type = 'triangle';
    gainNode.gain.setValueAtTime(0.4, context.currentTime);

    const now = context.currentTime;
    oscillator.frequency.setValueAtTime(523.25, now); // C5
    oscillator.frequency.setValueAtTime(659.25, now + 0.1); // E5
    oscillator.frequency.setValueAtTime(783.99, now + 0.2); // G5
    oscillator.frequency.setValueAtTime(1046.50, now + 0.3); // C6

    gainNode.gain.exponentialRampToValueAtTime(0.00001, now + 0.7);
    oscillator.start(now);
    oscillator.stop(now + 0.7);
};


const StarAnimation: React.FC = () => (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="text-center text-white animate-reward-bounce">
            <StarIcon className="w-32 h-32 text-yellow-400 animate-sparkle" />
            <p className="text-3xl font-bold mt-4">You earned a star!</p>
        </div>
    </div>
);

export const ChildMode: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { routines, activeRoutine, completedRoutinesToday, childName } = state;
    const [showStarAnimation, setShowStarAnimation] = useState(false);

    const currentDay = DAYS_OF_WEEK[new Date().getDay()];

    const availableRoutines = useMemo(() => {
        return Object.values(routines).filter(r => r.days.includes(currentDay));
    }, [routines, currentDay]);
    
    const isBedtimeComplete = useMemo(() => {
        const bedtimeRoutine = routines['Bedtime'];
        return bedtimeRoutine && bedtimeRoutine.tasks.length > 0 && bedtimeRoutine.tasks.every(t => t.completed);
    }, [routines]);

    useEffect(() => {
        const activeRoutineIsAvailable = availableRoutines.some(r => r.id === activeRoutine);
        if (!activeRoutineIsAvailable && activeRoutine !== 'Quests' && activeRoutine !== 'Playtime') {
            if (availableRoutines.length > 0) {
                dispatch({ type: 'SET_ACTIVE_ROUTINE', payload: availableRoutines[0].id });
            } else {
                dispatch({ type: 'SET_ACTIVE_ROUTINE', payload: 'Quests' });
            }
        }
        if (activeRoutine === 'Playtime' && !isBedtimeComplete) {
            dispatch({ type: 'SET_ACTIVE_ROUTINE', payload: 'Quests' });
        }
    }, [activeRoutine, availableRoutines, dispatch, isBedtimeComplete]);

    useEffect(() => {
        Object.values(routines).forEach(routine => {
            if (routine.tasks.length > 0 && routine.tasks.every(t => t.completed) && !completedRoutinesToday.includes(routine.id)) {
                playStarEarnedSound();
                dispatch({ type: 'AWARD_STAR_FOR_ROUTINE', payload: { routineId: routine.id } });
                setShowStarAnimation(true);
                setTimeout(() => setShowStarAnimation(false), 2000);
            }
        });
    }, [routines, completedRoutinesToday, dispatch]);
    
    const currentRoutine = activeRoutine !== 'Quests' && activeRoutine !== 'Playtime' ? routines[activeRoutine] : undefined;
    
    const { progress } = useMemo(() => {
        if (!currentRoutine) return { progress: 0 };
        const completed = currentRoutine.tasks.filter(task => task.completed).length;
        const total = currentRoutine.tasks.length;
        const progressPercentage = total > 0 ? (completed / total) * 100 : 0;
        return { progress: progressPercentage };
    }, [currentRoutine]);

    const displayTheme = useMemo(() => {
        if (activeRoutine === 'Quests') return QUESTS_THEME;
        if (activeRoutine === 'Playtime') return PLAYTIME_THEME;
        return currentRoutine ? currentRoutine : QUESTS_THEME;
    }, [activeRoutine, currentRoutine]);
    
    const getDisplayName = () => {
        if (displayTheme.id === 'Quests') return 'Quests';
        if (displayTheme.id === 'Playtime') return 'Playtime!';
        const routineName = displayTheme.name.replace(' Routine', '');
        return `${childName}'s ${routineName}`;
    };

    const renderContent = () => {
        switch (activeRoutine) {
            case 'Quests':
                return <QuestView />;
            case 'Playtime':
                return <PlaytimeView />;
            default:
                return currentRoutine ? <RoutineView key={currentRoutine.id} routine={currentRoutine} /> : <QuestView />;
        }
    };

    return (
        <div className="pt-16 pb-24">
             <style>
                {`
                .animate-reward-bounce {
                    animation: reward-bounce 1s ease-in-out;
                }
                @keyframes reward-bounce {
                    0%, 100% {
                        transform: translateY(-15%) scale(1);
                    }
                    50% {
                        transform: translateY(0) scale(1.1);
                    }
                }
                .shadow-t-lg {
                    box-shadow: 0 -4px 6px -1px rgb(0 0 0 / 0.1), 0 -2px 4px -2px rgb(0 0 0 / 0.1);
                }
                @keyframes burst {
                    0% {
                        transform: translate(0, 0) rotate(0deg) scale(0.5);
                        opacity: 1;
                        background-color: var(--bg-color);
                    }
                    100% {
                        transform:
                            rotate(var(--angle))
                            translateX(var(--distance))
                            rotate(calc(-1 * var(--angle)))
                            scale(0);
                        opacity: 0;
                        background-color: var(--bg-color);
                    }
                }
                @keyframes sparkle {
                    0%, 100% { transform: scale(1); filter: brightness(1.2); }
                    50% { transform: scale(1.2); filter: brightness(1.8); }
                }
                .animate-sparkle {
                    animation: sparkle 0.8s ease-in-out infinite;
                }
                `}
            </style>
            {showStarAnimation && <StarAnimation />}

            <div className="text-center mb-6">
                <div className="inline-block p-4 bg-white/50 rounded-full shadow-lg">
                    {displayTheme.theme.icon}
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-slate-700 mt-4">{getDisplayName()}</h1>
                <p className="text-slate-500">
                    {activeRoutine === 'Quests' ? 'Check your awesome progress!' : activeRoutine === 'Playtime' ? 'Time for some fun!' : "Let's get started!"}
                </p>
            </div>
            
            {currentRoutine && (
                 <ThemedProgressBar progress={progress} themeColorClass={currentRoutine.theme.color} />
            )}
           
            {renderContent()}
           
            <nav className="fixed bottom-0 left-0 right-0 max-w-md md:max-w-3xl mx-auto p-2 bg-white/80 backdrop-blur-sm shadow-t-lg rounded-t-2xl">
                <div className="flex justify-around">
                    {[...availableRoutines, QUESTS_THEME, ...(isBedtimeComplete ? [PLAYTIME_THEME] : [])].map((item) => {
                        const routine = item as Routine | typeof QUESTS_THEME;
                        const isActive = activeRoutine === routine.id;
                        return (
                             <button 
                                key={routine.id}
                                onClick={() => dispatch({ type: 'SET_ACTIVE_ROUTINE', payload: routine.id })}
                                className={`flex flex-col items-center justify-center w-20 h-20 rounded-xl transition-all ${isActive ? 'bg-purple-500 text-white scale-105 shadow-lg' : 'text-slate-500'}`}
                            >
                                <div className="w-8 h-8">
                                    {routine.theme.icon}
                                </div>
                                <span className="text-xs font-bold mt-1">{routine.name.split(' ')[0]}</span>
                            </button>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
};