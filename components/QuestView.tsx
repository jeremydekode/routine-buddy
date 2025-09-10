import React from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Quest } from '../types';
import { StarIcon } from './icons/Icons';

interface QuestProgressProps {
    quest: Quest;
    currentStars: number;
    isPending: boolean;
    colors: {
        bg: string;
        text: string;
        starEmpty: string;
        starFull: string;
    };
}

const QuestProgress: React.FC<QuestProgressProps> = ({ quest, currentStars, isPending, colors }) => {
    const { dispatch } = useAppContext();
    const isCompleted = currentStars >= quest.goal;

    const handleClaim = () => {
        dispatch({ type: 'REQUEST_QUEST_APPROVAL', payload: { questId: quest.id } });
    };

    const isMonthly = quest.id === 'monthly';
    const starSize = isMonthly ? 'w-7 h-7' : 'w-10 h-10'; // Make stars larger and more countable for kids
    const gridGap = isMonthly ? 'gap-1.5' : 'gap-2';
    const gridCols = isMonthly ? 'grid-cols-10' : 'grid-cols-7';
    const starStamps = Array.from({ length: quest.goal }, (_, i) => i < currentStars);

    return (
        <div className={`${colors.bg} p-4 rounded-2xl shadow-lg flex flex-col`}>
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
                <h3 className={`text-xl font-bold ${colors.text}`}>{quest.name}</h3>
                {(isCompleted || isPending) && (
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold transition-colors ${
                        isPending ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                    }`}>
                        <StarIcon className="w-3 h-3" />
                        <span>{isPending ? 'Pending' : 'Done!'}</span>
                    </div>
                )}
            </div>

            {/* Star Stamps Grid */}
            <div className={`grid ${gridCols} ${gridGap} mb-4`}>
                {starStamps.map((isFilled, index) => (
                     <div key={index} className="w-full aspect-square flex items-center justify-center">
                         <StarIcon className={`${starSize} ${isFilled ? colors.starFull : colors.starEmpty}`} />
                     </div>
                ))}
            </div>
            
            <p className="text-sm font-semibold text-slate-600 mb-3 text-center">
                {Math.min(currentStars, quest.goal)} / {quest.goal} stars
            </p>

            {isCompleted && (
                 <button 
                    onClick={handleClaim}
                    disabled={isPending}
                    className="w-full mt-auto bg-purple-500 text-white font-bold py-2 px-3 rounded-lg text-sm hover:bg-purple-600 transition disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                    {isPending ? 'Waiting for Approval...' : 'Claim Reward'}
                </button>
            )}
        </div>
    );
};

export const QuestView: React.FC = () => {
    const { state } = useAppContext();
    const { quests, starCount, weeklyQuestPending, monthlyQuestPending } = state;

    return (
        <div className="space-y-6">
            <style>
                {`
                @keyframes sparkle { 0%, 100% { transform: scale(1); filter: brightness(1.2); } 50% { transform: scale(1.2); filter: brightness(1.8); } }
                .animate-sparkle-subtle { animation: sparkle 2s ease-in-out infinite; }
                `}
            </style>
            <div className="text-center">
                 <p className="text-lg font-semibold text-slate-600">You have collected</p>
                 <div className="flex items-center justify-center gap-2 mt-1">
                    <StarIcon className="w-10 h-10 text-yellow-400 animate-sparkle-subtle" />
                    <span className="text-5xl font-bold text-slate-700">{starCount}</span>
                    <span className="text-2xl font-semibold text-slate-500">Stars!</span>
                 </div>
            </div>
            <QuestProgress
                quest={quests.weekly}
                currentStars={starCount}
                isPending={weeklyQuestPending}
                colors={{
                    bg: 'bg-amber-100',
                    text: 'text-amber-700',
                    starEmpty: 'text-amber-200',
                    starFull: 'text-yellow-400'
                }}
            />
             <QuestProgress
                quest={quests.monthly}
                currentStars={starCount}
                isPending={monthlyQuestPending}
                colors={{
                    bg: 'bg-sky-100',
                    text: 'text-sky-700',
                    starEmpty: 'text-sky-200',
                    starFull: 'text-yellow-400'
                }}
            />
        </div>
    );
};