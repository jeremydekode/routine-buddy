
import * as React from 'react';
import { CharacterQuest, CharacterQuestCategory } from '../types';
import { CHARACTER_QUEST_CATEGORIES, CATEGORY_ICONS } from '../constants';

interface CharacterQuestEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (questData: Omit<CharacterQuest, 'id' | 'progress' | 'lastCompletedDate'> & { id?: string }) => void;
    questToEdit: CharacterQuest | null;
}

export const CharacterQuestEditorModal: React.FC<CharacterQuestEditorModalProps> = ({ isOpen, onClose, onSave, questToEdit }) => {
    const [title, setTitle] = React.useState('');
    const [category, setCategory] = React.useState<CharacterQuestCategory>('Kindness');
    const [goal, setGoal] = React.useState('5');

    React.useEffect(() => {
        if (isOpen) {
            if (questToEdit) {
                setTitle(questToEdit.title);
                setCategory(questToEdit.category);
                setGoal(String(questToEdit.goal));
            } else {
                // Reset for new quest
                setTitle('');
                setCategory('Kindness');
                setGoal('5');
            }
        }
    }, [questToEdit, isOpen]);

    const handleSave = () => {
        const goalNum = parseInt(goal, 10);
        if (!title.trim()) {
            alert('Quest title is required.');
            return;
        }
        if (isNaN(goalNum) || goalNum <= 0) {
            alert('Goal must be a positive number.');
            return;
        }
        onSave({
            id: questToEdit?.id,
            title: title.trim(),
            category,
            goal: goalNum,
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">{questToEdit ? 'Edit Character Quest' : 'Add Character Quest'}</h2>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-600">Quest Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g., Practice Patience"
                            className="w-full mt-1 p-2 border border-slate-300 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-600">Category</label>
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                            {CHARACTER_QUEST_CATEGORIES.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setCategory(cat)}
                                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                                        category === cat
                                            ? 'border-purple-500 bg-purple-50'
                                            : 'border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    <div className="w-8 h-8">{CATEGORY_ICONS[cat]}</div>
                                    <span className="font-semibold text-slate-700 text-sm">{cat}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-600">Goal (how many times?)</label>
                        <input
                            type="number"
                            value={goal}
                            onChange={e => setGoal(e.target.value)}
                            min="1"
                            placeholder="e.g., 5"
                            className="w-full mt-1 p-2 border border-slate-300 rounded-lg"
                        />
                    </div>
                </div>
                <div className="mt-8 flex justify-end gap-4">
                    <button onClick={onClose} className="font-bold text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-200 transition">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="font-bold text-white bg-purple-500 px-4 py-2 rounded-lg hover:bg-purple-600 transition shadow-md">
                        {questToEdit ? 'Save Changes' : 'Add Quest'}
                    </button>
                </div>
            </div>
        </div>
    );
};