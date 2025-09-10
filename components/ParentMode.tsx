import React, { useState, useEffect } from 'react';
import { ParentDashboard } from './ParentDashboard';
import { AiSuggestions } from './AiSuggestions';
import { RoutineConfigurator } from './RoutineConfigurator';
import { QuestConfigurator } from './QuestConfigurator';
import { ProfileConfigurator } from './ProfileConfigurator';
import { useAppContext } from '../hooks/useAppContext';
import { ActiveRoutineId, Quest, Routine } from '../types';

interface DraftState {
    routines: Record<ActiveRoutineId, Routine>;
    quests: { weekly: Quest; monthly: Quest };
    childName: string;
    playtimeDuration: number;
    enablePlaytime: boolean;
    enableMorning: boolean;
    enableAfterSchool: boolean;
    enableBedtime: boolean;
}

// FIX: Define the ParentTab type for the different parent mode views.
type ParentTab = 'Dashboard' | 'AI Suggestions' | 'Routines' | 'Quests' | 'Profile';

export const ParentMode: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [activeTab, setActiveTab] = useState<ParentTab>('Dashboard');

    const [draftState, setDraftState] = useState<DraftState>({
        routines: state.routines,
        quests: state.quests,
        childName: state.childName,
        playtimeDuration: state.playtimeDuration,
        enablePlaytime: state.enablePlaytime,
        enableMorning: state.enableMorning,
        enableAfterSchool: state.enableAfterSchool,
        enableBedtime: state.enableBedtime,
    });
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
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
            });
        }
    }, [
        state.routines, state.quests, state.childName, state.playtimeDuration, 
        state.enablePlaytime, state.enableMorning, state.enableAfterSchool, state.enableBedtime, 
        isDirty
    ]);
    
    useEffect(() => {
        const getSerializableState = (data: any) => {
            const serializableRoutines = Object.fromEntries(
                Object.entries(data.routines).map(([routineId, routine]: [string, any]) => {
                    const { theme, ...rest } = routine;
                    return [routineId, rest];
                })
            );
            return {
                routines: serializableRoutines,
                quests: data.quests,
                childName: data.childName,
                playtimeDuration: data.playtimeDuration,
                enablePlaytime: data.enablePlaytime,
                enableMorning: data.enableMorning,
                enableAfterSchool: data.enableAfterSchool,
                enableBedtime: data.enableBedtime,
            };
        };
    
        const original = JSON.stringify(getSerializableState(state));
        const draft = JSON.stringify(getSerializableState(draftState));
    
        setIsDirty(original !== draft);
    }, [draftState, state]);


    const handleSave = () => {
        dispatch({ type: 'UPDATE_PARENT_SETTINGS', payload: draftState });
    };

    const handleDiscard = () => {
        setDraftState({
            routines: state.routines,
            quests: state.quests,
            childName: state.childName,
            playtimeDuration: state.playtimeDuration,
            enablePlaytime: state.enablePlaytime,
            enableMorning: state.enableMorning,
            enableAfterSchool: state.enableAfterSchool,
            enableBedtime: state.enableBedtime,
        });
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
                <TabButton tabName="AI Suggestions" icon="fa-wand-magic-sparkles" />
                <TabButton tabName="Routines" icon="fa-list-check" />
                <TabButton tabName="Quests" icon="fa-star" />
                <TabButton tabName="Profile" icon="fa-user-cog" />
            </div>

            <main className="bg-white p-6 rounded-2xl shadow-lg min-h-[400px]">
                {activeTab === 'Dashboard' && <ParentDashboard />}
                {activeTab === 'AI Suggestions' && <AiSuggestions />}
                {activeTab === 'Routines' && <RoutineConfigurator routines={draftState.routines} onRoutinesChange={(newRoutines) => setDraftState(s => ({ ...s, routines: newRoutines }))} />}
                {activeTab === 'Quests' && <QuestConfigurator quests={draftState.quests} onQuestsChange={(newQuests) => setDraftState(s => ({ ...s, quests: newQuests }))} />}
                {activeTab === 'Profile' && <ProfileConfigurator 
                    childName={draftState.childName} 
                    onChildNameChange={(newName) => setDraftState(s => ({ ...s, childName: newName }))}
                    playtimeDuration={draftState.playtimeDuration}
                    onPlaytimeDurationChange={(newDuration) => setDraftState(s => ({...s, playtimeDuration: newDuration}))}
                    enablePlaytime={draftState.enablePlaytime}
                    onEnablePlaytimeChange={(isEnabled) => setDraftState(s => ({...s, enablePlaytime: isEnabled}))}
                    enableMorning={draftState.enableMorning}
                    onEnableMorningChange={(isEnabled) => setDraftState(s => ({...s, enableMorning: isEnabled}))}
                    enableAfterSchool={draftState.enableAfterSchool}
                    onEnableAfterSchoolChange={(isEnabled) => setDraftState(s => ({...s, enableAfterSchool: isEnabled}))}
                    enableBedtime={draftState.enableBedtime}
                    onEnableBedtimeChange={(isEnabled) => setDraftState(s => ({...s, enableBedtime: isEnabled}))}
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