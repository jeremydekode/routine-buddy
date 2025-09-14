

import * as React from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Quest, StarAdjustmentLogEntry } from '../types';
import { StarIcon, HeartIcon, TrophyIcon } from './icons/Icons';
import { CharacterQuestView } from './CharacterQuestView';

interface QuestProgressProps {
    quest: Quest;
    currentStars: number;
    isPending: boolean;
    isClaimed: boolean;
    colors: {
        bg: string;
        text: string;
        starEmpty: string;
        starFull: string;
    };
}

const ClaimedStamp: React.FC = () => (
    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10 pointer-events-none">
        <div className="transform -rotate-12 border-4 border-purple-400 bg-purple-100 rounded-lg p-4 text-center shadow-lg">
            <h3 className="text-4xl font-black text-purple-600 uppercase tracking-wider">
                Claimed
            </h3>
        </div>
    </div>
);

const QuestProgress: React.FC<QuestProgressProps> = ({ quest, currentStars, isPending, isClaimed, colors }) => {
    const { dispatch } = useAppContext();
    const isCompleted = currentStars >= quest.goal;

    const handleClaim = () => {
        dispatch({ type: 'REQUEST_QUEST_APPROVAL', payload: { questId: quest.id } });
    };

    const isMonthly = quest.id === 'monthly';
    const starSize = isMonthly ? 'w-6 h-6' : 'w-8 h-8';
    const gridGap = isMonthly ? 'gap-1' : 'gap-1.5';
    const gridCols = isMonthly ? 'grid-cols-10' : 'grid-cols-7';
    const starStamps = Array.from({ length: quest.goal }, (_, i) => i < currentStars);

    return (
        <div className={`${colors.bg} p-4 rounded-2xl shadow-lg flex flex-col relative`}>
            {isClaimed && <ClaimedStamp />}
            <div className={isClaimed ? 'opacity-50' : ''}>
                <div className="flex justify-between items-center mb-2">
                    <h3 className={`text-xl font-bold ${colors.text}`}>{quest.name}</h3>
                    {(isCompleted || isPending) && !isClaimed && (
                        <div className={`flex items-center px-2 py-0.5 rounded-full text-xs font-bold transition-colors self-start flex-shrink-0 ${
                            isPending ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                        }`}>
                            <span>{isPending ? 'Pending' : 'Done!'}</span>
                        </div>
                    )}
                </div>
                
                 <p className="text-sm font-semibold text-slate-600 mb-3 text-right">
                    {Math.min(currentStars, quest.goal)} / {quest.goal} stars
                </p>

                <div className={`grid ${gridCols} ${gridGap} mb-3`}>
                    {starStamps.map((isFilled, index) => (
                         <div key={index} className="w-full aspect-square flex items-center justify-center">
                             <StarIcon className={`${starSize} ${isFilled ? colors.starFull : colors.starEmpty}`} />
                         </div>
                    ))}
                </div>
            </div>
            
            {!isClaimed && isCompleted && (
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

// Helper function to calculate quest progress from star logs
const calculateQuestProgress = (logs: StarAdjustmentLogEntry[]): number => {
    return logs.reduce((sum, log) => {
        // Exclude stars from quest rewards from counting towards progress
        if (log.reason.startsWith('Reward for')) {
            return sum;
        }
        return sum + log.amount;
    }, 0);
};


const StarQuests: React.FC = () => {
    const { state } = useAppContext();
    const { 
        quests, 
        starCount, 
        weeklyQuestPending, 
        monthlyQuestPending, 
        starAdjustmentLog, 
        weeklyQuestClaimedDate, 
        monthlyQuestClaimedDate, 
        weeklyQuestLastResetDate, 
        monthlyQuestLastResetDate,
        weeklyQuestProgressOverride,
        monthlyQuestProgressOverride
    } = state;

    const starsEarnedThisWeek = React.useMemo(() => {
        if (weeklyQuestProgressOverride !== null) {
            return weeklyQuestProgressOverride;
        }
        const relevantLogs = weeklyQuestLastResetDate
            ? starAdjustmentLog.filter(log => new Date(log.date) >= new Date(weeklyQuestLastResetDate))
            : starAdjustmentLog;
        return calculateQuestProgress(relevantLogs);
    }, [starAdjustmentLog, weeklyQuestLastResetDate, weeklyQuestProgressOverride]);

    const starsEarnedThisMonth = React.useMemo(() => {
        if (monthlyQuestProgressOverride !== null) {
            return monthlyQuestProgressOverride;
        }
        const relevantLogs = monthlyQuestLastResetDate
            ? starAdjustmentLog.filter(log => new Date(log.date) >= new Date(monthlyQuestLastResetDate))
            : starAdjustmentLog;
        return calculateQuestProgress(relevantLogs);
    }, [starAdjustmentLog, monthlyQuestLastResetDate, monthlyQuestProgressOverride]);


    return (
        <div className="space-y-4">
             <style>{`
                @keyframes sparkle { 0%, 100% { transform: scale(1); filter: brightness(1.2); } 50% { transform: scale(1.2); filter: brightness(1.8); } }
                .animate-sparkle-subtle { animation: sparkle 2s ease-in-out infinite; }
            `}</style>
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
                currentStars={starsEarnedThisWeek}
                isPending={weeklyQuestPending}
                isClaimed={!!weeklyQuestClaimedDate}
                colors={{
                    bg: 'bg-amber-100',
                    text: 'text-amber-700',
                    starEmpty: 'text-amber-200',
                    starFull: 'text-yellow-400'
                }}
            />
             <QuestProgress
                quest={quests.monthly}
                currentStars={starsEarnedThisMonth}
                isPending={monthlyQuestPending}
                isClaimed={!!monthlyQuestClaimedDate}
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

export const QuestView: React.FC = () => {
    const { state } = useAppContext();
    const { enableCharacterQuests } = state;
    const [activeQuestTab, setActiveQuestTab] = React.useState<'stars' | 'character'>('stars');

    const TabButton: React.FC<{
        label: string;
        icon: React.ReactNode;
        isActive: boolean;
        onClick: () => void;
    }> = ({ label, icon, isActive, onClick }) => (
        <button
            onClick={onClick}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-bold transition-all ${
                isActive ? 'bg-white shadow-md text-purple-600' : 'bg-transparent text-slate-600 hover:bg-white/50'
            }`}
        >
            {icon}
            {label}
        </button>
    );

    if (!enableCharacterQuests) {
        return <StarQuests />;
    }
    
    return (
        <div className="space-y-6">
             <div className="flex justify-center gap-1.5 mb-4 bg-purple-200/50 p-1.5 rounded-xl max-w-sm mx-auto">
                <TabButton
                    label="Star Quests"
                    icon={<StarIcon className="w-5 h-5" />}
                    isActive={activeQuestTab === 'stars'}
                    onClick={() => setActiveQuestTab('stars')}
                />
                <TabButton
                    label="Character"
                    icon={<HeartIcon className="w-5 h-5" />}
                    isActive={activeQuestTab === 'character'}
                    onClick={() => setActiveQuestTab('character')}
                />
            </div>

            {activeQuestTab === 'stars' ? (
                <StarQuests />
            ) : (
                <CharacterQuestView />
            )}
        </div>
    );
};
