import React, { useMemo, useState, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { RoutineView } from './RoutineView';
import { QuestView } from './QuestView';
import { PlaytimeView } from './PlaytimeView';
import { Routine, DAYS_OF_WEEK, ActiveViewId, ActiveRoutineId } from '../types';
import { QUESTS_THEME, PLAYTIME_THEME } from '../constants';
import { StarIcon, ChevronLeftIcon, ChevronRightIcon } from './icons/Icons';
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
    const { 
        routines, 
        activeRoutine, 
        completedRoutinesToday, 
        childName, 
        enablePlaytime,
        enableMorning,
        enableAfterSchool,
        enableBedtime 
    } = state;
    const [showStarAnimation, setShowStarAnimation] = useState(false);

    const isRoutineComplete = (routine: Routine): boolean => {
        return routine.tasks.length > 0 && routine.tasks.every(t => t.completed);
    };

    const orderedEnabledRoutines = useMemo(() => {
        const order: ActiveRoutineId[] = ['Morning', 'After-School', 'Bedtime'];
        return order
            .filter(id => 
                (id === 'Morning' && enableMorning) ||
                (id === 'After-School' && enableAfterSchool) ||
                (id === 'Bedtime' && enableBedtime)
            )
            .map(id => routines[id]);
    }, [routines, enableMorning, enableAfterSchool, enableBedtime]);
    
    // Set initial routine on load
    useEffect(() => {
        const today = DAYS_OF_WEEK[new Date().getDay()];
        const firstIncompleteRoutine = orderedEnabledRoutines.find(routine => 
            routine.days.includes(today) && !isRoutineComplete(routine)
        );
        const initialRoutineId = firstIncompleteRoutine ? firstIncompleteRoutine.id : (orderedEnabledRoutines[0]?.id || 'Quests');
        dispatch({ type: 'SET_ACTIVE_ROUTINE', payload: initialRoutineId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enableMorning, enableAfterSchool, enableBedtime]); // Run only when enabled routines change


    const isBedtimeComplete = useMemo(() => {
        const bedtimeRoutine = routines['Bedtime'];
        return bedtimeRoutine && isRoutineComplete(bedtimeRoutine);
    }, [routines]);

    useEffect(() => {
        Object.values(routines).forEach(routine => {
            if (isRoutineComplete(routine) && !completedRoutinesToday.includes(routine.id)) {
                playStarEarnedSound();
                dispatch({ type: 'AWARD_STAR_FOR_ROUTINE', payload: { routineId: routine.id } });
                setShowStarAnimation(true);
                setTimeout(() => setShowStarAnimation(false), 2000);
            }
        });
    }, [routines, completedRoutinesToday, dispatch]);
    
    const currentRoutineForDisplay = activeRoutine !== 'Quests' && activeRoutine !== 'Playtime' ? routines[activeRoutine] : undefined;
    
    const { progress } = useMemo(() => {
        if (!currentRoutineForDisplay) return { progress: 0 };
        const completed = currentRoutineForDisplay.tasks.filter(task => task.completed).length;
        const total = currentRoutineForDisplay.tasks.length;
        const progressPercentage = total > 0 ? (completed / total) * 100 : 0;
        return { progress: progressPercentage };
    }, [currentRoutineForDisplay]);

    const displayTheme = useMemo(() => {
        if (activeRoutine === 'Quests') return QUESTS_THEME;
        if (activeRoutine === 'Playtime') return PLAYTIME_THEME;
        return currentRoutineForDisplay ? currentRoutineForDisplay : QUESTS_THEME;
    }, [activeRoutine, currentRoutineForDisplay]);
    
    const getDisplayName = () => {
        if (!displayTheme) return '';
        if (displayTheme.id === 'Quests') return 'Quests';
        if (displayTheme.id === 'Playtime') return 'Playtime!';
        if ('name' in displayTheme) {
            const routineName = displayTheme.name.replace(' Routine', '');
            return `${childName}'s ${routineName}`;
        }
        return "Let's Go!";
    };
    
    const activeRoutineIndex = useMemo(() => 
        orderedEnabledRoutines.findIndex(r => r.id === activeRoutine),
    [orderedEnabledRoutines, activeRoutine]);

    const canGoBack = activeRoutineIndex > 0;
    const canGoNext = activeRoutineIndex !== -1 && activeRoutineIndex < orderedEnabledRoutines.length - 1;
    
    const handleBack = () => {
        if (canGoBack) {
            dispatch({ type: 'SET_ACTIVE_ROUTINE', payload: orderedEnabledRoutines[activeRoutineIndex - 1].id });
        }
    };
    const handleNext = () => {
        if (canGoNext) {
            dispatch({ type: 'SET_ACTIVE_ROUTINE', payload: orderedEnabledRoutines[activeRoutineIndex + 1].id });
        }
    };

    const renderContent = () => {
        switch (activeRoutine) {
            case 'Quests':
                return <QuestView />;
            case 'Playtime':
                return <PlaytimeView />;
            default:
                return currentRoutineForDisplay ? <RoutineView key={currentRoutineForDisplay.id} routine={currentRoutineForDisplay} /> : <QuestView />;
        }
    };
    
    const navItems = useMemo(() => {
        const items: (Routine | typeof QUESTS_THEME | typeof PLAYTIME_THEME)[] = [...orderedEnabledRoutines];
        items.push(QUESTS_THEME);
        if (isBedtimeComplete && enablePlaytime) {
            items.push(PLAYTIME_THEME);
        }
        return items;
    }, [orderedEnabledRoutines, isBedtimeComplete, enablePlaytime]);

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
                    {displayTheme?.theme.icon}
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-slate-700 mt-4">{getDisplayName()}</h1>
                 <p className="text-slate-500">
                    {activeRoutine === 'Quests' 
                        ? "Check your awesome progress!"
                        : activeRoutine === 'Playtime' 
                            ? 'Time for some fun!' 
                            : "Let's get started!"}
                </p>
            </div>
            
            {currentRoutineForDisplay && (
                 <ThemedProgressBar progress={progress} themeColorClass={currentRoutineForDisplay.theme.color} />
            )}

            <div className="flex items-center justify-between my-4">
                <button
                    onClick={handleBack}
                    disabled={!canGoBack}
                    className="flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full p-3 shadow-md hover:bg-white transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <ChevronLeftIcon className="w-6 h-6 text-slate-600" />
                </button>
                 <button
                    onClick={handleNext}
                    disabled={!canGoNext}
                    className="flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full p-3 shadow-md hover:bg-white transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <ChevronRightIcon className="w-6 h-6 text-slate-600" />
                </button>
            </div>
           
            {renderContent()}
           
            <nav className="fixed bottom-0 left-0 right-0 max-w-md md:max-w-3xl mx-auto p-2 bg-white/80 backdrop-blur-sm shadow-t-lg rounded-t-2xl">
                <div className="flex justify-around">
                     {navItems.map((item) => {
                        const routine = item as Routine | typeof QUESTS_THEME;
                        const isActive = activeRoutine === routine.id;
                        return (
                             <button 
                                key={routine.id}
                                onClick={() => dispatch({ type: 'SET_ACTIVE_ROUTINE', payload: routine.id as ActiveViewId })}
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
