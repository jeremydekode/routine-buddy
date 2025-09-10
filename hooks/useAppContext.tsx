import React, { createContext, useContext, useReducer, Dispatch, useEffect, useState } from 'react';
import { Mode, Routine, ActiveRoutineId, Task, Day, Quest, ActiveViewId, AppState, AppAction, QuestId } from '../types';
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
        case 'TOGGLE_TASK_COMPLETION': {
            const { routineId, taskId } = action.payload;
            const newRoutines = { ...state.routines };
            const routine = newRoutines[routineId];
            const taskIndex = routine.tasks.findIndex(t => t.id === taskId);
            if (taskIndex > -1) {
                const updatedTask = { ...routine.tasks[taskIndex], completed: !routine.tasks[taskIndex].completed };
                const newTasks = [...routine.tasks];
                newTasks[taskIndex] = updatedTask;
                newRoutines[routineId] = { ...routine, tasks: newTasks };
            }
            newState = { ...state, routines: newRoutines };
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
                 completed: false,
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
        case 'UPDATE_ROUTINE_DAYS': {
            const { routineId, days } = action.payload;
            const newRoutines = { ...state.routines };
            newRoutines[routineId] = { ...newRoutines[routineId], days };
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
            const newRoutines = { ...state.routines };
            for (const key in newRoutines) {
                const routineId = key as ActiveRoutineId;
                newRoutines[routineId] = {
                    ...newRoutines[routineId],
                    tasks: newRoutines[routineId].tasks.map(task => ({ ...task, completed: false })),
                };
            }
            newState = {
                ...state,
                routines: newRoutines,
                completedRoutinesToday: [],
                playtimeStarted: false,
                lastCompletionDate: new Date().toISOString().split('T')[0],
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
            };
            saveState(newState);
            return newState;
        }
        case 'START_PLAYTIME': {
            newState = { ...state, playtimeStarted: true };
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
    for (const key in loadedState.routines) {
        const routineId = key as ActiveRoutineId;
        if (INITIAL_ROUTINES[routineId]) {
            loadedState.routines[routineId].theme = INITIAL_ROUTINES[routineId].theme;
        }
    }
    loadedState.showPasswordModal = false;
    loadedState.passwordIsSet = !!localStorage.getItem(PASSWORD_KEY);
    loadedState.playtimeDuration = loadedState.playtimeDuration ?? 10;
    loadedState.playtimeStarted = loadedState.playtimeStarted ?? false;
    loadedState.enablePlaytime = loadedState.enablePlaytime ?? true;
    loadedState.enableMorning = loadedState.enableMorning ?? true;
    loadedState.enableAfterSchool = loadedState.enableAfterSchool ?? true;
    loadedState.enableBedtime = loadedState.enableBedtime ?? true;
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
    const stateToSave = {
        ...state,
        routines: Object.fromEntries(
            Object.entries(state.routines).map(([routineId, routine]) => {
                const { theme, ...serializableRoutine } = routine;
                return [routineId, serializableRoutine];
            })
        ),
        showPasswordModal: undefined,
    };
    delete stateToSave.showPasswordModal;
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