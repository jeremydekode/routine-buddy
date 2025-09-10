import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { loadCloudState, saveCloudState } from '../services/cloudSync';

// ADD
import { loadCloudState, saveCloudState } from '../services/cloudSync';
import { supabase } from '../lib/supabaseClient';
import { useRef } from 'react';

import React, { createContext, useContext, useReducer, Dispatch, useEffect } from 'react';
import { Mode, Routine, ActiveRoutineId, Task, Day, Quest, ActiveViewId, AppState, AppAction, QuestId } from '../types';
import { INITIAL_ROUTINES, INITIAL_QUESTS } from '../constants';

// Reducer
const appReducer = (state: AppState, action: AppAction): AppState => {
    let newState: AppState;
    switch (action.type) {
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
        case 'SET_TASK_IMAGE': {
            const { routineId, taskId, imageUrl } = action.payload;
            const newRoutines = { ...state.routines };
            const routine = newRoutines[routineId];
            const taskIndex = routine.tasks.findIndex(t => t.id === taskId);
            if (taskIndex > -1) {
                const newTasks = [...routine.tasks];
                newTasks[taskIndex] = { ...newTasks[taskIndex], image: imageUrl };
                newRoutines[routineId] = { ...routine, tasks: newTasks };
            }
            return { ...state, routines: newRoutines };
        }
        case 'RESET_DAILY_STATE': {
            // Perform a safe, deep copy without using JSON.stringify on React components
            const newRoutines = { ...state.routines };
            for (const key in newRoutines) {
                const routineId = key as ActiveRoutineId;
                newRoutines[routineId] = {
                    ...newRoutines[routineId],
                    tasks: newRoutines[routineId].tasks.map(task => ({
                        ...task,
                        completed: false,
                    })),
                };
            }
            newState = {
                ...state,
                routines: newRoutines,
                completedRoutinesToday: [],
                lastCompletionDate: new Date().toISOString().split('T')[0],
            };
            saveState(newState);
            return newState;
        }
        case 'SET_IMAGE_API_RATE_LIMITED':
            return { ...state, imageGenerationApiRateLimited: true };
        
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
            saveState(newState); // Persist this change immediately
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
            };
            saveState(newState);
            return newState;
        }
        default:
            return state;
    }
};

// Local Storage
const LOCAL_STORAGE_KEY = 'kid-routine-app-state';
export const PASSWORD_KEY = 'routine-buddy-password';

const loadState = (): AppState | undefined => {
    try {
        const serializedState = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (serializedState === null) {
            return undefined;
        }
        const loadedState = JSON.parse(serializedState);

        // Rehydrate the state with non-serializable data (React components for icons)
        for (const key in loadedState.routines) {
            const routineId = key as ActiveRoutineId;
            if (INITIAL_ROUTINES[routineId]) {
                // Restore the entire theme object from constants to get the icon
                loadedState.routines[routineId].theme = INITIAL_ROUTINES[routineId].theme;
            }
        }

        // Reset runtime-only state that should not be persisted
        loadedState.imageGenerationApiRateLimited = false;
        loadedState.showPasswordModal = false;
        
        // Check if password exists
        loadedState.passwordIsSet = !!localStorage.getItem(PASSWORD_KEY);

        return loadedState;
    } catch (err) {
        console.error("Could not load state from localStorage", err);
        return undefined;
    }
};

const saveState = (state: AppState) => {
    try {
        // Create a serializable copy of the state object to avoid corrupting the live state
        const stateToSave = {
            ...state,
            routines: Object.fromEntries(
                Object.entries(state.routines).map(([routineId, routine]) => {
                    const serializableRoutine = {
                        ...routine,
                        // Omit the theme, as it contains the non-serializable icon component
                        theme: undefined,
                        tasks: routine.tasks.map(task => {
                            // Omit the dynamic image data from persisted tasks
                            const { image, ...rest } = task;
                            return rest;
                        }),
                    };
                    delete serializableRoutine.theme;
                    return [routineId, serializableRoutine];
                })
            ),
             // Don't save these runtime states
            showPasswordModal: undefined,
            imageGenerationApiRateLimited: undefined,
        };
        delete stateToSave.showPasswordModal;
        delete stateToSave.imageGenerationApiRateLimited;


        const serializedState = JSON.stringify(stateToSave);
        localStorage.setItem(LOCAL_STORAGE_KEY, serializedState);
    } catch (err) {
        console.error("Could not save state to localStorage", err);
    }
};

const getInitialState = (): AppState => {
    const savedState = loadState();
    if (savedState) {
        return savedState;
    }
    return {
        mode: Mode.Child,
        routines: INITIAL_ROUTINES,
        quests: INITIAL_QUESTS,
        activeRoutine: 'Morning',
        starCount: 0,
        completedRoutinesToday: [],
        lastCompletionDate: new Date().toISOString().split('T')[0],
        imageGenerationApiRateLimited: false,
        weeklyQuestPending: false,
        monthlyQuestPending: false,
        starAdjustmentLog: [],
        childName: 'Buddy',
        passwordIsSet: !!localStorage.getItem(PASSWORD_KEY),
        showPasswordModal: false,
    };
};

// Context
const AppContext = createContext<{ state: AppState; dispatch: Dispatch<AppAction> } | undefined>(undefined);

// Provider
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, getInitialState());

    // ADD: debounce helper so we don’t spam the DB
const saveTimer = useRef<number | null>(null);
const debouncedSave = (payload: any, delay = 800) => {
  if (saveTimer.current) window.clearTimeout(saveTimer.current);
  // @ts-ignore
  saveTimer.current = window.setTimeout(() => saveCloudState(payload).catch(console.error), delay);
};


    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        if (state.lastCompletionDate !== today) {
            dispatch({ type: 'RESET_DAILY_STATE' });
        }
    }, []); // Check only on initial load

    // --- Cloud sync: hydrate on login, then keep saving changes ---

// small debounce so we don't spam the DB on rapid changes
const saveTimer = useRef<number | null>(null);
const debouncedSave = (payload: any, delay = 800) => {
  if (saveTimer.current) window.clearTimeout(saveTimer.current);
  // @ts-ignore
  saveTimer.current = window.setTimeout(() => {
    saveCloudState(payload).catch(console.error);
  }, delay);
};

// Try to pull cloud state when the user is logged in
useEffect(() => {
  let isMounted = true;

  const hydrate = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const cloud = await loadCloudState().catch(() => null);
    if (!cloud || !isMounted) return;

    // ---- OPTION A (preferred): use your existing reducer actions to merge parts ----
    try {
      // Replace/merge the bits you already manage in the reducer.
      // If any of these actions don't exist in your reducer, skip that line.
      if (cloud.routines) {
        dispatch({ type: 'UPDATE_PARENT_SETTINGS', payload: { routines: cloud.routines } });
      }
      if (cloud.quests) {
        dispatch({ type: 'UPDATE_PARENT_SETTINGS', payload: { quests: cloud.quests } });
      }
      if (typeof cloud.childName === 'string') {
        dispatch({ type: 'UPDATE_PARENT_SETTINGS', payload: { childName: cloud.childName } });
      }
      if (typeof cloud.starCount === 'number') {
        dispatch({ type: 'SET_STAR_COUNT', payload: cloud.starCount });
      }
      if (Array.isArray(cloud.completedRoutinesToday)) {
        dispatch({ type: 'SET_COMPLETED_ROUTINES_TODAY', payload: cloud.completedRoutinesToday });
      }
      if (typeof cloud.weeklyQuestPending === 'boolean') {
        dispatch({ type: 'SET_WEEKLY_QUEST_PENDING', payload: cloud.weeklyQuestPending });
      }
      if (typeof cloud.monthlyQuestPending === 'boolean') {
        dispatch({ type: 'SET_MONTHLY_QUEST_PENDING', payload: cloud.monthlyQuestPending });
      }
    } catch (err) {
      // ---- OPTION B (fallback): write whole cloud JSON to localStorage and reload ----
      // Use this ONLY if your reducer doesn't have the actions above.
      try {
        localStorage.setItem('routine-buddy-state', JSON.stringify(cloud));
        window.location.reload();
      } catch {}
    }
  };

  hydrate();

  // re-hydrate on future auth state changes too
  const sub = supabase.auth.onAuthStateChange((_e, session) => {
    if (session) hydrate();
  });

  return () => {
    isMounted = false;
    sub.data?.subscription?.unsubscribe?.();
  };
}, [dispatch]);

// Select only the parts you want to sync (PIN is intentionally NOT included)
const syncableState = {
  routines: state.routines,
  quests: state.quests,
  childName: state.childName,
  starCount: state.starCount,
  completedRoutinesToday: state.completedRoutinesToday,
  weeklyQuestPending: state.weeklyQuestPending,
  monthlyQuestPending: state.monthlyQuestPending,
};

// Whenever these change, save to Supabase (and you already save to localStorage elsewhere)
useEffect(() => {
  debouncedSave(syncableState);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [
  state.routines,
  state.quests,
  state.childName,
  state.starCount,
  state.completedRoutinesToday,
  state.weeklyQuestPending,
  state.monthlyQuestPending,
]);


    return (
        <AppContext.Provider value={{ state, dispatch }}>
            {children}
        </AppContext.Provider>
    );
};

// Hook
export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
