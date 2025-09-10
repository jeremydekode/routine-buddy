import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { RoutineView } from './RoutineView';
import { QuestView } from './QuestView';
import { PlaytimeView } from './PlaytimeView';
import { ActiveView, ActiveRoutineId, Task, Day, DAYS_OF_WEEK } from '../types';
import { QUESTS_THEME, PLAYTIME_THEME } from '../constants';
import { CalendarIcon } from './icons/Icons';
import { CalendarView } from './CalendarView';
import { ThemedProgressBar } from './ThemedProgressBar';

interface NavItemProps {
    id: ActiveView;
    name: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: (id: ActiveView) => void;
}

const NavItem = React.forwardRef<HTMLButtonElement, NavItemProps>(
    ({ id, name, icon, isActive, onClick }, ref) => (
    <button
        ref={ref}
        onClick={() => onClick(id)}
        className="relative z-10 flex flex-col items-center justify-center gap-1.5 flex-1 p-2 rounded-xl transition-colors duration-300"
        aria-current={isActive ? 'page' : undefined}
    >
        <div className="w-10 h-10 flex items-center justify-center text-2xl">{icon}</div>
        <span className={`text-xs font-bold transition-colors duration-300 ${isActive ? 'text-slate-800' : 'text-slate-500'}`}>{name}</span>
    </button>
));

export const ChildMode: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { activeRoutine, routines, selectedDate, taskHistory, enableMorning, enableAfterSchool, enableBedtime, enablePlaytime, childName } = state;
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const navRef = useRef<HTMLElement>(null);
    const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
    const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, opacity: 0 });
    
    const today = useMemo(() => new Date().toISOString().split('T')[0], []);

    const selectedRoutine = (routines as Record<ActiveRoutineId, any>)[activeRoutine as ActiveRoutineId];
    
    const isBedtimeComplete = useMemo(() => {
        if (!enableBedtime) return false;
        
        const bedtimeRoutine = routines['Bedtime'];
        const todayDayOfWeek = new Date(today.replace(/-/g, '/')).getUTCDay();
        const todayDayName: Day = DAYS_OF_WEEK[todayDayOfWeek];

        const bedtimeTasksForToday = bedtimeRoutine.tasks.filter(task => task.days.includes(todayDayName));
        
        if (bedtimeTasksForToday.length === 0) {
            return false;
        }

        const completedTasksForToday = taskHistory[today] || [];
        return bedtimeTasksForToday.every(task => completedTasksForToday.includes(task.id));
    }, [routines, taskHistory, today, enableBedtime]);
    
    const progress = React.useMemo(() => {
        if (!selectedRoutine || !selectedRoutine.tasks) return 0;
        const dayOfWeek = new Date(selectedDate.replace(/-/g, '/')).getUTCDay();
        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
        const tasksForDay = selectedRoutine.tasks.filter((task: Task) => task.days.includes(dayName as any));
        if (tasksForDay.length === 0) return 100; // No tasks, so 100% complete
        
        const completedIds = taskHistory[selectedDate] || [];
        const completedCount = tasksForDay.filter((task: any) => completedIds.includes(task.id)).length;
        
        return (completedCount / tasksForDay.length) * 100;
    }, [selectedRoutine, selectedDate, taskHistory]);


    const handleNavClick = (id: ActiveView) => {
        dispatch({ type: 'SET_ACTIVE_ROUTINE', payload: id });
    };

    const navItems = [
        enableMorning && { id: 'Morning', ...routines['Morning'] },
        enableAfterSchool && { id: 'After-School', ...routines['After-School'] },
        enableBedtime && { id: 'Bedtime', ...routines['Bedtime'] },
        { id: 'Quests', ...QUESTS_THEME },
        enablePlaytime && isBedtimeComplete && { id: 'Playtime', ...PLAYTIME_THEME },
    ].filter(Boolean) as (typeof routines[ActiveRoutineId] & { id: ActiveView, theme: any })[];

    useEffect(() => {
        const activeItemEl = itemRefs.current[activeRoutine];
        if (activeItemEl) {
            const { offsetLeft, offsetWidth } = activeItemEl;
            setPillStyle({
                left: offsetLeft,
                width: offsetWidth,
                opacity: 1,
            });
        }
    }, [activeRoutine, navItems]);

    const formattedDate = useMemo(() => {
        return new Date(selectedDate.replace(/-/g, '/')).toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
        });
    }, [selectedDate]);


    return (
        <div className="pt-12 pb-24 relative">
             <style>{`
                @keyframes content-fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-content-fade-in { animation: content-fade-in 0.4s ease-out forwards; }
            `}</style>
             <button 
                onClick={() => setIsCalendarOpen(true)} 
                className="absolute top-4 left-0 md:top-8 md:left-0 z-20 bg-white/70 backdrop-blur-sm rounded-full p-3 shadow-md hover:bg-white transition-all focus:outline-none focus:ring-2 focus:ring-purple-500"
                aria-label="Open calendar"
            >
                <CalendarIcon className="w-6 h-6 text-slate-600" />
            </button>
            
            {isCalendarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40"
                    onClick={() => setIsCalendarOpen(false)}
                >
                    <div onClick={e => e.stopPropagation()}>
                        <CalendarView onClose={() => setIsCalendarOpen(false)} />
                    </div>
                </div>
            )}

            <header className="text-center mb-8">
                 <h1 className="text-3xl md:text-4xl font-bold text-slate-800">Hi, {childName}!</h1>
                 <p className="text-slate-500 font-medium">{formattedDate}</p>
            </header>

            <main>
                <div key={activeRoutine} className="animate-content-fade-in">
                    {activeRoutine in routines && selectedRoutine && (
                        <>
                            <ThemedProgressBar progress={progress} themeColorClass={selectedRoutine.theme.color} />
                            <RoutineView routine={selectedRoutine} selectedDate={selectedDate} />
                        </>
                    )}
                    {activeRoutine === 'Quests' && <QuestView />}
                    {activeRoutine === 'Playtime' && <PlaytimeView />}
                </div>
            </main>

            <footer className="fixed bottom-0 left-0 right-0 z-20 p-2 md:p-3 bg-transparent">
                <nav ref={navRef} className="relative max-w-md md:max-w-lg mx-auto bg-white/60 backdrop-blur-md rounded-2xl shadow-lg p-2 flex justify-around gap-1.5">
                    <div
                        className="absolute top-0 p-2 h-full transition-all duration-300 ease-in-out"
                        style={{
                            left: pillStyle.left,
                            width: pillStyle.width,
                            opacity: pillStyle.opacity,
                        }}
                    >
                        <div className="bg-white rounded-xl shadow-lg w-full h-full"></div>
                    </div>
                    {navItems.map(item => (
                        <NavItem 
                            ref={el => { itemRefs.current[item.id] = el; }}
                            key={item.id}
                            id={item.id}
                            name={item.name}
                            icon={item.theme.icon}
                            isActive={activeRoutine === item.id}
                            onClick={handleNavClick}
                        />
                    ))}
                </nav>
            </footer>
        </div>
    );
};