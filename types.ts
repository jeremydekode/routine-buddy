import React from 'react';

export enum Mode {
    Child,
    Parent,
}

export type Day = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export const DAYS_OF_WEEK: Day[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export interface Task {
    id: string;
    title: string;
    icon: string; // emoji
    days: Day[];
    duration?: number; // Optional: duration in seconds for timed tasks
    description?: string;
}

export interface RoutineTheme {
    icon: React.ReactNode;
    color: string;
}

export type ActiveRoutineId = 'Morning' | 'After-School' | 'Bedtime';

export type ActiveViewId = ActiveRoutineId | 'Quests' | 'Playtime';

export interface Routine {
    id: ActiveRoutineId;
    name: string;
    tasks: Task[];
    theme: RoutineTheme;
}

export type QuestId = 'weekly' | 'monthly';

export interface Quest {
    id: QuestId;
    name: string;
    goal: number; // number of stars
}

export interface AiSuggestion {
    title: string;
    category: 'Kindness' | 'Patience' | 'Gratitude' | 'Responsibility' | 'Fun';
}

export interface StarAdjustment {
    id: string;
    date: string; // ISO string
    amount: number;
    reason: string;
}

// State
export interface AppState {
    mode: Mode;
    routines: Record<ActiveRoutineId, Routine>;
    quests: {
        weekly: Quest;
        monthly: Quest;
    };
    activeRoutine: ActiveViewId;
    starCount: number;
    completedRoutinesToday: ActiveRoutineId[]; // Note: This might become redundant with taskHistory
    lastCompletionDate: string; // YYYY-MM-DD
    weeklyQuestPending: boolean;
    monthlyQuestPending: boolean;
    starAdjustmentLog: StarAdjustment[];
    childName: string;
    passwordIsSet: boolean;
    showPasswordModal: boolean;
    playtimeDuration: number; // in minutes
    playtimeStarted: boolean;
    enablePlaytime: boolean;
    enableMorning: boolean;
    enableAfterSchool: boolean;
    enableBedtime: boolean;
    // New properties for calendar view and history
    selectedDate: string; // YYYY-MM-DD
    taskHistory: Record<string, string[]>; // Key: YYYY-MM-DD, Value: array of completed task IDs
}

// Actions
export type AppAction =
    | { type: 'TOGGLE_MODE' }
    | { type: 'SET_ACTIVE_ROUTINE'; payload: ActiveViewId }
    | { type: 'TOGGLE_TASK_COMPLETION'; payload: { taskId: string; date: string } }
    | { type: 'ADD_TASK'; payload: { routineId: ActiveRoutineId; task: Omit<Task, 'id'> } }
    | { type: 'UPDATE_TASK'; payload: { routineId: ActiveRoutineId; task: Task } }
    | { type: 'DELETE_TASK'; payload: { routineId: ActiveRoutineId; taskId: string } }
    | { type: 'UPDATE_QUEST'; payload: { quest: Quest } }
    | { type: 'AWARD_STAR_FOR_ROUTINE'; payload: { routineId: ActiveRoutineId } }
    | { type: 'RESET_DAILY_STATE' }
    | { type: 'REQUEST_QUEST_APPROVAL'; payload: { questId: QuestId } }
    | { type: 'APPROVE_QUEST'; payload: { questId: QuestId } }
    | { type: 'REJECT_QUEST'; payload: { questId: QuestId } }
    | { type: 'ADJUST_STARS'; payload: { amount: number; reason: string } }
    | { type: 'UPDATE_CHILD_NAME'; payload: string }
    | { type: 'SET_PASSWORD_STATUS'; payload: boolean }
    | { type: 'SHOW_PASSWORD_MODAL' }
    | { type: 'HIDE_PASSWORD_MODAL' }
    | { type: 'UPDATE_PARENT_SETTINGS'; payload: { routines: Record<ActiveRoutineId, Routine>, quests: { weekly: Quest, monthly: Quest }, childName: string, playtimeDuration: number, enablePlaytime: boolean, enableMorning: boolean, enableAfterSchool: boolean, enableBedtime: boolean } }
    | { type: 'START_PLAYTIME' }
    | { type: 'SET_SELECTED_DATE'; payload: string }
    | { type: 'HYDRATE_STATE', payload: AppState };
