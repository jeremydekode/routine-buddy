import React, { useMemo } from 'react';
import { Routine, Day, DAYS_OF_WEEK } from '../types';
import { TaskCard } from './TaskCard';
import { useAppContext } from '../hooks/useAppContext';
import { StarIcon } from './icons/Icons';

interface RoutineViewProps {
    routine: Routine;
    selectedDate: string;
}

const CompletedStamp: React.FC = () => (
    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10 pointer-events-none">
        <div className="transform -rotate-12 border-4 border-green-400 rounded-lg p-4 text-center">
            <h3 className="text-4xl font-black text-green-500 uppercase tracking-wider">Completed!</h3>
            <StarIcon className="w-10 h-10 text-yellow-400 mx-auto mt-2" />
        </div>
    </div>
);

export const RoutineView: React.FC<RoutineViewProps> = ({ routine, selectedDate }) => {
    const { state } = useAppContext();
    const { taskHistory } = state;
    const selectedDay = useMemo(() => DAYS_OF_WEEK[new Date(selectedDate).getUTCDay()], [selectedDate]);
    
    if (!routine) return null;

    const tasksForSelectedDay = routine.tasks.filter(task => task.days.includes(selectedDay));
    
    const isCompleted = useMemo(() => {
        if (tasksForSelectedDay.length === 0) return false;
        const completedTasks = taskHistory[selectedDate] || [];
        return tasksForSelectedDay.every(task => completedTasks.includes(task.id));
    }, [tasksForSelectedDay, taskHistory, selectedDate]);


    if (tasksForSelectedDay.length === 0) {
        return (
            <div className="text-center p-8 bg-white/50 rounded-2xl shadow-lg">
                <p className="text-lg font-semibold text-slate-600">No tasks for this routine today!</p>
            </div>
        );
    }

    return (
        <div className="relative">
            {isCompleted && <CompletedStamp />}
            <div className={`space-y-4 ${isCompleted ? 'opacity-70' : ''}`}>
                {tasksForSelectedDay.map(task => (
                    <TaskCard key={task.id} task={task} routineId={routine.id} selectedDate={selectedDate} />
                ))}
            </div>
        </div>
    );
};
