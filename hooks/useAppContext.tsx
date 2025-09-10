import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AppState, AppAction, Mode, QuestId, ActiveRoutineId, Day } from '../types';
import { INITIAL_ROUTINES, INITIAL_QUESTS } from '../constants';

const APP_STATE_KEY = 'buddybear-app-state';
export const PASSWORD_KEY = 'buddybear-password';

const initialState: AppState = {
    mode: Mode.Child,
    routines: INITIAL_ROUTINES,
    activeRoutine: 'Morning',
    selectedDate: new Date().toISOString().split('T')[0],
    taskHistory: {},
    starCount: 0,
    quests: INITIAL_QUESTS,
    weeklyQuestPending: false,
    monthlyQuestPending: false,
    pendingRoutineApprovals: [],
    starAdjustmentLog: [],
    childName: 'Buddy',
    playtimeDuration: 15, // in minutes
    playtimeStarted: false,
    enablePlaytime: true,
    enableMorning: true,
    enableAfterSchool: true,
    enableBedtime: true,
    showPasswordModal: false,
    passwordIsSet: !!localStorage.getItem(PASSWORD_KEY),
    characterQuests: [],
    enableCharacterQuests: true,
};

const appReducer = (state: AppState, action: AppAction): AppState => {
    switch (action.type) {
        case 'LOAD_STATE':
            return { ...state, ...action.payload, passwordIsSet: !!localStorage.getItem(PASSWORD_KEY) };
        case 'TOGGLE_MODE':
            return { ...state, mode: state.mode === Mode.Child ? Mode.Parent : Mode.Child };
        case 'SET_ACTIVE_ROUTINE':
            return { ...state, activeRoutine: action.payload };
        case 'SET_SELECTED_DATE':
            return { ...state, selectedDate: action.payload };
        case 'TOGGLE_TASK_COMPLETION': {
            const { taskId, date } = action.payload;
            const completedTasksForDate = state.taskHistory[date] || [];
            const isCompleted = completedTasksForDate.includes(taskId);
            const newCompletedTasks = isCompleted
                ? completedTasksForDate.filter(id => id !== taskId)
                : [...completedTasksForDate, taskId];
            
            const newState = {
                ...state,
                taskHistory: {
                    ...state.taskHistory,
                    [date]: newCompletedTasks,
                },
            };

            // Check if routine is now complete
            const routineId = Object.keys(state.routines).find(key => 
                state.routines[key as ActiveRoutineId].tasks.some(t => t.id === taskId)
            ) as ActiveRoutineId | undefined;

            if (routineId) {
                const routine = state.routines[routineId];
                const dayOfWeek = new Date(date.replace(/-/g, '/')).getUTCDay();
                const dayName: Day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek] as Day;
                const tasksForDay = routine.tasks.filter(t => t.days.includes(dayName));
                const allTasksComplete = tasksForDay.length > 0 && tasksForDay.every(t => newCompletedTasks.includes(t.id));
                
                const isAlreadyPending = state.pendingRoutineApprovals.some(p => p.date === date && p.routineId === routineId);

                if (allTasksComplete && !isCompleted && !isAlreadyPending) {
                    return {
                        ...newState,
                        pendingRoutineApprovals: [...state.pendingRoutineApprovals, { date, routineId }]
                    };
                }
            }
            return newState;
        }
        case 'APPROVE_ROUTINE_AWARD': {
            const { date, routineId } = action.payload;
            return {
                ...state,
                starCount: state.starCount + 1,
                pendingRoutineApprovals: state.pendingRoutineApprovals.filter(p => !(p.date === date && p.routineId === routineId)),
                starAdjustmentLog: [
                    { id: new Date().toISOString(), amount: 1, reason: `Completed "${state.routines[routineId].name}"`, date: new Date().toISOString() },
                    ...state.starAdjustmentLog,
                ],
            }
        }
        case 'REJECT_ROUTINE_AWARD': {
            return {
                ...state,
                pendingRoutineApprovals: state.pendingRoutineApprovals.filter(p => !(p.date === action.payload.date && p.routineId === action.payload.routineId))
            }
        }
        case 'UPDATE_PARENT_SETTINGS':
            return { ...state, ...action.payload };
        case 'REQUEST_QUEST_APPROVAL': {
            const { questId } = action.payload;
            return {
                ...state,
                ...(questId === 'weekly' && { weeklyQuestPending: true }),
                ...(questId === 'monthly' && { monthlyQuestPending: true }),
            };
        }
        case 'APPROVE_QUEST': {
            const { questId } = action.payload;
            // For simplicity, we just reset the pending status. A real app might grant a reward.
            return {
                ...state,
                ...(questId === 'weekly' && { weeklyQuestPending: false }),
                ...(questId === 'monthly' && { monthlyQuestPending: false }),
            };
        }
        case 'REJECT_QUEST': {
            const { questId } = action.payload;
            return {
                ...state,
                ...(questId === 'weekly' && { weeklyQuestPending: false }),
                ...(questId === 'monthly' && { monthlyQuestPending: false }),
            };
        }
        case 'ADJUST_STARS': {
            const { amount, reason } = action.payload;
            const newLog: any = { id: new Date().toISOString(), amount, reason, date: new Date().toISOString() };
            return {
                ...state,
                starCount: Math.max(0, state.starCount + amount),
                starAdjustmentLog: [newLog, ...state.starAdjustmentLog],
            };
        }
        case 'START_PLAYTIME':
            return { ...state, playtimeStarted: true };
        case 'SHOW_PASSWORD_MODAL':
            return { ...state, showPasswordModal: true };
        case 'HIDE_PASSWORD_MODAL':
            return { ...state, showPasswordModal: false };
        case 'SET_PASSWORD_STATUS':
            return { ...state, passwordIsSet: action.payload };
        case 'INCREMENT_CHARACTER_QUEST': {
            const today = new Date().toISOString().split('T')[0];
            const newQuests = state.characterQuests.map(q => {
                if (q.id === action.payload && q.lastCompletedDate !== today) {
                    const newProgress = q.progress + 1;
                    if(newProgress >= q.goal) {
                        // Quest complete, grant star and reset
                        return {...q, progress: 0, lastCompletedDate: today };
                    }
                    return {...q, progress: newProgress, lastCompletedDate: today };
                }
                return q;
            });

             const quest = state.characterQuests.find(q => q.id === action.payload);
             if (quest && quest.lastCompletedDate !== today && (quest.progress + 1) >= quest.goal) {
                 return {
                    ...state,
                    characterQuests: newQuests,
                    starCount: state.starCount + 1,
                    starAdjustmentLog: [
                        { id: new Date().toISOString(), amount: 1, reason: `Character Quest: "${quest.title}"`, date: new Date().toISOString() },
                        ...state.starAdjustmentLog
                    ],
                 }
             }
            return { ...state, characterQuests: newQuests };
        }
        default:
            return state;
    }
};

const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<AppAction> } | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);

    useEffect(() => {
        try {
            const storedState = localStorage.getItem(APP_STATE_KEY);
            if (storedState) {
                const parsedState = JSON.parse(storedState);

                // Re-hydrate non-serializable parts of the state (like theme icons)
                if (parsedState.routines) {
                    for (const key in parsedState.routines) {
                        const routineId = key as ActiveRoutineId;
                        if (INITIAL_ROUTINES[routineId]) {
                            parsedState.routines[routineId].theme = INITIAL_ROUTINES[routineId].theme;
                        }
                    }
                }
                
                dispatch({ type: 'LOAD_STATE', payload: parsedState });
            }
        } catch (error) {
            console.error("Failed to load state from localStorage", error);
        }
    }, []);

    useEffect(() => {
        try {
            // Create a deep copy of the state to modify before saving
            const stateToSave = JSON.parse(JSON.stringify(state));

            // Remove non-serializable parts before saving to prevent errors
            if (stateToSave.routines) {
                for (const key in stateToSave.routines) {
                    // The 'theme' object contains the React component 'icon', which cannot be serialized to JSON.
                    delete stateToSave.routines[key].theme;
                }
            }

            localStorage.setItem(APP_STATE_KEY, JSON.stringify(stateToSave));
        } catch (error) {
            console.error("Failed to save state to localStorage", error);
        }
    }, [state]);

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