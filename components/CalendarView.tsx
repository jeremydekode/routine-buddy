
import * as React from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { ChevronLeftIcon, ChevronRightIcon } from './icons/Icons';

interface CalendarViewProps {
    onClose: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onClose }) => {
    const { state, dispatch } = useAppContext();
    const { selectedDate } = state;
    // Initialize based on the globally selected date to stay in sync
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
            newDate.setMonth(newDate.getMonth() + amount, 1); // Set to day 1 to avoid month skipping issues
            return newDate;
        });
    };
    
    const renderCalendar = () => {
        const month = currentMonth.getMonth();
        const year = currentMonth.getFullYear();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const blanks = Array(firstDayOfMonth).fill(null);
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

        return (
            <div className="grid grid-cols-7 gap-y-2 text-center text-sm">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                    <div key={index} className="font-bold text-slate-500 text-xs py-1">{day}</div>
                ))}
                {blanks.map((_, i) => <div key={`blank-${i}`}></div>)}
                {days.map(day => {
                    const date = new Date(year, month, day);
                    const dateString = date.toISOString().split('T')[0];
                    const isSelected = dateString === selectedDate;
                    const isToday = date.getTime() === today.getTime();
                    
                    let dayClasses = 'w-9 h-9 rounded-full transition-all duration-200 ease-in-out flex items-center justify-center font-semibold';

                    if (isSelected) {
                        dayClasses += ' bg-purple-500 text-white shadow-md';
                    } else if (isToday) {
                        dayClasses += ' bg-cyan-200 text-cyan-900';
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
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-lg w-full max-w-xs border border-slate-200/50">
            <div className="flex justify-between items-center mb-3 px-1">
                <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                    <ChevronLeftIcon className="w-5 h-5 text-slate-600" />
                </button>
                <div className="font-bold text-slate-700 text-center leading-tight">
                    <div>{currentMonth.toLocaleString('default', { month: 'long' })}</div>
                    <div>{currentMonth.getFullYear()}</div>
                </div>
                 <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                    <ChevronRightIcon className="w-5 h-5 text-slate-600" />
                </button>
            </div>
            {renderCalendar()}
        </div>
    );
};
