import React, { useState, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Task, ActiveRoutineId } from '../types';

interface TaskCardProps {
    task: Task;
    routineId: ActiveRoutineId;
}

const ImageLoadingSpinner: React.FC = () => (
    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
    </div>
);


export const TaskCard: React.FC<TaskCardProps> = ({ task, routineId }) => {
    const { dispatch } = useAppContext();
    const [timer, setTimer] = useState<number | null>(null);
    const [isTimerRunning, setIsTimerRunning] = useState(false);

    useEffect(() => {
        // FIX: The type `NodeJS.Timeout` is not available in browser environments. Switched to a compatible type.
        let interval: ReturnType<typeof setInterval> | null = null;
        if (isTimerRunning && timer !== null && timer > 0) {
            interval = setInterval(() => {
                setTimer(t => (t ? t - 1 : 0));
            }, 1000);
        } else if (isTimerRunning && timer === 0) {
            setIsTimerRunning(false);
            setTimer(null);
            if (!task.completed) {
                handleToggle();
            }
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isTimerRunning, timer, task.completed]);
    
    const handleToggle = () => {
        dispatch({ type: 'TOGGLE_TASK_COMPLETION', payload: { routineId, taskId: task.id } });
    };

    const handleStartTimer = () => {
        if (task.duration && !task.completed) {
            setTimer(task.duration);
            setIsTimerRunning(true);
        }
    };
    
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const checkboxId = `task-${task.id}`;

    const isLoading = typeof task.image === 'undefined';
    const hasFailed = task.image === 'FAILED';
    const hasImage = task.image && !hasFailed;
    
    const hasTimer = task.duration && task.duration > 0;

    return (
        <div
            className={`flex items-center p-4 rounded-2xl shadow-lg transition-all duration-300 ${
                task.completed ? 'bg-green-100/80' : 'bg-white/80'
            }`}
        >
            <div className="w-20 h-20 bg-slate-100 rounded-lg mr-4 overflow-hidden relative flex-shrink-0 flex items-center justify-center">
                {hasImage ? (
                    <img src={task.image!} alt={task.title} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-4xl" role="img" aria-label={task.title}>{task.icon}</span>
                )}
                {isLoading && <ImageLoadingSpinner />}
            </div>
            <div className="flex-grow">
                <h3 className={`font-bold text-lg text-slate-700 transition-colors ${task.completed ? 'line-through text-slate-400' : ''}`}>
                    {task.title}
                </h3>
                <p className={`text-sm text-slate-500 ${task.completed ? 'line-through' : ''}`}>
                    {task.description}
                </p>
                {hasTimer && !task.completed && (
                     <div className="mt-2 text-sm font-semibold text-indigo-600">
                        <i className="fa-regular fa-clock mr-1"></i>
                        {task.duration} seconds
                    </div>
                )}
            </div>
            <div className="ml-4">
                {hasTimer ? (
                     isTimerRunning ? (
                         <div className="w-20 text-center">
                            <p className="text-2xl font-bold text-purple-600">{formatTime(timer!)}</p>
                        </div>
                    ) : (
                        <button
                            onClick={handleStartTimer}
                            disabled={task.completed}
                            className="bg-purple-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-600 transition disabled:bg-slate-300"
                        >
                            {task.completed ? 'Done!' : 'Start'}
                        </button>
                    )
                ) : (
                    <>
                        <input
                            type="checkbox"
                            id={checkboxId}
                            checked={task.completed}
                            onChange={handleToggle}
                            className="hidden"
                        />
                        <label
                            htmlFor={checkboxId}
                            className={`flex items-center justify-center w-12 h-12 rounded-full cursor-pointer transition-all duration-300 transform ${
                                task.completed
                                    ? 'bg-green-400 text-white scale-110 shadow-md'
                                    : 'bg-slate-200 text-slate-400 hover:bg-slate-300'
                            }`}
                        >
                            <i className="fa-solid fa-check text-2xl"></i>
                        </label>
                    </>
                )}
            </div>
        </div>
    );
};