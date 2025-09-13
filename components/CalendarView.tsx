
import * as React from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { ChevronLeftIcon, ChevronRightIcon } from './icons/Icons';

interface CalendarViewProps {
    onClose: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onClose }) => {
    const { state, dispatch } = useAppContext();
    const { selectedDate, taskHistory } = state;
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
            <div className="grid grid-cols-7 gap-2 text-center text-sm">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                    <div key={index} className="font-bold text-slate-500">{day}</div>
                ))}
                {blanks.map((_, i) => <div key={`blank-${i}`}></div>)}
                {days.map(day => {
                    const date = new Date(year, month, day);
                    const dateString = date.toISOString().split('T')[0];
                    const isSelected = dateString === selectedDate;
                    const isToday = date.getTime() === today.getTime();
                    
                    const hasCompletedTasks = (taskHistory[dateString]?.length || 0) > 0;
                    
                    let dayClasses = 'w-10 h-10 rounded-full transition-all duration-200 ease-in-out flex items-center justify-center font-semibold relative';

                    if (isSelected) {
                        dayClasses += ' bg-purple-600 text-white shadow-lg scale-110';
                    } else if (isToday) {
                        dayClasses += ' bg-teal-200 text-teal-800 ring-2 ring-teal-300';
                    } else {
                        dayClasses += ' text-slate-700 hover:bg-slate-200';
                    }

                    return (
                        <button 
                            key={day} 
                            onClick={() => handleDateSelect(date)}
                            className={dayClasses}
                        >
                            {day}
                            {hasCompletedTasks && !isSelected && (
                                <div className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 ${isToday ? 'bg-green-600' : 'bg-green-500'} rounded-full`}></div>
                            )}
                        </button>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-lg w-full max-w-sm border border-slate-200/50">
            <div className="flex justify-between items-center mb-3">
                <button onClick={() => changeMonth(-1)} className="p-1 rounded-full hover:bg-slate-200">
                    <ChevronLeftIcon className="w-5 h-5 text-slate-600" />
                </button>
                <h3 className="font-bold text-slate-700">
                    {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h3>
                 <button onClick={() => changeMonth(1)} className="p-1 rounded-full hover:bg-slate-200">
                    <ChevronRightIcon className="w-5 h-5 text-slate-600" />
                </button>
            </div>
            {renderCalendar()}
        </div>
    );
};