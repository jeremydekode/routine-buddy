

import * as React from 'react';
import { Quest } from '../types';
import { useAppContext } from '../hooks/useAppContext';

interface QuestEditorCardProps {
    quest: Quest;
    onUpdate: (quest: Quest) => void;
    title: string;
    colors: { bg: string, text: string }
}

const QuestEditorCard: React.FC<QuestEditorCardProps> = ({ quest, onUpdate, title, colors }) => {

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdate({ ...quest, name: e.target.value });
    };

    const handleGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newGoal = parseInt(e.target.value, 10);
        onUpdate({ ...quest, goal: isNaN(newGoal) || newGoal < 0 ? 0 : newGoal });
    };

    return (
        <div className={`p-4 rounded-xl ${colors.bg}`}>
            <h3 className={`font-bold text-lg ${colors.text} mb-3`}>{title}</h3>
            <div className="space-y-3">
                <div>
                    <label className="text-sm font-medium text-slate-600">Reward</label>
                    <input
                        type="text"
                        value={quest.name}
                        onChange={handleNameChange}
                        className="w-full mt-1 p-2 border border-slate-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                        placeholder="e.g., A new LEGO set"
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-600">Stars Required</label>
                    <input
                        type="number"
                        value={quest.goal === 0 ? '' : quest.goal}
                        onChange={handleGoalChange}
                        min="1"
                        className="w-full mt-1 p-2 border border-slate-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                    />
                </div>
            </div>
        </div>
    );
};

const ManualAdjustment: React.FC<{
    questId: 'weekly' | 'monthly',
    quest: Quest,
    lastResetDate: string | null,
    progressOverride: number | null
}> = ({ questId, quest, lastResetDate, progressOverride }) => {
    const { state, dispatch } = useAppContext();
    const { starAdjustmentLog } = state;
    const [overrideValue, setOverrideValue] = React.useState<string>(progressOverride?.toString() ?? '');

    const calculatedProgress = React.useMemo(() => {
        if (questId === 'weekly') {
            if (!lastResetDate) return starAdjustmentLog.reduce((sum, log) => sum + log.amount, 0);
            return starAdjustmentLog
                .filter(log => new Date(log.date) >= new Date(lastResetDate))
                .reduce((sum, log) => sum + log.amount, 0);
        } else { // monthly
             if (!lastResetDate) {
                return starAdjustmentLog
                    .filter(log => log.amount > 0 || (log.amount < 0 && !log.reason.startsWith('Reward for')))
                    .reduce((sum, log) => sum + log.amount, 0);
            }
            return starAdjustmentLog
                .filter(log => new Date(log.date) >= new Date(lastResetDate))
                .reduce((sum, log) => {
                     if (log.amount > 0) return sum + log.amount;
                     if (log.amount < 0 && !log.reason.startsWith('Reward for')) return sum + log.amount;
                     return sum;
                }, 0);
        }
    }, [starAdjustmentLog, lastResetDate, questId]);

    const handleSetOverride = () => {
        const value = parseInt(overrideValue, 10);
        if (!isNaN(value)) {
            dispatch({ type: 'SET_QUEST_PROGRESS_OVERRIDE', payload: { questId, value } });
        }
    };

    const handleClearOverride = () => {
        setOverrideValue('');
        dispatch({ type: 'SET_QUEST_PROGRESS_OVERRIDE', payload: { questId, value: null } });
    };

    React.useEffect(() => {
        setOverrideValue(progressOverride?.toString() ?? '');
    }, [progressOverride]);

    return (
        <div>
            <h4 className="font-medium text-slate-700">Adjust {questId === 'weekly' ? 'Weekly' : 'Monthly'} Progress</h4>
            <p className="text-xs text-slate-500 mb-2">
                Current calculated progress: <strong>{calculatedProgress} / {quest.goal} stars</strong>. 
                {progressOverride !== null && <span className="text-purple-600 font-bold"> (Overridden to {progressOverride})</span>}
            </p>
            <div className="flex gap-2 items-center">
                <input
                    type="number"
                    value={overrideValue}
                    onChange={e => setOverrideValue(e.target.value)}
                    placeholder="Set stars..."
                    className="flex-grow p-2 border border-slate-300 rounded-lg text-sm"
                />
                <button onClick={handleSetOverride} className="bg-purple-500 text-white font-bold py-2 px-3 rounded-lg hover:bg-purple-600 transition text-sm">Set</button>
            </div>
             {progressOverride !== null && (
                <button onClick={handleClearOverride} className="text-xs text-slate-500 hover:text-red-500 font-semibold mt-2 transition">
                    Clear Override
                </button>
            )}
        </div>
    );
}

interface QuestConfiguratorProps {
    quests: { weekly: Quest; monthly: Quest };
    onQuestsChange: (quests: { weekly: Quest; monthly: Quest }) => void;
}

export const QuestConfigurator: React.FC<QuestConfiguratorProps> = ({ 
    quests, 
    onQuestsChange,
}) => {
    const { state, dispatch } = useAppContext();
    const { 
        weeklyQuestLastResetDate, 
        monthlyQuestLastResetDate, 
        weeklyQuestProgressOverride, 
        monthlyQuestProgressOverride 
    } = state;

    const handleUpdateQuest = (quest: Quest) => {
        const newQuests = { ...quests };
        if (quest.id === 'weekly' || quest.id === 'monthly') {
            newQuests[quest.id] = quest;
        }
        onQuestsChange(newQuests);
    };

    const handleReset = (questId: 'weekly' | 'monthly') => {
        const questName = questId === 'weekly' ? 'weekly' : 'monthly';
        if (window.confirm(`Are you sure you want to reset the ${questName} quest progress? This will start a new period and cannot be undone.`)) {
            dispatch({ type: 'MANUAL_RESET_QUEST', payload: { questId } });
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-700 mb-4">Customize Quests</h2>
            <p className="text-slate-500 mb-6">Personalize the rewards and goals to keep your child motivated!</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <QuestEditorCard
                    title="Weekly Quest"
                    quest={quests.weekly}
                    onUpdate={handleUpdateQuest}
                    colors={{ bg: 'bg-amber-50', text: 'text-amber-600' }}
                />
                <QuestEditorCard
                    title="Monthly Quest"
                    quest={quests.monthly}
                    onUpdate={handleUpdateQuest}
                    colors={{ bg: 'bg-sky-50', text: 'text-sky-600' }}
                />
            </div>

             <div className="mt-8 pt-6 border-t border-slate-200">
                <h3 className="text-xl font-bold text-slate-700 mb-4">Manual Progress Adjustment</h3>
                 <div className="space-y-4 bg-slate-50 p-4 rounded-xl">
                    <ManualAdjustment 
                        questId="weekly" 
                        quest={quests.weekly}
                        lastResetDate={weeklyQuestLastResetDate} 
                        progressOverride={weeklyQuestProgressOverride} 
                    />
                    <div className="pt-4 border-t border-slate-200">
                         <ManualAdjustment 
                            questId="monthly" 
                            quest={quests.monthly}
                            lastResetDate={monthlyQuestLastResetDate} 
                            progressOverride={monthlyQuestProgressOverride} 
                        />
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200">
                <h3 className="text-xl font-bold text-slate-700 mb-4">Quest Resets</h3>
                <div className="space-y-4 bg-slate-50 p-4 rounded-xl">
                    <div>
                        <h4 className="font-medium text-slate-700">Reset Weekly Quest</h4>
                        <p className="text-xs text-slate-500 mb-3">Manually start a new weekly period. This will reset progress, claimed status, and any manual adjustments.</p>
                        <button
                            onClick={() => handleReset('weekly')}
                            className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition text-sm"
                        >
                            Reset Weekly Now
                        </button>
                    </div>
                     <div className="pt-4 border-t border-slate-200">
                        <h4 className="font-medium text-slate-700">Reset Monthly Quest</h4>
                        <p className="text-xs text-slate-500 mb-3">Manually start a new monthly period. This will reset progress, claimed status, and any manual adjustments.</p>
                        <button
                            onClick={() => handleReset('monthly')}
                            className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition text-sm"
                        >
                            Reset Monthly Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};