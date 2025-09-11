
import * as React from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { GamepadIcon } from './icons/Icons';

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

const playTimerEndSound = () => {
    const context = getAudioContext();
    if (!context) return;
    if (context.state === 'suspended') context.resume();
    
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(440, context.currentTime); // A4
    gainNode.gain.setValueAtTime(0.3, context.currentTime);

    oscillator.frequency.setValueAtTime(330, context.currentTime + 0.15); // E4
    
    gainNode.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 0.5);
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.5);
};

export const PlaytimeView: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { playtimeDuration, playtimeStarted } = state;

    const totalSeconds = React.useMemo(() => playtimeDuration * 60, [playtimeDuration]);
    const [secondsLeft, setSecondsLeft] = React.useState(totalSeconds);
    const [isTimerActive, setIsTimerActive] = React.useState(false);

    React.useEffect(() => {
        // If playtime was already started today, resume the timer.
        if (playtimeStarted) {
            setIsTimerActive(true);
        }
    }, [playtimeStarted]);

    React.useEffect(() => {
        let interval: ReturnType<typeof setInterval> | null = null;
        if (isTimerActive && secondsLeft > 0) {
            interval = setInterval(() => {
                setSecondsLeft(s => Math.max(0, s - 1));
            }, 1000);
        } else if (isTimerActive && secondsLeft === 0) {
            playTimerEndSound();
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isTimerActive, secondsLeft]);

    const handleStart = () => {
        dispatch({ type: 'START_PLAYTIME' });
        setSecondsLeft(totalSeconds); // Reset timer on start
        setIsTimerActive(true);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const isFinished = secondsLeft === 0;

    return (
        <div className="flex flex-col items-center justify-center text-center p-8 bg-white/50 rounded-3xl shadow-lg">
            <style>
                {`
                @keyframes pulse-glow {
                    0%, 100% {
                        filter: drop-shadow(0 0 10px rgba(20, 184, 166, 0.4));
                    }
                    50% {
                        filter: drop-shadow(0 0 20px rgba(20, 184, 166, 0.8));
                    }
                }
                .animate-pulse-glow {
                    animation: pulse-glow 2s ease-in-out infinite;
                }
                `}
            </style>
            {!isTimerActive ? (
                <>
                    <GamepadIcon className="w-24 h-24 text-teal-500 mb-6" />
                    <h2 className="text-2xl font-bold text-slate-700">Ready for Playtime?</h2>
                    <p className="text-slate-500 mb-8">You have {playtimeDuration} minutes of playtime!</p>
                    <button 
                        onClick={handleStart}
                        className="w-full max-w-xs bg-teal-500 text-white font-bold py-4 px-6 rounded-full text-lg hover:bg-teal-600 transition shadow-lg transform hover:scale-105"
                    >
                        Start Timer
                    </button>
                </>
            ) : (
                <>
                    <h2 className="text-2xl font-bold text-slate-700 mb-4">
                        {isFinished ? "Time's Up!" : "Playtime Remaining"}
                    </h2>
                    <div className={`text-7xl md:text-8xl font-mono font-bold text-teal-600 my-4 p-4 rounded-lg ${!isFinished ? 'animate-pulse-glow' : ''}`}>
                        {formatTime(secondsLeft)}
                    </div>
                    {isFinished && (
                        <p className="text-slate-500 mt-4 text-lg">Great job! Now it's time to rest.</p>
                    )}
                </>
            )}
        </div>
    );
};