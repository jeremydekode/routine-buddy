import * as React from 'react';
import { ParentDashboard } from './ParentDashboard';
import { AiSuggestions } from './AiSuggestions';
import { RoutineConfigurator } from './RoutineConfigurator';
import { QuestConfigurator } from './QuestConfigurator';
import { ProfileConfigurator } from './ProfileConfigurator';
import { CharacterQuestConfigurator } from './CharacterQuestConfigurator';
import { useAppContext } from '../hooks/useAppContext';
import { ActiveRoutineId, Quest, Routine, CharacterQuest } from '../types';

interface DraftState {
    routines: Record<ActiveRoutineId, Routine>;
    quests: { weekly: Quest; monthly: Quest };
    childName: string;
    playtimeDuration: number;
    enablePlaytime: boolean;
    enableMorning: boolean;
    enableAfterSchool: boolean;
    enableBedtime: boolean;
    enableCharacterQuests: boolean;
    characterQuests: CharacterQuest[];
    weeklyQuestResetEnabled: boolean;
    monthlyQuestResetEnabled: boolean;
}

type ParentTab = 'Dashboard' | 'AI Suggestions' | 'Routines' | 'Quests' | 'Character' | 'Profile';

export const ParentMode: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [activeTab, setActiveTab] = React.useState<ParentTab>('Dashboard');

    const [draftState, setDraftState] = React.useState<DraftState>(() => ({
        routines: state.routines,
        quests: state.quests,
        childName: state.childName,
        playtimeDuration: state.playtimeDuration,
        enablePlaytime: state.enablePlaytime,
        enableMorning: state.enableMorning,
        enableAfterSchool: state.enableAfterSchool,
        enableBedtime: state.enableBedtime,
        enableCharacterQuests: state.enableCharacterQuests,
        characterQuests: state.characterQuests,
        weeklyQuestResetEnabled: state.weeklyQuestResetEnabled,
        monthlyQuestResetEnabled: state.monthlyQuestResetEnabled,
    }));
    const [isDirty, setIsDirty] = React.useState(false);

    // This effect synchronizes the local draft state with the global state.
    // It runs when the global state changes (e.g., after a save) or when the user discards changes.
    // The `!isDirty` check is crucial to prevent overwriting the user's edits while they are typing.
    React.useEffect(() => {
        if (!isDirty) {
            setDraftState({
                routines: state.routines,
                quests: state.quests,
                childName: state.childName,
                playtimeDuration: state.playtimeDuration,
                enablePlaytime: state.enablePlaytime,
                enableMorning: state.enableMorning,
                enableAfterSchool: state.enableAfterSchool,
                enableBedtime: state.enableBedtime,
                enableCharacterQuests: state.enableCharacterQuests,
                characterQuests: state.characterQuests,
                weeklyQuestResetEnabled: state.weeklyQuestResetEnabled,
                monthlyQuestResetEnabled: state.monthlyQuestResetEnabled,
            });
        }
    }, [state, isDirty]);

    // A single wrapper function to update the draft and mark the form as dirty.
    const setDraftAndMarkDirty = (updater: React.SetStateAction<DraftState>) => {
        setDraftState(updater);
        setIsDirty(true);
    };

    const handleSave = () => {
        dispatch({ type: 'UPDATE_PARENT_SETTINGS', payload: draftState });
        setIsDirty(false); // Mark as clean. The useEffect will then re-sync the draft from the new global state.
    };

    const handleDiscard = () => {
        setIsDirty(false); // Mark as clean. The useEffect will re-sync the draft from the original global state.
    };

    const TabButton: React.FC<{ tabName: ParentTab; icon: string; }> = ({ tabName, icon }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`flex-1 p-3 text-sm font-bold rounded-lg transition-all ${activeTab === tabName ? 'bg-purple-500 text-white shadow-md' : 'text-slate-600 hover:bg-purple-100'}`}
        >
            <i className={`fa-solid ${icon} mr-2`}></i>
            {tabName}
        </button>
    );

    return (
        <div className="pt-20 pb-8">
            <header className="text-center mb-6">
                 <h1 className="text-4xl md:text-5xl font-bold text-slate-800">Parent Zone</h1>
                 <p className="text-slate-500">Manage routines, rewards, and insights.</p>
            </header>
            
            <div className="bg-white rounded-xl shadow-md p-2 flex gap-1 sm:gap-2 mb-6 flex-wrap">
                <TabButton tabName="Dashboard" icon="fa-chart-pie" />
                <TabButton tabName="Routines" icon="fa-list-check" />
                <TabButton tabName="Quests" icon="fa-star" />
                <TabButton tabName="Character" icon="fa-heart" />
                <TabButton tabName="AI Suggestions" icon="fa-wand-magic-sparkles" />
                <TabButton tabName="Profile" icon="fa-user-cog" />
            </div>

            <main className="bg-white p-6 rounded-2xl shadow-lg min-h-[400px]">
                {activeTab === 'Dashboard' && <ParentDashboard />}
                {activeTab === 'AI Suggestions' && <AiSuggestions />}
                {activeTab === 'Routines' && <RoutineConfigurator routines={draftState.routines} onRoutinesChange={(newRoutines) => setDraftAndMarkDirty(s => ({ ...s, routines: newRoutines }))} />}
                {activeTab === 'Quests' && <QuestConfigurator 
                    quests={draftState.quests} 
                    onQuestsChange={(newQuests) => setDraftAndMarkDirty(s => ({ ...s, quests: newQuests }))} 
                    weeklyQuestResetEnabled={draftState.weeklyQuestResetEnabled}
                    onWeeklyQuestResetEnabledChange={(isEnabled) => setDraftAndMarkDirty(s => ({...s, weeklyQuestResetEnabled: isEnabled}))}
                    monthlyQuestResetEnabled={draftState.monthlyQuestResetEnabled}
                    onMonthlyQuestResetEnabledChange={(isEnabled) => setDraftAndMarkDirty(s => ({...s, monthlyQuestResetEnabled: isEnabled}))}
                />}
                {activeTab === 'Character' && <CharacterQuestConfigurator quests={draftState.characterQuests} onQuestsChange={(newQuests) => setDraftAndMarkDirty(s => ({...s, characterQuests: newQuests}))} />}
                {activeTab === 'Profile' && <ProfileConfigurator 
                    childName={draftState.childName} 
                    onChildNameChange={(newName) => setDraftAndMarkDirty(s => ({ ...s, childName: newName }))}
                    playtimeDuration={draftState.playtimeDuration}
                    onPlaytimeDurationChange={(newDuration) => setDraftAndMarkDirty(s => ({...s, playtimeDuration: newDuration}))}
                    enablePlaytime={draftState.enablePlaytime}
                    onEnablePlaytimeChange={(isEnabled) => setDraftAndMarkDirty(s => ({...s, enablePlaytime: isEnabled}))}
                    enableMorning={draftState.enableMorning}
                    onEnableMorningChange={(isEnabled) => setDraftAndMarkDirty(s => ({...s, enableMorning: isEnabled}))}
                    enableAfterSchool={draftState.enableAfterSchool}
                    onEnableAfterSchoolChange={(isEnabled) => setDraftAndMarkDirty(s => ({...s, enableAfterSchool: isEnabled}))}
                    enableBedtime={draftState.enableBedtime}
                    onEnableBedtimeChange={(isEnabled) => setDraftAndMarkDirty(s => ({...s, enableBedtime: isEnabled}))}
                    enableCharacterQuests={draftState.enableCharacterQuests}
                    onEnableCharacterQuestsChange={(isEnabled) => setDraftAndMarkDirty(s => ({...s, enableCharacterQuests: isEnabled}))}
                />}
            </main>
             {isDirty && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-sm shadow-t-lg z-30 transition-transform duration-300 animate-slide-up">
                     <style>{`
                        @keyframes slide-up {
                            from { transform: translateY(100%); }
                            to { transform: translateY(0); }
                        }
                        .animate-slide-up { animation: slide-up 0.3s ease-out; }
                    `}</style>
                    <div className="max-w-md md:max-w-3xl mx-auto flex items-center justify-between">
                        <p className="font-bold text-slate-700">You have unsaved changes!</p>
                        <div className="flex gap-4">
                            <button onClick={handleDiscard} className="font-bold text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-200 transition">Discard</button>
                            <button onClick={handleSave} className="font-bold text-white bg-purple-500 px-4 py-2 rounded-lg hover:bg-purple-600 transition shadow-md">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};