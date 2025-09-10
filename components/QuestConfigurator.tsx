import React from 'react';
import { Quest } from '../types';

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
        // Persist 0 to draft state if input is empty/invalid, which will be rendered as an empty string in the input.
        onUpdate({ ...quest, goal: isNaN(newGoal) || newGoal < 0 ? 0 : newGoal });
    };

    return (
        <div className={`p-4 rounded-xl ${colors.bg}`}>
            <h3 className={`font-bold text-lg ${colors.text} mb-3`}>{title}</h3>
            <div className="space-y-3">
                <div>
                    <label className="text-sm font-medium text-slate-600">Quest Name</label>
                    <input
                        type="text"
                        value={quest.name}
                        onChange={handleNameChange}
                        className="w-full mt-1 p-2 border border-slate-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                        placeholder="e.g., Toy Store Trip"
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

interface QuestConfiguratorProps {
    quests: { weekly: Quest; monthly: Quest };
    onQuestsChange: (quests: { weekly: Quest; monthly: Quest }) => void;
}

export const QuestConfigurator: React.FC<QuestConfiguratorProps> = ({ quests, onQuestsChange }) => {
    
    const handleUpdateQuest = (quest: Quest) => {
        const newQuests = { ...quests };
        if (quest.id === 'weekly' || quest.id === 'monthly') {
            newQuests[quest.id] = quest;
        }
        onQuestsChange(newQuests);
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
        </div>
    );
};