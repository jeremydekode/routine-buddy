
import * as React from 'react';
import { AppState, Mode, ActiveRoutineId, QuestId } from '../types';
import { INITIAL_ROUTINES, INITIAL_QUESTS } from '../constants';
import { supabase, getUserProfile, updateUserProfile } from '../services/supabase';
import { Session } from '@supabase/supabase-js';

// Helper to get today's date string in YYYY-MM-DD format, respecting local timezone.
const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const PASSWORD_KEY = 'routine-buddy-pin';
const APP_STATE_KEY = 'routine-buddy-app-state';

// Define Action types
type Action =
    | { type: 'SET_STATE'; payload: Partial<AppState> }
    | { type: 'TOGGLE_MODE' }
    | { type: 'SET_ACTIVE_ROUTINE'; payload: AppState['activeRoutine'] }
    | { type: 'SET_SELECTED_DATE'; payload: string }
    | { type: 'TOGGLE_TASK_COMPLETION'; payload: { taskId: string; date: string } }
    | { type: 'COMPLETE_ROUTINE'; payload: { routineId: ActiveRoutineId; date: string } }
    | { type: 'ADJUST_STARS'; payload: { amount: number; reason: string } }
    | { type: 'REQUEST_QUEST_APPROVAL'; payload: { questId: QuestId } }
    | { type: 'APPROVE_QUEST'; payload: { questId: QuestId } }
    | { type: 'REJECT_QUEST'; payload: { questId: QuestId } }
    | { type: 'MANUAL_RESET_QUEST'; payload: { questId: QuestId } }
    | { type: 'SET_QUEST_PROGRESS_OVERRIDE'; payload: { questId: QuestId; value: number | null } }
    | { type: 'START_PLAYTIME' }
    | { type: 'INCREMENT_CHARACTER_QUEST', payload: string }
    | { type: 'COMPLETE_ONBOARDING' }
    | { type: 'SHOW_PASSWORD_MODAL' }
    | { type: 'HIDE_PASSWORD_MODAL' }
    | { type: 'AUTH_STATE_CHANGE'; payload: { session: Session | null; isGuest: boolean } }
    | { type: 'SIGN_IN_AS_GUEST' };


// Initial state
const INITIAL_STATE: AppState = {
    mode: Mode.Child,
    selectedDate: getLocalDateString(new Date()),
    activeRoutine: 'Morning',
    routines: INITIAL_ROUTINES,
    quests: INITIAL_QUESTS,
    characterQuests: [],
    taskHistory: {},
    starCount: 0,
    weeklyQuestPending: false,
    monthlyQuestPending: false,
    weeklyQuestClaimedDate: null,
    monthlyQuestClaimedDate: null,
    weeklyQuestLastResetDate: new Date().toISOString(),
    monthlyQuestLastResetDate: new Date().toISOString(),
    weeklyQuestProgressOverride: null,
    monthlyQuestProgressOverride: null,
    starAdjustmentLog: [],
    childName: 'Buddy',
    playtimeDuration: 15,
    playtimeStarted: false,
    enablePlaytime: true,
    enableMorning: true,
    enableAfterSchool: true,
    enableBedtime: true,
    enableCharacterQuests: true,
    isLoading: true,
    isLoggedIn: false,
    showPasswordModal: false,
    isGuest: false,
    showOnboarding: true,
};

const appReducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        case 'SET_STATE':
            return { ...state, ...action.payload, isLoading: false };
        
        case 'TOGGLE_MODE': {
            if (state.mode === Mode.Child) {
                const pin = localStorage.getItem(PASSWORD_KEY);
                if (pin) {
                    return { ...state, showPasswordModal: true };
                }
                return { ...state, mode: Mode.Parent };
            }
            return { ...state, mode: Mode.Child, showPasswordModal: false };
        }
        
        case 'SHOW_PASSWORD_MODAL':
            return { ...state, showPasswordModal: true };
        
        case 'HIDE_PASSWORD_MODAL':
            return { ...state, showPasswordModal: false };
        
        case 'SET_ACTIVE_ROUTINE':
            return { ...state, activeRoutine: action.payload };
            
        case 'SET_SELECTED_DATE':
            return { ...state, selectedDate: action.payload };

        case 'TOGGLE_TASK_COMPLETION': {
            const { taskId, date } = action.payload;
            const completedTasks = state.taskHistory[date] ? [...state.taskHistory[date]] : [];
            const taskIndex = completedTasks.indexOf(taskId);

            if (taskIndex > -1) {
                completedTasks.splice(taskIndex, 1);
            } else {
                completedTasks.push(taskId);
            }

            return {
                ...state,
                taskHistory: { ...state.taskHistory, [date]: completedTasks },
            };
        }
        
        case 'COMPLETE_ROUTINE': {
             // Logic to prevent giving a star if it was already given for this routine on this day.
            const routineCompletionReason = `Routine Complete: ${action.payload.routineId}`;
            const alreadyAwarded = state.starAdjustmentLog.some(log => 
                log.reason === routineCompletionReason && getLocalDateString(new Date(log.date)) === action.payload.date
            );
            if (alreadyAwarded) return state;

            return {
                ...state,
                starCount: state.starCount + 1,
                starAdjustmentLog: [...state.starAdjustmentLog, {
                    id: new Date().toISOString(),
                    date: new Date().toISOString(),
                    amount: 1,
                    reason: routineCompletionReason
                }]
            };
        }
        
        case 'ADJUST_STARS': {
             return {
                ...state,
                starCount: Math.max(0, state.starCount + action.payload.amount),
                starAdjustmentLog: [...state.starAdjustmentLog, {
                    id: new Date().toISOString(),
                    date: new Date().toISOString(),
                    ...action.payload,
                }]
            };
        }
        
        case 'REQUEST_QUEST_APPROVAL': {
            const { questId } = action.payload;
            return {
                ...state,
                [`${questId}QuestPending`]: true,
            };
        }

        case 'APPROVE_QUEST': {
            const { questId } = action.payload;
            const quest = state.quests[questId];
            const rewardAmount = questId === 'weekly' ? 5 : 15; // Example reward amounts
            return {
                ...state,
                starCount: state.starCount + rewardAmount,
                [`${questId}QuestPending`]: false,
                [`${questId}QuestClaimedDate`]: getLocalDateString(new Date()),
                starAdjustmentLog: [...state.starAdjustmentLog, {
                    id: new Date().toISOString(),
                    date: new Date().toISOString(),
                    amount: rewardAmount,
                    reason: `Reward for "${quest.name}"`
                }]
            };
        }

        case 'REJECT_QUEST': {
            const { questId } = action.payload;
            return {
                ...state,
                [`${questId}QuestPending`]: false,
            };
        }

        case 'MANUAL_RESET_QUEST': {
            const { questId } = action.payload;
            return {
                ...state,
                [`${questId}QuestPending`]: false,
                [`${questId}QuestClaimedDate`]: null,
                [`${questId}QuestLastResetDate`]: new Date().toISOString(),
                [`${questId}QuestProgressOverride`]: null, // Clear override on reset
            };
        }

        case 'SET_QUEST_PROGRESS_OVERRIDE': {
            const { questId, value } = action.payload;
            return {
                ...state,
                [`${questId}QuestProgressOverride`]: value,
            };
        }

        case 'START_PLAYTIME':
            return { ...state, playtimeStarted: true };
            
        case 'INCREMENT_CHARACTER_QUEST': {
            const questId = action.payload;
            let starAwarded = false;
            const newQuests = state.characterQuests.map(q => {
                if (q.id === questId) {
                    const newProgress = q.progress + 1;
                    if (newProgress >= q.goal) {
                        starAwarded = true;
                    }
                    return { ...q, progress: newProgress, lastCompletedDate: getLocalDateString(new Date()) };
                }
                return q;
            });
            const quest = state.characterQuests.find(q => q.id === questId);
            if (starAwarded && quest) {
                 return {
                    ...state,
                    characterQuests: newQuests,
                    starCount: state.starCount + 1,
                    starAdjustmentLog: [...state.starAdjustmentLog, {
                        id: new Date().toISOString(),
                        date: new Date().toISOString(),
                        amount: 1,
                        reason: `Character Quest: ${quest.title}`
                    }]
                };
            }
            return { ...state, characterQuests: newQuests };
        }
        
        case 'COMPLETE_ONBOARDING':
            return { ...state, showOnboarding: false };
            
        case 'AUTH_STATE_CHANGE':
            return { ...state, isLoggedIn: !!action.payload.session, isGuest: action.payload.isGuest, isLoading: false };
            
        case 'SIGN_IN_AS_GUEST':
            return { ...state, isGuest: true, isLoggedIn: true, isLoading: false };

        default:
            return state;
    }
};

const AppContext = React.createContext<{
    state: AppState;
    dispatch: React.Dispatch<Action>;
} | undefined>(undefined);

const debounce = <F extends (...args: any[]) => any>(func: F, delay: number) => {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: Parameters<F>): void => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
};

const debouncedSave = debounce((key: string, data: object) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error("Failed to save state to localStorage", e);
    }
}, 500);

const debouncedSupabaseUpdate = debounce((isLoggedIn: boolean, isGuest: boolean, stateToSave: object) => {
    if (isLoggedIn && !isGuest) {
        updateUserProfile(stateToSave);
    }
}, 2000);


export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = React.useReducer(appReducer, INITIAL_STATE);
    
    // FIX: This function rehydrates the non-serializable parts of the state (like theme icons)
    // after loading from a data source like localStorage or Supabase.
    const rehydrateState = React.useCallback((stateToRehydrate: Partial<AppState>): Partial<AppState> => {
        const rehydratedState = { ...stateToRehydrate };
        if (rehydratedState.routines) {
            for (const key in rehydratedState.routines) {
                const routineId = key as ActiveRoutineId;
                if (INITIAL_ROUTINES[routineId] && rehydratedState.routines[routineId]) {
                    // This ensures the theme object with its component icon is restored.
                    rehydratedState.routines[routineId].theme = INITIAL_ROUTINES[routineId].theme;
                }
            }
        }
        return rehydratedState;
    }, []);
    
    React.useEffect(() => {
        try {
            const savedState = localStorage.getItem(APP_STATE_KEY);
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                // FIX: Rehydrate state to restore icons and other non-serializable data.
                const rehydratedState = rehydrateState(parsedState);
                dispatch({ type: 'SET_STATE', payload: { ...INITIAL_STATE, ...rehydratedState, isLoading: true } });
            } else {
                dispatch({ type: 'SET_STATE', payload: { isLoading: true } });
            }
        } catch (e) {
            console.error("Failed to load state from localStorage", e);
            dispatch({ type: 'SET_STATE', payload: { isLoading: true } });
        }
    }, [rehydrateState]);

    React.useEffect(() => {
        if (!supabase) {
            dispatch({ type: 'SET_STATE', payload: { isLoading: false } });
            return;
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session) {
                const profile = await getUserProfile();
                if (profile && profile.app_state) {
                    // FIX: Rehydrate state from Supabase to restore icons.
                    const rehydratedState = rehydrateState(profile.app_state);
                    dispatch({ type: 'SET_STATE', payload: { ...state, ...rehydratedState, isLoading: false, isLoggedIn: true, isGuest: false } });
                } else {
                    dispatch({ type: 'AUTH_STATE_CHANGE', payload: { session, isGuest: false } });
                }
            } else {
                 dispatch({ type: 'AUTH_STATE_CHANGE', payload: { session, isGuest: false } });
            }
        });

        return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rehydrateState]);

    React.useEffect(() => {
        const { isLoading, showPasswordModal, ...stateToSave } = state;
        
        if (!isLoading) {
             if (state.isGuest || !state.isLoggedIn) {
                debouncedSave(APP_STATE_KEY, stateToSave);
            }
            debouncedSupabaseUpdate(state.isLoggedIn, state.isGuest, stateToSave);
        }
    }, [state]);

    return (
        <AppContext.Provider value={{ state, dispatch }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = React.useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
