
import * as React from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { ParentDashboard } from './ParentDashboard';
import { RoutineConfigurator } from './RoutineConfigurator';
import { QuestConfigurator } from './QuestConfigurator';
import { ProfileConfigurator } from './ProfileConfigurator';
import { CharacterQuestConfigurator } from './CharacterQuestConfigurator';
import { AiSuggestions } from './AiSuggestions';
import { PasswordModal } from './PasswordModal';

type ParentTab = 'dashboard' | 'routines' | 'quests' | 'character' | 'ai' | 'profile';

const TABS: { id: ParentTab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-solid fa-chart-pie' },
    { id: 'routines', label: 'Routines', icon: 'fa-solid fa-list-check' },
    { id: 'quests', label: 'Star Quests', icon: 'fa-solid fa-star' },
    { id: 'character', label: 'Character', icon: 'fa-solid fa-heart' },
    { id: 'ai', label: 'AI Ideas', icon: 'fa-solid fa-wand-magic-sparkles' },
    { id: 'profile', label: 'Settings', icon: 'fa-solid fa-user-gear' },
];

export const ParentMode: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const [activeTab, setActiveTab] = React.useState<ParentTab>('dashboard');

    if (state.showPasswordModal) {
        return <PasswordModal />;
    }
    
    const TabButton: React.FC<{ tab: typeof TABS[0] }> = ({ tab }) => (
        <button
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center text-center gap-1 p-2 rounded-lg transition-colors w-1/5 flex-grow ${
                activeTab === tab.id ? 'bg-purple-100 text-purple-600' : 'text-slate-500 hover:bg-slate-100'
            }`}
        >
            <i className={`${tab.icon} text-xl`}></i>
            <span className="text-xs font-bold">{tab.label}</span>
        </button>
    );

    return (
        <div className="pt-20 pb-28">
            <header className="text-center mb-8">
                <h1 className="text-3xl font-bold text-slate-700">Parent Zone</h1>
                <p className="text-slate-500">Welcome back!</p>
            </header>

            <div className="bg-white/70 backdrop-blur-md p-4 sm:p-6 rounded-2xl shadow-lg min-h-[400px]">
                {activeTab === 'dashboard' && <ParentDashboard />}
                {activeTab === 'routines' && <RoutineConfigurator routines={state.routines} onRoutinesChange={routines => dispatch({ type: 'SET_STATE', payload: { routines } })} />}
                {activeTab === 'quests' && <QuestConfigurator quests={state.quests} onQuestsChange={quests => dispatch({ type: 'SET_STATE', payload: { quests } })} />}
                {activeTab === 'character' && <CharacterQuestConfigurator quests={state.characterQuests} onQuestsChange={quests => dispatch({ type: 'SET_STATE', payload: { characterQuests: quests } })} />}
                {activeTab === 'ai' && <AiSuggestions />}
                {activeTab === 'profile' && <ProfileConfigurator
                    childName={state.childName} onChildNameChange={childName => dispatch({ type: 'SET_STATE', payload: { childName } })}
                    playtimeDuration={state.playtimeDuration} onPlaytimeDurationChange={playtimeDuration => dispatch({ type: 'SET_STATE', payload: { playtimeDuration } })}
                    enablePlaytime={state.enablePlaytime} onEnablePlaytimeChange={enablePlaytime => dispatch({ type: 'SET_STATE', payload: { enablePlaytime } })}
                    enableMorning={state.enableMorning} onEnableMorningChange={enableMorning => dispatch({ type: 'SET_STATE', payload: { enableMorning } })}
                    enableAfterSchool={state.enableAfterSchool} onEnableAfterSchoolChange={enableAfterSchool => dispatch({ type: 'SET_STATE', payload: { enableAfterSchool } })}
                    enableBedtime={state.enableBedtime} onEnableBedtimeChange={enableBedtime => dispatch({ type: 'SET_STATE', payload: { enableBedtime } })}
                    enableCharacterQuests={state.enableCharacterQuests} onEnableCharacterQuestsChange={enableCharacterQuests => dispatch({ type: 'SET_STATE', payload: { enableCharacterQuests } })}
                />}
            </div>
            
            <footer className="fixed bottom-0 left-0 right-0 p-3 bg-transparent z-20">
                <div className="max-w-md md:max-w-3xl mx-auto flex flex-wrap justify-center gap-1 bg-white/60 backdrop-blur-md rounded-2xl p-1.5 shadow-lg">
                    {TABS.map(tab => <TabButton key={tab.id} tab={tab} />)}
                </div>
            </footer>
        </div>
    );
};
