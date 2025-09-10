import React, { useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { CharacterQuest } from '../types';
import { CATEGORY_ICONS } from '../constants';
import { PlusIcon, StarIcon } from './icons/Icons';

const QuestCompleteAnimation: React.FC = () => (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="animate-burst">
            <StarIcon className="w-16 h-16 text-yellow-400" />
        </div>
    </div>
);


const CharacterQuestCard: React.FC<{ quest: CharacterQuest }> = ({ quest }) => {
    const { dispatch } = useAppContext();
    const [isAnimating, setIsAnimating] = useState(false);
    const today = new Date().toISOString().split('T')[0];
    const isCompletedToday = quest.lastCompletedDate === today;

    const handleIncrement = () => {
        if (!isCompletedToday) {
            dispatch({ type: 'INCREMENT_CHARACTER_QUEST', payload: quest.id });
            setIsAnimating(true);
            setTimeout(() => setIsAnimating(false), 800);
        }
    };
    
    const progressPercentage = (quest.progress / quest.goal) * 100;
    
    return (
        <div className="bg-white/80 p-4 rounded-2xl shadow-lg relative overflow-hidden">
             <style>{`
                @keyframes burst {
                    0% { transform: scale(0); opacity: 0.8; }
                    50% { transform: scale(1.5); opacity: 1; }
                    100% { transform: scale(1.2); opacity: 0; }
                }
                .animate-burst { animation: burst 0.8s ease-out forwards; }
            `}</style>
            {isAnimating && <QuestCompleteAnimation />}
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 p-2">
                    {CATEGORY_ICONS[quest.category]}
                </div>
                <div className="flex-grow">
                    <h3 className="font-bold text-lg text-slate-700">{quest.title}</h3>
                    <p className="text-sm text-slate-500 font-semibold">{quest.category}</p>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 rounded-full h-2.5 mt-2">
                        <div 
                            className="bg-green-400 h-2.5 rounded-full transition-all duration-500" 
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                    </div>
                     <p className="text-xs text-slate-500 font-bold mt-1 text-right">{quest.progress} / {quest.goal}</p>
                </div>
                <div className="flex-shrink-0">
                    <button
                        onClick={handleIncrement}
                        disabled={isCompletedToday}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 transform ${
                            isCompletedToday 
                            ? 'bg-green-400 text-white cursor-default' 
                            : 'bg-purple-500 text-white hover:bg-purple-600 hover:scale-105'
                        }`}
                        aria-label={`Complete ${quest.title} for today`}
                    >
                        {isCompletedToday ? <i className="fa-solid fa-check text-2xl"></i> : <PlusIcon className="w-8 h-8"/>}
                    </button>
                </div>
            </div>
        </div>
    );
};


export const CharacterQuestView: React.FC = () => {
    const { state } = useAppContext();
    const { characterQuests, childName } = state;
    
    return (
        <div>
            <div className="text-center mb-6">
                 <h2 className="text-2xl font-bold text-slate-700">Character Quests</h2>
                 <p className="text-slate-500">Let's be the best {childName} we can be!</p>
            </div>
            {characterQuests.length > 0 ? (
                <div className="space-y-4">
                    {characterQuests.map(quest => (
                        <CharacterQuestCard key={quest.id} quest={quest} />
                    ))}
                </div>
            ) : (
                <div className="text-center p-8 bg-white/50 rounded-2xl shadow-lg">
                    <p className="text-lg font-semibold text-slate-600">No character quests have been set up yet.</p>
                </div>
            )}
        </div>
    );
};