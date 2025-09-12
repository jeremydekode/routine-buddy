import * as React from 'react';
import { AppState, Mode, ActiveRoutineId } from '../types';
import { INITIAL_ROUTINES, INITIAL_QUESTS } from '../constants';
import { supabase, getUserProfile, updateUserProfile } from '../services/supabase';

// Define action types
type Action =
    | { type: 'SET_STATE'; payload: Partial<AppState> }
    | { type: 'TOGGLE_MODE' }
    | { type: 'SET_SELECTED_DATE'; payload: string }
    | { type: 'SET_ACTIVE_ROUTINE'; payload: AppState['activeRoutine'] }
    | { type: 'TOGGLE_TASK_COMPLETION'; payload: { taskId: string; date: string } }
    | { type: 'REQUEST_ROUTINE_APPROVAL'; payload: { routineId: ActiveRoutineId; date: string } }
    | { type: 'START_PLAYTIME' }
    | { type: 'REQUEST_QUEST_APPROVAL'; payload: { questId: 'weekly' | 'monthly' } }
    | { type: 'UPDATE_PARENT_SETTINGS'; payload: Partial<AppState> }
    | { type: 'APPROVE_QUEST'; payload: { questId: 'weekly' | 'monthly' } }
    | { type: 'REJECT_QUEST'; payload: { questId: 'weekly' | 'monthly' } }
    | { type: 'APPROVE_ROUTINE_AWARD'; payload: { routineId: ActiveRoutineId; date: string } }
    | { type: 'REJECT_ROUTINE_AWARD'; payload: { routineId: ActiveRoutineId; date: string } }
    | { type: 'ADJUST_STARS'; payload: { amount: number; reason: string } }
    | { type: 'INCREMENT_CHARACTER_QUEST'; payload: string }
    | { type: 'SET_LOGGED_IN'; payload: boolean }
    | { type: 'SHOW_PASSWORD_MODAL' }
    | { type: 'HIDE_PASSWORD_MODAL' }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SIGN_OUT' };

const initialState: AppState = {
    mode: Mode.Child,
    selectedDate: new Date().toISOString().split('T')[0],
    activeRoutine: 'Morning',
    routines: INITIAL_ROUTINES,
    quests: INITIAL_QUESTS,
    characterQuests: [],
    taskHistory: {},
    starCount: 0,
    weeklyQuestPending: false,
    monthlyQuestPending: false,
    pendingRoutineApprovals: [],
    starAdjustmentLog: [],
    childName: 'Buddy',
    playtimeDuration: 10,
    playtimeStarted: false,
    enablePlaytime: true,
    enableMorning: true,
    enableAfterSchool: true,
    enableBedtime: true,
    enableCharacterQuests: true,
    isLoading: true,
    isLoggedIn: false,
    showPasswordModal: false,
};

const AppContext = React.createContext<{
    state: AppState;
    dispatch: React.Dispatch<Action>;
}>({
    state: initialState,
    dispatch: () => null,
});

const appReducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        case 'SET_STATE':
            return { ...state, ...action.payload, isLoading: false };
        case 'TOGGLE_MODE': {
            if (state.mode === Mode.Child) {
                const hasPassword = !!localStorage.getItem(PASSWORD_KEY);
                if (hasPassword) {
                    return { ...state, showPasswordModal: true };
                }
            }
            return { ...state, mode: state.mode === Mode.Child ? Mode.Parent : Mode.Child };
        }
        case 'SHOW_PASSWORD_MODAL':
             return { ...state, showPasswordModal: true };
        case 'HIDE_PASSWORD_MODAL':
             return { ...state, showPasswordModal: false };
        case 'SET_SELECTED_DATE':
            return { ...state, selectedDate: action.payload };
        case 'SET_ACTIVE_ROUTINE':
            return { ...state, activeRoutine: action.payload };
        case 'TOGGLE_TASK_COMPLETION': {
            const { taskId, date } = action.payload;
            const completedTasks = state.taskHistory[date] || [];
            const newCompletedTasks = completedTasks.includes(taskId)
                ? completedTasks.filter(id => id !== taskId)
                : [...completedTasks, taskId];
            return {
                ...state,
                taskHistory: {
                    ...state.taskHistory,
                    [date]: newCompletedTasks
                }
            };
        }
        case 'REQUEST_ROUTINE_APPROVAL': {
             const { routineId, date } = action.payload;
             if (state.pendingRoutineApprovals.some(p => p.routineId === routineId && p.date === date)) {
                 return state;
             }
             return {
                 ...state,
                 pendingRoutineApprovals: [...state.pendingRoutineApprovals, { routineId, date }]
             };
        }
        case 'START_PLAYTIME':
            return { ...state, playtimeStarted: true };
        case 'REQUEST_QUEST_APPROVAL': {
            const { questId } = action.payload;
            return {
                ...state,
                [`${questId}QuestPending`]: true,
            };
        }
        case 'UPDATE_PARENT_SETTINGS':
            return { ...state, ...action.payload };
        case 'APPROVE_QUEST': {
            const { questId } = action.payload;
            const quest = state.quests[questId];
            const reason = `Reward for "${quest.name}" quest.`;
            return {
                ...state,
                starCount: state.starCount - quest.goal,
                starAdjustmentLog: [
                    { id: new Date().toISOString(), date: new Date().toISOString(), amount: -quest.goal, reason },
                     ...state.starAdjustmentLog
                ],
                [`${questId}QuestPending`]: false,
            };
        }
        case 'REJECT_QUEST': {
            return { ...state, [`${action.payload.questId}QuestPending`]: false };
        }
        case 'APPROVE_ROUTINE_AWARD': {
            const { routineId, date } = action.payload;
            const reason = `Completed ${state.routines[routineId].name} on ${new Date(date.replace(/-/g, '/')).toLocaleDateString()}`;
            return {
                ...state,
                starCount: state.starCount + 1,
                starAdjustmentLog: [
                     { id: new Date().toISOString(), date: new Date().toISOString(), amount: 1, reason },
                    ...state.starAdjustmentLog,
                ],
                pendingRoutineApprovals: state.pendingRoutineApprovals.filter(p => !(p.routineId === routineId && p.date === date)),
            };
        }
        case 'REJECT_ROUTINE_AWARD': {
            const { routineId, date } = action.payload;
            return {
                ...state,
                pendingRoutineApprovals: state.pendingRoutineApprovals.filter(p => !(p.routineId === routineId && p.date === date)),
            };
        }
        case 'ADJUST_STARS': {
            const { amount, reason } = action.payload;
            return {
                ...state,
                starCount: state.starCount + amount,
                 starAdjustmentLog: [
                    { id: new Date().toISOString(), date: new Date().toISOString(), amount, reason },
                    ...state.starAdjustmentLog,
                ],
            };
        }
        case 'INCREMENT_CHARACTER_QUEST': {
            const questId = action.payload;
            const today = new Date().toISOString().split('T')[0];
            const quest = state.characterQuests.find(q => q.id === questId);
            const isCompleting = quest && quest.progress + 1 >= quest.goal;
            return {
                ...state,
                characterQuests: state.characterQuests.map(q => {
                    if (q.id === questId && q.lastCompletedDate !== today) {
                        const newProgress = q.progress + 1;
                        if (newProgress >= q.goal) {
                             return { ...q, progress: 0, lastCompletedDate: today };
                        }
                        return { ...q, progress: newProgress, lastCompletedDate: today };
                    }
                    return q;
                }),
                starCount: isCompleting ? state.starCount + 1 : state.starCount,
                starAdjustmentLog: isCompleting ? [
                    { id: new Date().toISOString(), date: new Date().toISOString(), amount: 1, reason: `Completed "${quest?.title}" quest!` },
                    ...state.starAdjustmentLog
                ] : state.starAdjustmentLog
            };
        }
        case 'SET_LOGGED_IN':
            return { ...state, isLoggedIn: action.payload, isLoading: false };
        case 'SIGN_OUT':
            return { ...initialState, isLoggedIn: false, isLoading: false };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        default:
            return state;
    }
};

/**
 * Prepares the application state for saving to a remote database.
 * It removes transient UI properties and non-serializable data like React components.
 * @param stateToPrepare The full application state.
 * @returns A serializable, partial state object ready for persistence.
 */
const prepareStateForSaving = (stateToPrepare: AppState): Partial<AppState> => {
    const { isLoading, isLoggedIn, showPasswordModal, mode, ...persistableState } = stateToPrepare;
    try {
        // Deep clone to avoid mutations and handle JSON-safe conversion
        const clonedState = JSON.parse(JSON.stringify(persistableState));

        // The 'theme' object on routines contains a non-serializable React icon.
        // We must strip it out before saving, keeping only the color.
        if (clonedState.routines) {
            for (const key in clonedState.routines) {
                const routineId = key as ActiveRoutineId;
                const originalRoutine = stateToPrepare.routines[routineId];
                if (clonedState.routines[routineId] && originalRoutine?.theme) {
                    clonedState.routines[routineId].theme = { color: originalRoutine.theme.color };
                }
            }
        }
        return clonedState;
    } catch (error) {
        console.error("Error preparing state for saving. Data will not be persisted.", error);
        return {}; // Return empty object to prevent saving corrupt data
    }
};


export const PASSWORD_KEY = 'routine-buddy-pin';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = React.useReducer(appReducer, initialState);

    const loadStateFromRemote = React.useCallback(async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const profile = await getUserProfile();
            const remoteState = profile?.app_state as Partial<AppState> | null;

            if (remoteState && remoteState.routines && remoteState.quests) {
                console.log("✅ Remote state loaded successfully:", remoteState);
                Object.keys(remoteState.routines).forEach(key => {
                    const routineId = key as ActiveRoutineId;
                    const remoteRoutine = remoteState.routines![routineId];
                    const initialRoutine = INITIAL_ROUTINES[routineId];

                    if (remoteRoutine && initialRoutine) {
                        remoteRoutine.theme = initialRoutine.theme;
                    }
                });
                dispatch({ type: 'SET_STATE', payload: { ...remoteState, isLoggedIn: true } });
            } else {
                console.log("ℹ️ No valid remote state found for user. Initializing with default state.");
                dispatch({ type: 'SET_STATE', payload: { ...initialState, isLoggedIn: true, isLoading: false } });
            }
        } catch (error) {
            console.error("❌ Critical error during state loading. Resetting to default state.", error);
            dispatch({ type: 'SET_STATE', payload: { ...initialState, isLoggedIn: true, isLoading: false } });
        }
    }, []);
    
    // Handles all authentication state changes, including initial load.
    React.useEffect(() => {
        if (!supabase) {
            dispatch({ type: 'SIGN_OUT' });
            return;
        }

        // The onAuthStateChange listener handles all auth events:
        // SIGNED_IN, SIGNED_OUT, and INITIAL_SESSION on page load.
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                // User is signed in or session was restored.
                loadStateFromRemote();
            } else {
                // User is signed out.
                dispatch({ type: 'SIGN_OUT' });
            }
        });
        
        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, [loadStateFromRemote]);

    // Debounced effect for persisting state to Supabase
    React.useEffect(() => {
        const { isLoggedIn, isLoading } = state;
        // Guard clauses: don't save if not logged in or if loading initial state.
        if (!isLoggedIn || isLoading) {
            return;
        }

        const handler = setTimeout(() => {
            const stateToPersist = prepareStateForSaving(state);
            // Final check to ensure we don't save an empty object if preparation failed
            if (stateToPersist && Object.keys(stateToPersist).length > 0) {
                 updateUserProfile(stateToPersist);
            }
        }, 1500); // Debounce saves to avoid excessive database writes

        return () => {
            clearTimeout(handler);
        };
    }, [state]); // Re-run whenever the state object changes


    return (
        <AppContext.Provider value={{ state, dispatch }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => React.useContext(AppContext);