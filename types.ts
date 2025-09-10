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
    description: string;
    icon: string; // emoji
    completed: boolean;
    image?: string | 'FAILED'; // URL or base64 string, or 'FAILED'
    duration?: number; // Optional: duration in seconds for timed tasks
}

export interface RoutineTheme {
    icon: React.ReactNode;
    color: string;
}

export type ActiveRoutineId = 'Morning' | 'After-School' | 'Bedtime';

export type ActiveViewId = ActiveRoutineId | 'Quests';

export interface Routine {
    id: ActiveRoutineId;
    name: string;
    tasks: Task[];
    days: Day[];
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
    description: string;
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
    completedRoutinesToday: ActiveRoutineId[];
    lastCompletionDate: string; // YYYY-MM-DD
    imageGenerationApiRateLimited: boolean;
    weeklyQuestPending: boolean;
    monthlyQuestPending: boolean;
    starAdjustmentLog: StarAdjustment[];
    childName: string;
    passwordIsSet: boolean;
    showPasswordModal: boolean;
}

// Actions
export type AppAction =
    | { type: 'TOGGLE_MODE' }
    | { type: 'SET_ACTIVE_ROUTINE'; payload: ActiveViewId }
    | { type: 'TOGGLE_TASK_COMPLETION'; payload: { routineId: ActiveRoutineId; taskId: string } }
    | { type: 'ADD_TASK'; payload: { routineId: ActiveRoutineId; task: Omit<Task, 'id' | 'completed'> } }
    | { type: 'UPDATE_TASK'; payload: { routineId: ActiveRoutineId; task: Task } }
    | { type: 'DELETE_TASK'; payload: { routineId: ActiveRoutineId; taskId: string } }
    | { type: 'UPDATE_ROUTINE_DAYS'; payload: { routineId: ActiveRoutineId; days: Day[] } }
    | { type: 'UPDATE_QUEST'; payload: { quest: Quest } }
    | { type: 'AWARD_STAR_FOR_ROUTINE'; payload: { routineId: ActiveRoutineId } }
    | { type: 'SET_TASK_IMAGE'; payload: { routineId: ActiveRoutineId; taskId: string; imageUrl: string | 'FAILED' } }
    | { type: 'RESET_DAILY_STATE' }
    | { type: 'SET_IMAGE_API_RATE_LIMITED' }
    | { type: 'REQUEST_QUEST_APPROVAL'; payload: { questId: QuestId } }
    | { type: 'APPROVE_QUEST'; payload: { questId: QuestId } }
    | { type: 'REJECT_QUEST'; payload: { questId: QuestId } }
    | { type: 'ADJUST_STARS'; payload: { amount: number; reason: string } }
    | { type: 'UPDATE_CHILD_NAME'; payload: string }
    | { type: 'SET_PASSWORD_STATUS'; payload: boolean }
    | { type: 'SHOW_PASSWORD_MODAL' }
    | { type: 'HIDE_PASSWORD_MODAL' }
    | { type: 'UPDATE_PARENT_SETTINGS'; payload: { routines: Record<ActiveRoutineId, Routine>, quests: { weekly: Quest, monthly: Quest }, childName: string } };