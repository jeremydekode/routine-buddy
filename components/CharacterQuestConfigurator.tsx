
import * as React from 'react';
import { CharacterQuest } from '../types';
import { PlusIcon, TrashIcon, PencilIcon, HeartIcon } from './icons/Icons';
import { CharacterQuestEditorModal } from './CharacterQuestEditorModal';
import { CATEGORY_ICONS } from '../constants';

interface CharacterQuestConfiguratorProps {
    quests: CharacterQuest[];
    onQuestsChange: (quests: CharacterQuest[]) => void;
}

export const CharacterQuestConfigurator: React.FC<CharacterQuestConfiguratorProps> = ({ quests, onQuestsChange }) => {
    const [isEditorOpen, setIsEditorOpen] = React.useState(false);
    const [questToEdit, setQuestToEdit] = React.useState<CharacterQuest | null>(null);

    const handleOpenEditorForNew = () => {
        setQuestToEdit(null);
        setIsEditorOpen(true);
    };

    const handleOpenEditorForEdit = (quest: CharacterQuest) => {
        setQuestToEdit(quest);
        setIsEditorOpen(true);
    };

    const handleSaveQuest = (questData: Omit<CharacterQuest, 'id' | 'progress' | 'lastCompletedDate'> & { id?: string }) => {
        if (questData.id) { // Editing existing quest
            const updatedQuests = quests.map(q => q.id === questData.id ? { ...q, ...questData } : q);
            onQuestsChange(updatedQuests as CharacterQuest[]);
        } else { // Adding new quest
            const newQuest: CharacterQuest = {
                ...questData,
                id: new Date().toISOString(),
                progress: 0,
                lastCompletedDate: null,
            };
            onQuestsChange([...quests, newQuest]);
        }
    };

    const handleDeleteQuest = (questId: string) => {
        if (window.confirm('Are you sure you want to delete this character quest?')) {
            onQuestsChange(quests.filter(q => q.id !== questId));
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-700 mb-4 flex items-center gap-2"><HeartIcon className="w-6 h-6 text-pink-500" /> Character Quests</h2>
            <p className="text-slate-500 mb-6">Create quests to encourage virtues like patience, kindness, and responsibility.</p>
            
            <div className="space-y-3 mb-6">
                {quests.length > 0 ? (
                    quests.map(quest => (
                        <div key={quest.id} className="flex items-center bg-slate-50 p-3 rounded-lg">
                            <span className="mr-3 w-6 h-6">{CATEGORY_ICONS[quest.category]}</span>
                            <div className="flex-grow">
                                <p className="font-semibold text-slate-800">{quest.title}</p>
                                <p className="text-xs text-slate-500">Goal: Complete {quest.goal} times</p>
                            </div>
                            <button onClick={() => handleOpenEditorForEdit(quest)} className="text-slate-400 hover:text-purple-500 transition-colors p-2">
                                <PencilIcon className="w-5 h-5" />
                            </button>
                            <button onClick={() => handleDeleteQuest(quest.id)} className="text-slate-400 hover:text-red-500 transition-colors p-2">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-slate-500 py-4">No character quests created yet.</p>
                )}
            </div>

            <button onClick={handleOpenEditorForNew} className="w-full bg-pink-100 text-pink-700 font-bold py-3 px-4 rounded-lg hover:bg-pink-200 transition flex items-center justify-center gap-2">
                <PlusIcon className="w-5 h-5" />
                Add New Character Quest
            </button>

            <CharacterQuestEditorModal
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                onSave={handleSaveQuest}
                questToEdit={questToEdit}
            />
        </div>
    );
};