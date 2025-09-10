import React from 'react';
import { RocketIcon } from './icons/Icons';

interface ThemedProgressBarProps {
    progress: number;
    themeColorClass: string; // e.g., 'bg-amber-100'
}

const colorMap: { [key: string]: { fuel: string; } } = {
    amber: { fuel: 'bg-orange-400' },
    sky: { fuel: 'bg-cyan-400' },
    indigo: { fuel: 'bg-violet-400' },
    purple: { fuel: 'bg-fuchsia-400' },
    default: { fuel: 'bg-green-400' }
};

export const ThemedProgressBar: React.FC<ThemedProgressBarProps> = ({ progress, themeColorClass }) => {
    // Extracts 'amber' from 'bg-amber-100'
    const colorKey = themeColorClass.match(/bg-(.*?)-/)?.[1] || 'default';
    const colors = colorMap[colorKey] || colorMap.default;

    // To prevent rocket from going off-screen
    const rocketPosition = Math.min(progress, 90);

    return (
        <div className="relative w-full h-20 flex items-center justify-center mb-6">
            <style>
                {`
                @keyframes flicker {
                    0%, 100% { transform: scale(1, 1); opacity: 1; }
                    50% { transform: scale(1.1, 1.3); opacity: 0.8; }
                }
                .animate-flicker {
                    animation: flicker 0.15s infinite;
                    transform-origin: top;
                }
                `}
            </style>
            
            {/* Track */}
            <div className="absolute w-full h-3 bg-white/50 rounded-full shadow-inner"></div>
            
            {/* Rocket Trail / Progress */}
            <div className="absolute left-0 w-full h-3">
                 <div className={`h-full rounded-full ${colors.fuel} transition-all duration-500 ease-out`} style={{ width: `${progress}%` }}></div>
            </div>

            {/* Rocket */}
            <div 
                className="absolute top-1/2 -translate-y-1/2 transition-all duration-500 ease-out" 
                style={{ left: `calc(${rocketPosition}% - 10px)` }}
            >
                 <div className="relative w-12 h-12">
                     <RocketIcon className={`w-12 h-12 text-slate-600 -rotate-45 drop-shadow-lg`} />
                     {progress > 0 && progress < 100 && (
                         <div className={`absolute top-8 left-1 w-3 h-3 ${colors.fuel} rounded-full blur-sm animate-flicker`}></div>
                     )}
                 </div>
            </div>
        </div>
    );
};