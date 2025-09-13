
import * as React from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { RoutineView } from './RoutineView';
import { QuestView } from './QuestView';
import { PlaytimeView } from './PlaytimeView';
import { ThemedProgressBar } from './ThemedProgressBar';
import { CalendarView } from './CalendarView';
import { QUESTS_THEME, PLAYTIME_THEME, CHARACTER_QUESTS_THEME } from '../constants';
import { CalendarIcon, LockIcon } from './icons/Icons';
// FIX: Import Task and Theme for the new AvailableRoutine interface.
import { ActiveRoutineId, DAYS_OF_WEEK, AppState, Routine, Task, Theme } from '../types';

interface NavButtonProps {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    isActive: boolean;
    isLocked?: boolean;
    onLockedClick?: () => void;
    routineId: string;
}

const NavButton: React.FC<NavButtonProps> = ({ label, icon, onClick, isActive, isLocked, onLockedClick, routineId }) => {
    const handleClick = () => {
        if (isLocked) {
            onLockedClick?.();
        } else {
            onClick();
        }
    };
    
    return (
        <button
            onClick={handleClick}
            data-routine-id={routineId}
            className={`relative z-10 flex flex-col items-center justify-center gap-1 flex-1 p-2 rounded-2xl transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-white/80 ${
                isLocked ? 'cursor-not-allowed' : ''
            }`}
            aria-label={label}
        >
            <div className={`w-8 h-8 flex items-center justify-center transition-colors duration-300 ${isActive ? 'text-white' : (isLocked ? 'text-slate-400' : 'text-slate-500')}`}>
                {isLocked ? <LockIcon className="w-7 h-7" /> : icon}
            </div>
            <span className={`text-xs font-bold transition-colors duration-300 ${isActive ? 'text-white' : (isLocked ? 'text-slate-400' : 'text-slate-600')}`}>{label}</span>
        </button>
    );
};


export const ChildMode: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { routines, activeRoutine, selectedDate, childName, enablePlaytime, enableMorning, enableAfterSchool, enableBedtime, enableCharacterQuests } = state;
    const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
    const [showPlaytimeHint, setShowPlaytimeHint] = React.useState(false);
    
    const selectedRoutineData = activeRoutine in routines ? routines[activeRoutine as ActiveRoutineId] : null;

    const isToday = React.useMemo(() => {
        const today = new Date();
        const date = new Date(selectedDate.replace(/-/g, '/'));
        return date.getFullYear() === today.getFullYear() &&
               date.getMonth() === today.getMonth() &&
               date.getDate() === today.getDate();
    }, [selectedDate]);

    const selectedDay = React.useMemo(() => DAYS_OF_WEEK[new Date(selectedDate).getUTCDay()], [selectedDate]);

    const areAllDailyTasksComplete = React.useMemo(() => {
        // Playtime is a reward for today's tasks
        if (!isToday) return false;

        const enabledRoutines: ActiveRoutineId[] = [];
        if (enableMorning) enabledRoutines.push('Morning');
        if (enableAfterSchool) enabledRoutines.push('After-School');
        if (enableBedtime) enabledRoutines.push('Bedtime');

        if (enabledRoutines.length === 0) return true;

        const allTasksForDay = enabledRoutines.flatMap(routineId => 
            routines[routineId].tasks.filter(t => t.days.includes(selectedDay))
        );

        if (allTasksForDay.length === 0) return true;

        const completedTasks = state.taskHistory[selectedDate] || [];
        return allTasksForDay.every(task => completedTasks.includes(task.id));
    }, [routines, state.taskHistory, selectedDate, selectedDay, isToday, enableMorning, enableAfterSchool, enableBedtime]);


    const progress = React.useMemo(() => {
        if (!selectedRoutineData) return 0;

        const tasksForDay = selectedRoutineData.tasks.filter(t => t.days.includes(selectedDay));
        if (tasksForDay.length === 0) return 100;

        const completedTasks = (state.taskHistory[selectedDate] || []).filter(taskId =>
            tasksForDay.some(t => t.id === taskId)
        );
        
        return (completedTasks.length / tasksForDay.length) * 100;
    }, [selectedRoutineData, selectedDate, selectedDay, state.taskHistory]);

    const handleSetActiveRoutine = (routineId: AppState['activeRoutine']) => {
        dispatch({ type: 'SET_ACTIVE_ROUTINE', payload: routineId });
    };
    
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return `Good morning, ${childName}!`;
        if (hour < 18) return `Good afternoon, ${childName}!`;
        return `Good evening, ${childName}!`;
    };

    const dateDisplay = new Date(selectedDate.replace(/-/g, '/')).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

    // FIX: Redefine AvailableRoutine and use a type assertion to fix the type error.
    // This interface correctly represents both real routines and pseudo-routines like Quests.
    interface AvailableRoutine {
        id: string;
        name: string;
        tasks?: Task[];
        theme: Theme;
    }

    const availableRoutines = ([
        enableMorning && routines.Morning,
        enableAfterSchool && routines['After-School'],
        enableBedtime && routines.Bedtime,
        { id: 'Quests', ...QUESTS_THEME },
        enableCharacterQuests && { id: 'Character', ...CHARACTER_QUESTS_THEME },
        enablePlaytime && { id: 'Playtime', ...PLAYTIME_THEME },
    ].filter(Boolean) as AvailableRoutine[]);

    const getNavColor = (themeColor: string) => {
        return themeColor.replace('bg-', 'bg-').replace('-100', '-500').replace('-200', '-500');
    };
    
    const activeRoutineIndex = availableRoutines.findIndex(r => r.id === activeRoutine);
    const activeTheme = availableRoutines.find(r => r.id === activeRoutine)?.theme;

    const gliderStyle = {
        transform: `translateX(${activeRoutineIndex * 100}%)`,
        width: `calc(100% / ${availableRoutines.length})`,
        backgroundColor: activeTheme ? getNavColor(activeTheme.color).replace('bg-', '').split('-')[0] : 'purple',
    };
    
    const colorClassToHex: Record<string, string> = {
        'amber-500': '#f59e0b',
        'sky-500': '#0ea5e9',
        'indigo-500': '#6366f1',
        'purple-500': '#a855f7',
        'pink-500': '#ec4899',
        'teal-500': '#14b8a6',
    };

    const activeColorHex = activeTheme ? colorClassToHex[getNavColor(activeTheme.color).replace('bg-', '')] || '#a855f7' : '#a855f7';

    const handleLockedPlaytimeClick = () => {
        setShowPlaytimeHint(true);
        setTimeout(() => {
            setShowPlaytimeHint(false);
        }, 3000);
    };


    return (
        <div className="relative">
            <div className="pt-20 pb-28">
                <header className="relative flex justify-center items-center mb-6">
                    <div className="text-center">
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-800">{getGreeting()}</h1>
                        <p className="font-semibold text-slate-500 mt-2">{dateDisplay}</p>
                    </div>
                    <div className="absolute top-1/2 -translate-y-1/2 right-0 z-10">
                        <button onClick={() => setIsCalendarOpen(!isCalendarOpen)} className="p-3 rounded-full bg-white/70 backdrop-blur-sm shadow-md hover:bg-white transition-all">
                            <CalendarIcon className="w-6 h-6 text-purple-600" />
                        </button>
                        {isCalendarOpen && (
                            <div className="absolute top-full mt-2 right-0 z-30">
                                <CalendarView onClose={() => setIsCalendarOpen(false)} />
                            </div>
                        )}
                    </div>
                </header>

                <main>
                    {selectedRoutineData && (
                        <>
                            <ThemedProgressBar progress={progress} themeColorClass={selectedRoutineData.theme.color} />
                            <RoutineView routine={selectedRoutineData} selectedDate={selectedDate} />
                        </>
                    )}
                    {(activeRoutine === 'Quests' || activeRoutine === 'Character') && <QuestView />}
                    {activeRoutine === 'Playtime' && <PlaytimeView />}
                </main>
            </div>
            
            {showPlaytimeHint && (
                 <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-40 bg-slate-800 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg">
                    Finish today's routines to unlock playtime!
                </div>
            )}

            <footer className="fixed bottom-0 left-0 right-0 p-3 bg-transparent z-20">
                <div className="max-w-md md:max-w-3xl mx-auto relative flex justify-evenly bg-white/60 backdrop-blur-md rounded-2xl p-1.5 shadow-lg">
                    <div
                        className={`absolute top-1.5 bottom-1.5 left-0 rounded-xl transition-all duration-300 ease-in-out`}
                        style={{ ...gliderStyle, backgroundColor: activeColorHex }}
                    />
                    {availableRoutines.map((routine) => {
                        const isPlaytimeLocked = routine.id === 'Playtime' && !areAllDailyTasksComplete;
                        return (
                            <NavButton
                                key={routine.id}
                                routineId={routine.id}
                                label={routine.name.replace(' Routine', '')}
                                icon={routine.theme.icon}
                                isActive={activeRoutine === routine.id}
                                onClick={() => handleSetActiveRoutine(routine.id as any)}
                                isLocked={isPlaytimeLocked}
                                onLockedClick={handleLockedPlaytimeClick}
                            />
                        );
                    })}
                </div>
            </footer>
        </div>
    );
};