import React, { createContext, useContext, useReducer, Dispatch, useEffect, useState } from 'react';
import { Mode, Routine, ActiveRoutineId, Task, Day, Quest, ActiveViewId, AppState, AppAction, QuestId, CharacterQuest } from '../types';
import { INITIAL_ROUTINES, INITIAL_QUESTS } from '../constants';
import { supabase } from '../services/supabase';

// Reducer
const appReducer = (state: AppState, action: AppAction): AppState => {
    let newState: AppState;
    switch (action.type) {
        case 'HYDRATE_STATE':
            return action.payload;
        case 'TOGGLE_MODE':
            return { ...state, mode: state.mode === Mode.Child ? Mode.Parent : Mode.Child };
        case 'SET_ACTIVE_ROUTINE':
            return { ...state, activeRoutine: action.payload };
        case 'SET_SELECTED_DATE':
            return { ...state, selectedDate: action.payload };
        case 'TOGGLE_TASK_COMPLETION': {
            const { taskId, date } = action.payload;
            const newHistory = { ...state.taskHistory };
            const dateHistory = newHistory[date] ? [...newHistory[date]] : [];
            const taskIndexInHistory = dateHistory.indexOf(taskId);

            if (taskIndexInHistory > -1) {
                dateHistory.splice(taskIndexInHistory, 1);
            } else {
                dateHistory.push(taskId);
            }

            if (dateHistory.length > 0) {
                newHistory[date] = dateHistory;
            } else {
                delete newHistory[date];
            }
            
            newState = { ...state, taskHistory: newHistory };
            saveState(newState);
            return newState;
        }
        case 'ADD_TASK': {
             const { routineId, task } = action.payload;
             const newRoutines = { ...state.routines };
             const routine = newRoutines[routineId];
             const newTask: Task = {
                 ...task,
                 id: new Date().toISOString(),
             };
             newRoutines[routineId] = { ...routine, tasks: [...routine.tasks, newTask] };
             return { ...state, routines: newRoutines };
        }
        case 'UPDATE_TASK': {
            const { routineId, task } = action.payload;
            const newRoutines = { ...state.routines };
            const routine = newRoutines[routineId];
            const taskIndex = routine.tasks.findIndex(t => t.id === task.id);
            if (taskIndex > -1) {
                const newTasks = [...routine.tasks];
                newTasks[taskIndex] = task;
                newRoutines[routineId] = { ...routine, tasks: newTasks };
            }
            return { ...state, routines: newRoutines };
        }
        case 'DELETE_TASK': {
            const { routineId, taskId } = action.payload;
            const newRoutines = { ...state.routines };
            const routine = newRoutines[routineId];
            newRoutines[routineId] = { ...routine, tasks: routine.tasks.filter(t => t.id !== taskId) };
            return { ...state, routines: newRoutines };
        }
        case 'UPDATE_QUEST': {
            const { quest } = action.payload;
            const newQuests = { ...state.quests };
            if (quest.id === 'weekly' || quest.id === 'monthly') {
                newQuests[quest.id] = quest;
            }
            return { ...state, quests: newQuests };
        }
        case 'AWARD_STAR_FOR_ROUTINE': {
            const { routineId } = action.payload;
            if (state.completedRoutinesToday.includes(routineId)) {
                return state;
            }
            newState = {
                ...state,
                starCount: state.starCount + 1,
                completedRoutinesToday: [...state.completedRoutinesToday, routineId],
            };
            saveState(newState);
            return newState;
        }
        case 'RESET_DAILY_STATE': {
            newState = {
                ...state,
                completedRoutinesToday: [],
                playtimeStarted: false,
                lastCompletionDate: new Date().toISOString().split('T')[0],
                selectedDate: new Date().toISOString().split('T')[0],
            };
            saveState(newState);
            return newState;
        }
        case 'REQUEST_QUEST_APPROVAL': {
            const { questId } = action.payload;
            newState = questId === 'weekly' ? { ...state, weeklyQuestPending: true } : { ...state, monthlyQuestPending: true };
            saveState(newState);
            return newState;
        }
        case 'APPROVE_QUEST': {
            const { questId } = action.payload;
            const questName = state.quests[questId].name;
            const newLog = {
                id: new Date().toISOString(),
                date: new Date().toISOString(),
                amount: 0,
                reason: `Approved quest: "${questName}"`,
            };
            newState = questId === 'weekly' 
                ? { ...state, weeklyQuestPending: false, starAdjustmentLog: [newLog, ...state.starAdjustmentLog] }
                : { ...state, monthlyQuestPending: false, starAdjustmentLog: [newLog, ...state.starAdjustmentLog] };
            saveState(newState);
            return newState;
        }
        case 'REJECT_QUEST': {
             const { questId } = action.payload;
             newState = questId === 'weekly' ? { ...state, weeklyQuestPending: false } : { ...state, monthlyQuestPending: false };
             saveState(newState);
             return newState;
        }
        case 'ADJUST_STARS': {
            const { amount, reason } = action.payload;
            if (isNaN(amount) || amount === 0) return state;
            const newLog = {
                id: new Date().toISOString(),
                date: new Date().toISOString(),
                amount,
                reason,
            };
            newState = {
                ...state,
                starCount: Math.max(0, state.starCount + amount),
                starAdjustmentLog: [newLog, ...state.starAdjustmentLog],
            };
            saveState(newState);
            return newState;
        }
        case 'UPDATE_CHILD_NAME':
            return { ...state, childName: action.payload };
        case 'SET_PASSWORD_STATUS':
            newState = { ...state, passwordIsSet: action.payload };
            saveState(newState);
            return newState;
        case 'SHOW_PASSWORD_MODAL':
            return { ...state, showPasswordModal: true };
        case 'HIDE_PASSWORD_MODAL':
            return { ...state, showPasswordModal: false };
        case 'UPDATE_PARENT_SETTINGS': {
            newState = {
                ...state,
                routines: action.payload.routines,
                quests: action.payload.quests,
                childName: action.payload.childName,
                playtimeDuration: action.payload.playtimeDuration,
                enablePlaytime: action.payload.enablePlaytime,
                enableMorning: action.payload.enableMorning,
                enableAfterSchool: action.payload.enableAfterSchool,
                enableBedtime: action.payload.enableBedtime,
                enableCharacterQuests: action.payload.enableCharacterQuests,
                characterQuests: action.payload.characterQuests,
            };
            saveState(newState);
            return newState;
        }
        case 'START_PLAYTIME': {
            newState = { ...state, playtimeStarted: true };
            saveState(newState);
            return newState;
        }
        case 'ADD_CHARACTER_QUEST': {
            const newQuest: CharacterQuest = {
                ...action.payload,
                id: new Date().toISOString(),
                progress: 0,
                lastCompletedDate: null,
            };
            return { ...state, characterQuests: [...state.characterQuests, newQuest] };
        }
        case 'UPDATE_CHARACTER_QUEST': {
            const questIndex = state.characterQuests.findIndex(q => q.id === action.payload.id);
            if (questIndex === -1) return state;
            const newQuests = [...state.characterQuests];
            newQuests[questIndex] = action.payload;
            return { ...state, characterQuests: newQuests };
        }
        case 'DELETE_CHARACTER_QUEST': {
            return { ...state, characterQuests: state.characterQuests.filter(q => q.id !== action.payload) };
        }
        case 'INCREMENT_CHARACTER_QUEST': {
            const today = new Date().toISOString().split('T')[0];
            const questIndex = state.characterQuests.findIndex(q => q.id === action.payload);
            if (questIndex === -1) return state;

            const quest = state.characterQuests[questIndex];
            // Prevent incrementing if already completed today
            if (quest.lastCompletedDate === today) return state;

            const newQuests = [...state.characterQuests];
            newQuests[questIndex] = {
                ...quest,
                progress: quest.progress + 1,
                lastCompletedDate: today,
            };
            newState = { ...state, characterQuests: newQuests };
            saveState(newState);
            return newState;
        }
        default:
            return state;
    }
};

const LOCAL_STORAGE_KEY = 'kid-routine-app-state';
export const PASSWORD_KEY = 'routine-buddy-password';
const SUPABASE_STATE_ID = 1;

const rehydrateState = (loadedState: any): AppState => {
    const today = new Date().toISOString().split('T')[0];

    // --- Data Migration & Validation ---
    
    // 1. Make routines safe by adding themes and handling corruption.
    if (loadedState.routines && typeof loadedState.routines === 'object') {
        for (const key in loadedState.routines) {
            const routineId = key as ActiveRoutineId;
            const routine = loadedState.routines[routineId];
            
            // Add back theme if missing
            if (INITIAL_ROUTINES[routineId] && routine) {
                routine.theme = INITIAL_ROUTINES[routineId].theme;

                // **MIGRATION LOGIC:** Move `days` from routine to tasks if it exists at the old location.
                if (routine.days && Array.isArray(routine.days)) {
                    if (routine.tasks && Array.isArray(routine.tasks)) {
                        routine.tasks.forEach((task: any) => {
                            if (!task.days) { // Only apply if task doesn't have its own days
                                task.days = routine.days;
                            }
                        });
                    }
                    delete routine.days; // Clean up old property
                }
            }
        }
    } else {
        loadedState.routines = INITIAL_ROUTINES; // Reset if corrupt
    }

    // 2. Set defaults for any potentially missing properties.
    loadedState.showPasswordModal = false;
    loadedState.passwordIsSet = !!localStorage.getItem(PASSWORD_KEY);
    loadedState.playtimeDuration = loadedState.playtimeDuration ?? 10;
    loadedState.playtimeStarted = loadedState.playtimeStarted ?? false;
    loadedState.enablePlaytime = loadedState.enablePlaytime ?? true;
    loadedState.enableMorning = loadedState.enableMorning ?? true;
    loadedState.enableAfterSchool = loadedState.enableAfterSchool ?? true;
    loadedState.enableBedtime = loadedState.enableBedtime ?? true;
    loadedState.enableCharacterQuests = loadedState.enableCharacterQuests ?? true;
    loadedState.selectedDate = today; // Always start on today's date
    loadedState.taskHistory = loadedState.taskHistory || {};
    loadedState.characterQuests = loadedState.characterQuests || []; // Initialize new feature

    // 3. Validate the active routine to prevent crashes.
    const active = loadedState.activeRoutine as ActiveViewId;
    const routineOrder: ActiveRoutineId[] = ['Morning', 'After-School', 'Bedtime'];
    const enabledRoutines = routineOrder.filter(id => {
      if (id === 'Morning') return loadedState.enableMorning;
      if (id === 'After-School') return loadedState.enableAfterSchool;
      if (id === 'Bedtime') return loadedState.enableBedtime;
      return false;
    });

    const isValidRoutineId = active && enabledRoutines.includes(active as ActiveRoutineId);
    if (!isValidRoutineId && active !== 'Quests' && active !== 'Playtime' && active !== 'Character') {
        loadedState.activeRoutine = enabledRoutines[0] || 'Quests';
    } else if (!active) {
        loadedState.activeRoutine = enabledRoutines[0] || 'Morning';
    }
    
    return loadedState;
};

const loadState = async (): Promise<AppState | undefined> => {
    try {
        if (supabase) {
            const { data, error } = await supabase
                .from('app_state')
                .select('data')
                .eq('id', SUPABASE_STATE_ID)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error("Error loading state from Supabase:", error);
            }
            if (data && data.data) {
                return rehydrateState(data.data);
            }
        }
        const serializedState = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (serializedState === null) return undefined;
        const localState = JSON.parse(serializedState);
        return rehydrateState(localState);
    } catch (err) {
        console.error("Could not load state", err);
        return undefined;
    }
};

const serializeStateForSaving = (state: AppState) => {
    const stateToSave: Partial<AppState> = {
        ...state,
        routines: Object.fromEntries(
            Object.entries(state.routines).map(([routineId, routine]) => {
                const { theme, ...serializableRoutine } = routine;
                return [routineId, serializableRoutine];
            })
        ) as any,
    };
    // Properties that should not be persisted or should be reset on load
    delete stateToSave.showPasswordModal;
    delete stateToSave.mode;
    delete stateToSave.selectedDate;
    return stateToSave;
};

const saveState = async (state: AppState) => {
    try {
        const stateToSave = serializeStateForSaving(state);
        
        if (supabase) {
            const { error } = await supabase.from('app_state').upsert({ id: SUPABASE_STATE_ID, data: stateToSave });
            if (error) {
                console.error("Could not save state to Supabase, will only save locally.", error);
            }
        }

        const serializedState = JSON.stringify(stateToSave);
        localStorage.setItem(LOCAL_STORAGE_KEY, serializedState);
    } catch (err) {
        console.error("Could not save state.", err);
    }
};

const getDefaultState = (): AppState => ({
    mode: Mode.Child,
    routines: INITIAL_ROUTINES,
    quests: INITIAL_QUESTS,
    characterQuests: [],
    activeRoutine: 'Morning',
    starCount: 0,
    completedRoutinesToday: [],
    lastCompletionDate: new Date().toISOString().split('T')[0],
    weeklyQuestPending: false,
    monthlyQuestPending: false,
    starAdjustmentLog: [],
    childName: 'Buddy',
    passwordIsSet: !!localStorage.getItem(PASSWORD_KEY),
    showPasswordModal: false,
    playtimeDuration: 10,
    playtimeStarted: false,
    enablePlaytime: true,
    enableMorning: true,
    enableAfterSchool: true,
    enableBedtime: true,
    enableCharacterQuests: true,
    selectedDate: new Date().toISOString().split('T')[0],
    taskHistory: {},
});

const AppContext = createContext<{ state: AppState; dispatch: Dispatch<AppAction> } | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, getDefaultState());
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initializeState = async () => {
            const savedState = await loadState();
            if (savedState) {
                dispatch({ type: 'HYDRATE_STATE', payload: savedState });
            }
            setIsLoading(false);
        };
        initializeState();
    }, []);

    useEffect(() => {
        if (!isLoading) {
            const today = new Date().toISOString().split('T')[0];
            if (state.lastCompletionDate !== today) {
                dispatch({ type: 'RESET_DAILY_STATE' });
            }
        }
    }, [isLoading, state.lastCompletionDate]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500"></div>
            </div>
        );
    }

    return (
        <AppContext.Provider value={{ state, dispatch }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};