
import * as React from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { ChevronLeftIcon, ChevronRightIcon } from './icons/Icons';

interface CalendarViewProps {
    onClose: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onClose }) => {
    const { state, dispatch } = useAppContext();
    const { selectedDate } = state;
    const [currentMonth, setCurrentMonth] = React.useState(new Date(selectedDate.replace(/-/g, '/')));
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const handleDateSelect = (day: Date) => {
        dispatch({ type: 'SET_SELECTED_DATE', payload: day.toISOString().split('T')[0] });
        onClose();
    };
    
    const changeMonth = (amount: number) => {
        setCurrentMonth(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + amount, 1);
            return newDate;
        });
    };
    
    const renderCalendarGrid = () => {
        const month = currentMonth.getMonth();
        const year = currentMonth.getFullYear();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const blanks = Array(firstDayOfMonth).fill(null);
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

        return (
            <div className="grid grid-cols-7">
                {blanks.map((_, i) => <div key={`blank-${i}`}></div>)}
                {days.map(day => {
                    const date = new Date(year, month, day);
                    const dateString = date.toISOString().split('T')[0];
                    const isSelected = dateString === selectedDate;
                    const isToday = date.getTime() === today.getTime();
                    
                    let dayClasses = 'w-8 h-8 rounded-full transition-colors duration-200 ease-in-out flex items-center justify-center font-semibold text-sm';

                    if (isSelected) {
                        dayClasses += ' bg-purple-600 text-white shadow-md';
                    } else if (isToday) {
                        dayClasses += ' bg-teal-200 text-teal-900';
                    } else {
                        dayClasses += ' text-slate-700 hover:bg-slate-100';
                    }

                    return (
                        <div key={day} className="flex justify-center items-center h-10">
                            <button 
                                onClick={() => handleDateSelect(date)}
                                className={dayClasses}
                            >
                                {day}
                            </button>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="bg-white p-4 rounded-3xl shadow-xl w-[280px] border border-gray-100">
            <header className="flex justify-between items-center mb-4 px-1">
                <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-full hover:bg-slate-100 transition-colors" aria-label="Previous month">
                    <ChevronLeftIcon className="w-5 h-5 text-slate-500" />
                </button>
                <div className="font-semibold text-slate-800 text-center" aria-live="polite">
                    <div className="text-base">{currentMonth.toLocaleString('default', { month: 'long' })}</div>
                    <div className="text-sm text-slate-500">{currentMonth.getFullYear()}</div>
                </div>
                 <button onClick={() => changeMonth(1)} className="p-1.5 rounded-full hover:bg-slate-100 transition-colors" aria-label="Next month">
                    <ChevronRightIcon className="w-5 h-5 text-slate-500" />
                </button>
            </header>
            
            <main>
                <div className="grid grid-cols-7 text-center text-xs text-slate-400 font-bold mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                        <div key={day} className="py-1">{day}</div>
                    ))}
                </div>
                {renderCalendarGrid()}
            </main>
        </div>
    );
};
