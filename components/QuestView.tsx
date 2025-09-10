import React from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Quest, QuestId } from '../types';
import { StarIcon } from './icons/Icons';

interface QuestProgressProps {
    quest: Quest;
    currentStars: number;
    isPending: boolean;
    colors: {
        bg: string;
        text: string;
    }
}

const QuestProgress: React.FC<QuestProgressProps> = ({ quest, currentStars, isPending, colors }) => {
    const { dispatch } = useAppContext();
    const isCompleted = currentStars >= quest.goal;

    const handleClaim = () => {
        dispatch({ type: 'REQUEST_QUEST_APPROVAL', payload: { questId: quest.id } });
    };

    return (
        <div className={`${colors.bg} p-6 rounded-2xl shadow-lg transition-all`}>
            <div className="flex justify-between items-start">
                <div>
                    <h3 className={`text-xl font-bold ${colors.text}`}>{quest.name}</h3>
                    <p className="text-slate-500 text-sm">Reward: A fun surprise!</p>
                </div>
                {(isCompleted || isPending) && (
                     <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold transition-colors ${
                        isPending ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                     }`}>
                        <StarIcon className="w-5 h-5" />
                        <span>{isPending ? 'Pending...' : 'Complete!'}</span>
                    </div>
                )}
            </div>
             <div className="mt-4">
                 <div className="flex flex-wrap gap-2 bg-white/60 p-3 rounded-lg shadow-inner">
                    {Array.from({ length: quest.goal }).map((_, i) => (
                        <StarIcon
                            key={i}
                            className={`w-7 h-7 transition-colors duration-300 ${
                                i < currentStars ? 'text-yellow-400' : 'text-slate-300'
                            }`}
                        />
                    ))}
                </div>
                <div className="flex justify-between items-center mt-2">
                    <span className="text-sm font-semibold text-slate-600">
                         {Math.min(currentStars, quest.goal)} / {quest.goal} Stars
                    </span>
                    {isCompleted && (
                        <button 
                            onClick={handleClaim}
                            disabled={isPending}
                            className="bg-purple-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-600 transition disabled:bg-slate-300 disabled:cursor-not-allowed"
                        >
                            {isPending ? 'Waiting for approval...' : 'Claim Reward'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export const QuestView: React.FC = () => {
    const { state } = useAppContext();
    const { quests, starCount, weeklyQuestPending, monthlyQuestPending } = state;

    return (
        <div className="space-y-6">
            <div className="text-center">
                 <p className="text-lg font-semibold text-slate-600">You have collected</p>
                 <div className="flex items-center justify-center gap-2 mt-1">
                    <StarIcon className="w-10 h-10 text-yellow-400" />
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
                    text: 'text-amber-700'
                }}
            />
             <QuestProgress
                quest={quests.monthly}
                currentStars={starCount}
                isPending={monthlyQuestPending}
                colors={{
                    bg: 'bg-sky-100',
                    text: 'text-sky-700'
                }}
            />
        </div>
    );
};