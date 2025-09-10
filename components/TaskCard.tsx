import React, { useState, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Task, ActiveRoutineId } from '../types';
import { SpeakerIcon } from './icons/Icons';

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


const playTaskCompleteSound = () => {
    const context = getAudioContext();
    if (!context) return;
    
    if (context.state === 'suspended') {
        context.resume();
    }

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, context.currentTime); // A5 note
    gainNode.gain.setValueAtTime(0.3, context.currentTime);

    gainNode.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 0.3);
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.3);
};

const ConfettiBurst: React.FC = () => (
    <div className="absolute top-1/2 right-10 -translate-y-1/2 w-1 h-1 pointer-events-none z-10">
        {Array.from({ length: 20 }).map((_, i) => {
            const angle = Math.random() * 360;
            const distance = 60 + Math.random() * 40;
            const style = {
                '--angle': `${angle}deg`,
                '--distance': `${distance}px`,
                '--bg-color': ['#fde68a', '#818cf8', '#f472b6', '#4ade80'][i % 4],
                animation: `burst 0.8s ease-out forwards`,
            } as React.CSSProperties;
            return (
                <i
                    key={i}
                    className="absolute w-2 h-3"
                    style={style}
                />
            );
        })}
    </div>
);


interface TaskCardProps {
    task: Task;
    routineId: ActiveRoutineId;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, routineId }) => {
    const { dispatch } = useAppContext();
    const [timer, setTimer] = useState<number | null>(null);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [isBouncing, setIsBouncing] = useState(false);

     useEffect(() => {
        if (showConfetti) {
            const timer = setTimeout(() => setShowConfetti(false), 1000);
            return () => clearTimeout(timer);
        }
    }, [showConfetti]);

    useEffect(() => {
        if (isBouncing) {
            const timer = setTimeout(() => setIsBouncing(false), 300); // Match animation duration
            return () => clearTimeout(timer);
        }
    }, [isBouncing]);


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
                playTaskCompleteSound();
                setShowConfetti(true);
                dispatch({ type: 'TOGGLE_TASK_COMPLETION', payload: { routineId, taskId: task.id } });
            }
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isTimerRunning, timer, task.completed, dispatch, routineId, task.id]);
    
    const handleToggle = () => {
        if (!task.completed) {
            playTaskCompleteSound();
            setShowConfetti(true);
        }
        setIsBouncing(true);
        dispatch({ type: 'TOGGLE_TASK_COMPLETION', payload: { routineId, taskId: task.id } });
    };

    const handleStartTimer = () => {
        if (task.duration && !task.completed) {
            setTimer(task.duration);
            setIsTimerRunning(true);
        }
    };
    
    const handleSpeak = (e: React.MouseEvent) => {
        e.stopPropagation();
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(task.title);
            window.speechSynthesis.cancel(); // Cancel any current speech
            window.speechSynthesis.speak(utterance);
        } else {
            console.warn("Text-to-speech is not supported in this browser.");
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const checkboxId = `task-${task.id}`;
    
    const hasTimer = task.duration && task.duration > 0;

    return (
        <div
            className={`relative flex items-center p-4 rounded-2xl shadow-lg transition-all duration-300 ${
                task.completed ? 'bg-green-100/80' : 'bg-white/80'
            } ${isBouncing ? 'animate-bounce-short' : ''}`}
        >
            <style>
                {`
                @keyframes bounce-short {
                    0%, 100% { transform: translateY(0) scale(1); }
                    50% { transform: translateY(-6px) scale(1.02); }
                }
                .animate-bounce-short {
                    animation: bounce-short 0.3s ease-out;
                }
                `}
            </style>
            {showConfetti && <ConfettiBurst />}
            <div className="w-20 h-20 bg-slate-100 rounded-lg mr-4 flex-shrink-0 flex items-center justify-center">
                <span className="text-4xl" role="img" aria-label={task.title}>{task.icon}</span>
            </div>
            <div className="flex-grow">
                 <div className="flex items-center gap-2">
                    <h3 className={`font-bold text-lg text-slate-700 transition-colors ${task.completed ? 'line-through text-slate-400' : ''}`}>
                        {task.title}
                    </h3>
                    <button
                        onClick={handleSpeak}
                        className="text-slate-400 hover:text-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-300 rounded-full p-1 transition-colors"
                        aria-label="Read task title aloud"
                    >
                        <SpeakerIcon className="w-5 h-5" />
                    </button>
                </div>
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