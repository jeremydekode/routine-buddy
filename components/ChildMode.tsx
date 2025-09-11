import * as React from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { RoutineView } from './RoutineView';
import { QuestView } from './QuestView';
import { PlaytimeView } from './PlaytimeView';
import { ThemedProgressBar } from './ThemedProgressBar';
import { CalendarView } from './CalendarView';
import { QUESTS_THEME, PLAYTIME_THEME, CHARACTER_QUESTS_THEME } from '../constants';
import { CalendarIcon } from './icons/Icons';
import { ActiveRoutineId, DAYS_OF_WEEK, AppState } from '../types';

interface NavButtonProps {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    isActive: boolean;
    color: string;
}

const NavButton: React.FC<NavButtonProps> = ({ label, icon, onClick, isActive, color }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center gap-1 flex-1 p-2 rounded-2xl transition-all duration-300 transform ${
            isActive ? `${color} text-white shadow-lg scale-105` : 'bg-white/50 hover:bg-white/80'
        }`}
    >
        <div className={`w-8 h-8 flex items-center justify-center ${isActive ? '' : 'text-slate-500'}`}>{icon}</div>
        <span className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-600'}`}>{label}</span>
    </button>
);


export const ChildMode: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { routines, activeRoutine, selectedDate, childName, enablePlaytime, enableMorning, enableAfterSchool, enableBedtime, enableCharacterQuests } = state;
    const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
    
    const selectedRoutineData = activeRoutine in routines ? routines[activeRoutine as ActiveRoutineId] : null;

    const selectedDay = React.useMemo(() => DAYS_OF_WEEK[new Date(selectedDate).getUTCDay()], [selectedDate]);

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

    const isToday = new Date().toISOString().split('T')[0] === selectedDate;
    const dateDisplay = isToday
        ? "Today"
        : new Date(selectedDate.replace(/-/g, '/')).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

    const availableRoutines = [
        enableMorning && { id: 'Morning', ...routines.Morning },
        enableAfterSchool && { id: 'After-School', ...routines['After-School'] },
        enableBedtime && { id: 'Bedtime', ...routines.Bedtime },
        { id: 'Quests', ...QUESTS_THEME },
        enableCharacterQuests && { id: 'Character', ...CHARACTER_QUESTS_THEME },
        enablePlaytime && { id: 'Playtime', ...PLAYTIME_THEME },
    ].filter(Boolean);

    const getNavColor = (themeColor: string) => {
        return themeColor.replace('bg-', 'bg-').replace('-100', '-500').replace('-200', '-500');
    }

    return (
        <div className="pt-20 pb-28">
            <header className="text-center mb-6 relative">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-800">{getGreeting()}</h1>
                <div className="flex items-center justify-center gap-2 mt-2">
                    <p className="font-semibold text-slate-500">{dateDisplay}</p>
                    <button onClick={() => setIsCalendarOpen(!isCalendarOpen)} className="p-1.5 rounded-full bg-white/60 hover:bg-white transition-colors">
                        <CalendarIcon className="w-5 h-5 text-purple-600" />
                    </button>
                </div>
                 {isCalendarOpen && (
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-30">
                        <CalendarView onClose={() => setIsCalendarOpen(false)} />
                    </div>
                )}
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

            <footer className="fixed bottom-0 left-0 right-0 p-3 bg-white/50 backdrop-blur-md z-20">
                <div className="max-w-md md:max-w-3xl mx-auto flex gap-2 justify-evenly">
                    {availableRoutines.map((routine) => (
                        <NavButton
                            key={routine!.id}
                            label={routine!.name.replace(' Routine', '')}
                            icon={routine!.theme.icon}
                            isActive={activeRoutine === routine!.id}
                            onClick={() => handleSetActiveRoutine(routine!.id as any)}
                            color={getNavColor(routine!.theme.color)}
                        />
                    ))}
                </div>
            </footer>
        </div>
    );
};
