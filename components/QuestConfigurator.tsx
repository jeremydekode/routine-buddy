import * as React from 'react';
import { Quest } from '../types';
import { TrophyIcon, ImageIcon } from './icons/Icons';
import { ToggleSwitch } from './ToggleSwitch';
import { generateQuestImage } from '../services/geminiService';

interface QuestEditorCardProps {
    quest: Quest;
    onUpdate: (quest: Quest) => void;
    title: string;
    colors: { bg: string, text: string }
}

const QuestEditorCard: React.FC<QuestEditorCardProps> = ({ quest, onUpdate, title, colors }) => {
    const [isGenerating, setIsGenerating] = React.useState(false);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdate({ ...quest, name: e.target.value });
    };
    
    const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdate({ ...quest, description: e.target.value });
    };

    const handleGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newGoal = parseInt(e.target.value, 10);
        onUpdate({ ...quest, goal: isNaN(newGoal) || newGoal < 0 ? 0 : newGoal });
    };

    const handleGenerateImage = async () => {
        if (!quest.description) {
            alert("Please provide a reward description first.");
            return;
        }
        setIsGenerating(true);
        try {
            const imageUrl = await generateQuestImage(quest.description);
            if (imageUrl) {
                onUpdate({ ...quest, imageUrl });
            } else {
                alert("Sorry, the image could not be generated. Please try again.");
            }
        } catch (error) {
             alert("An error occurred while generating the image.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className={`p-4 rounded-xl ${colors.bg}`}>
            <h3 className={`font-bold text-lg ${colors.text} mb-3 flex items-center gap-2`}><TrophyIcon className="w-5 h-5" /> {title}</h3>
            <div className="space-y-3">
                <div>
                    <label className="text-sm font-medium text-slate-600">Quest Name</label>
                    <input
                        type="text"
                        value={quest.name}
                        onChange={handleNameChange}
                        className="w-full mt-1 p-2 border border-slate-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                        placeholder="e.g., Weekly Wonder"
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-slate-600">Reward Description</label>
                    <input
                        type="text"
                        value={quest.description}
                        onChange={handleDescriptionChange}
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
                <div className="pt-2">
                     <label className="text-sm font-medium text-slate-600 mb-2 block">Reward Image</label>
                     <div className="aspect-square w-full bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200">
                         {isGenerating ? (
                             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                         ) : quest.imageUrl ? (
                             <img src={quest.imageUrl} alt={quest.description} className="w-full h-full object-cover" />
                         ) : (
                             <ImageIcon className="w-12 h-12 text-slate-400" />
                         )}
                     </div>
                     <button
                        onClick={handleGenerateImage}
                        disabled={isGenerating}
                        className="w-full mt-2 bg-purple-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-600 transition disabled:bg-purple-300 flex items-center justify-center gap-2"
                    >
                        <i className="fa-solid fa-wand-magic-sparkles"></i>
                        {isGenerating ? 'Generating...' : 'Generate with AI'}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface QuestConfiguratorProps {
    quests: { weekly: Quest; monthly: Quest };
    onQuestsChange: (quests: { weekly: Quest; monthly: Quest }) => void;
    weeklyQuestResetEnabled: boolean;
    onWeeklyQuestResetEnabledChange: (enabled: boolean) => void;
    monthlyQuestResetEnabled: boolean;
    onMonthlyQuestResetEnabledChange: (enabled: boolean) => void;
}

export const QuestConfigurator: React.FC<QuestConfiguratorProps> = ({ 
    quests, 
    onQuestsChange,
    weeklyQuestResetEnabled,
    onWeeklyQuestResetEnabledChange,
    monthlyQuestResetEnabled,
    onMonthlyQuestResetEnabledChange 
}) => {
    
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

            <div className="mt-8 pt-6 border-t border-slate-200">
                <h3 className="text-xl font-bold text-slate-700 mb-4">Quest Resets</h3>
                <div className="space-y-4 bg-slate-50 p-4 rounded-xl">
                    <ToggleSwitch
                        label="Enable Weekly Reset"
                        checked={weeklyQuestResetEnabled}
                        onChange={onWeeklyQuestResetEnabledChange}
                        description="Progress for the weekly quest will reset every Monday at 12 AM."
                    />
                    <ToggleSwitch
                        label="Enable Monthly Reset"
                        checked={monthlyQuestResetEnabled}
                        onChange={onMonthlyQuestResetEnabledChange}
                        description="Progress for the monthly quest will reset on the 1st of each month at 12 AM."
                    />
                </div>
            </div>
        </div>
    );
};