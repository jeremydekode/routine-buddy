import React, { useMemo, useState, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { RoutineView } from './RoutineView';
import { QuestView } from './QuestView';
import { PlaytimeView } from './PlaytimeView';
import { CharacterQuestView } from './CharacterQuestView';
import { CalendarView } from './CalendarView';
import { Routine, DAYS_OF_WEEK, ActiveViewId, ActiveRoutineId, Task, Day } from '../types';
import { QUESTS_THEME, PLAYTIME_THEME, CHARACTER_QUESTS_THEME } from '../constants';
import { StarIcon, CalendarIcon } from './icons/Icons';
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
        selectedDate, 
        taskHistory,
        completedRoutinesToday, 
        childName, 
        enablePlaytime,
        enableMorning,
        enableAfterSchool,
        enableBedtime,
        enableCharacterQuests
    } = state;
    const [showStarAnimation, setShowStarAnimation] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    
    const selectedDay = useMemo(() => DAYS_OF_WEEK[new Date(selectedDate).getUTCDay()], [selectedDate]);
    
    const tasksForDay = (tasks: Task[], day: Day): Task[] => {
        return tasks.filter(task => task.days.includes(day));
    };

    const isRoutineCompleteOnDate = (routine: Routine, date: string): boolean => {
        const dayOfWeek = DAYS_OF_WEEK[new Date(date).getUTCDay()];
        const todaysTasks = tasksForDay(routine.tasks, dayOfWeek);
        if (todaysTasks.length === 0) return true; // No tasks means complete
        const completedTasksOnDate = taskHistory[date] || [];
        return todaysTasks.every(t => completedTasksOnDate.includes(t.id));
    };

    const routinesForSelectedDay = useMemo(() => {
        const order: ActiveRoutineId[] = ['Morning', 'After-School', 'Bedtime'];
        return order
            .filter(id => 
                ((id === 'Morning' && enableMorning) ||
                (id === 'After-School' && enableAfterSchool) ||
                (id === 'Bedtime' && enableBedtime)) &&
                tasksForDay(routines[id].tasks, selectedDay).length > 0
            )
            .map(id => routines[id]);
    }, [routines, enableMorning, enableAfterSchool, enableBedtime, selectedDay]);
    
    useEffect(() => {
        const isValidRoutineForDay = routinesForSelectedDay.some(r => r.id === activeRoutine);
        let isSpecialView = ['Quests', 'Playtime'].includes(activeRoutine);
        if (enableCharacterQuests) {
            isSpecialView = isSpecialView || activeRoutine === 'Character';
        }
    
        if (!isValidRoutineForDay && !isSpecialView) {
            if (routinesForSelectedDay.length > 0) {
                dispatch({ type: 'SET_ACTIVE_ROUTINE', payload: routinesForSelectedDay[0].id });
            } else {
                dispatch({ type: 'SET_ACTIVE_ROUTINE', payload: 'Quests' });
            }
        }
    }, [routinesForSelectedDay, activeRoutine, dispatch, enableCharacterQuests]);

    const isBedtimeCompleteToday = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const bedtimeRoutine = routines['Bedtime'];
        return bedtimeRoutine && isRoutineCompleteOnDate(bedtimeRoutine, today);
    }, [routines, taskHistory]);

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        Object.values(routines).forEach(routine => {
            if (isRoutineCompleteOnDate(routine, today) && !completedRoutinesToday.includes(routine.id)) {
                playStarEarnedSound();
                dispatch({ type: 'AWARD_STAR_FOR_ROUTINE', payload: { routineId: routine.id } });
                setShowStarAnimation(true);
                setTimeout(() => setShowStarAnimation(false), 2000);
            }
        });
    }, [routines, taskHistory, completedRoutinesToday, dispatch]);
    
    const currentRoutineForDisplay = !['Quests', 'Playtime', 'Character'].includes(activeRoutine) ? routines[activeRoutine as ActiveRoutineId] : undefined;
    
    const progress = useMemo(() => {
        if (!currentRoutineForDisplay) return 0;
        const routineTasksForDay = tasksForDay(currentRoutineForDisplay.tasks, selectedDay);
        if (routineTasksForDay.length === 0) return 0;
        const completedTasksOnDate = taskHistory[selectedDate] || [];
        const completedCount = routineTasksForDay.filter(t => completedTasksOnDate.includes(t.id)).length;
        return (completedCount / routineTasksForDay.length) * 100;
    }, [currentRoutineForDisplay, selectedDay, selectedDate, taskHistory]);
    
    const renderContent = () => {
        switch (activeRoutine) {
            case 'Quests':
                return <QuestView />;
            case 'Playtime':
                return <PlaytimeView />;
            case 'Character':
                return <CharacterQuestView />;
            default:
                return currentRoutineForDisplay ? <RoutineView key={currentRoutineForDisplay.id} routine={currentRoutineForDisplay} selectedDate={selectedDate} /> : <QuestView />;
        }
    };
    
    const navItems = useMemo(() => {
        const items: (Routine | typeof QUESTS_THEME | typeof PLAYTIME_THEME | typeof CHARACTER_QUESTS_THEME)[] = [...routinesForSelectedDay];
        items.push(QUESTS_THEME);
        if (enableCharacterQuests) {
            items.push(CHARACTER_QUESTS_THEME);
        }
        if (isBedtimeCompleteToday && enablePlaytime) {
            items.push(PLAYTIME_THEME);
        }
        return items;
    }, [routinesForSelectedDay, isBedtimeCompleteToday, enablePlaytime, enableCharacterQuests]);

    return (
        <div className="relative pt-4 pb-24">
             <style>
                {`
                .animate-reward-bounce { animation: reward-bounce 1s ease-in-out; }
                @keyframes reward-bounce { 0%, 100% { transform: translateY(-15%) scale(1); } 50% { transform: translateY(0) scale(1.1); } }
                .shadow-t-lg { box-shadow: 0 -4px 6px -1px rgb(0 0 0 / 0.1), 0 -2px 4px -2px rgb(0 0 0 / 0.1); }
                @keyframes sparkle { 0%, 100% { transform: scale(1); filter: brightness(1.2); } 50% { transform: scale(1.2); filter: brightness(1.8); } }
                .animate-sparkle { animation: sparkle 0.8s ease-in-out infinite; }
                `}
            </style>
            {showStarAnimation && <StarAnimation />}

            <button
                onClick={() => setIsCalendarOpen(true)}
                className="absolute top-4 left-4 z-20 bg-white/70 backdrop-blur-sm rounded-full p-3 shadow-md hover:bg-white transition-all focus:outline-none focus:ring-2 focus:ring-purple-500"
                aria-label="Open calendar"
            >
                <CalendarIcon className="w-6 h-6 text-slate-600" />
            </button>
            
            <header className="text-center mb-6 pt-16">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Hi, {childName}!</h1>
                <p className="text-slate-500 font-semibold">{new Date(selectedDate.replace(/-/g, '/')).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </header>

            {isCalendarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setIsCalendarOpen(false)}
                >
                    <div onClick={(e) => e.stopPropagation()}>
                        <CalendarView onClose={() => setIsCalendarOpen(false)} />
                    </div>
                </div>
            )}

            {currentRoutineForDisplay && (
                 <ThemedProgressBar progress={progress} themeColorClass={currentRoutineForDisplay.theme.color} />
            )}
           
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