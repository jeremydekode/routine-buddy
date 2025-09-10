import React from 'react';

export enum Mode {
    Child = 'child',
    Parent = 'parent',
}

export const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
export type Day = typeof DAYS_OF_WEEK[number];

export interface Task {
    id: string;
    title: string;
    icon: string;
    days: Day[];
    description?: string;
    duration?: number; // in seconds
}

export interface Theme {
    icon: React.ReactNode;
    color: string;
}

export interface Routine {
    id: ActiveRoutineId;
    name: string;
    tasks: Task[];
    theme: Theme;
}

export type ActiveRoutineId = 'Morning' | 'After-School' | 'Bedtime';
export type ActiveView = ActiveRoutineId | 'Quests' | 'Playtime';

export type QuestId = 'weekly' | 'monthly';
export interface Quest {
    id: QuestId;
    name: string;
    goal: number;
}

export type CharacterQuestCategory = 'Patience' | 'Gratitude' | 'Kindness' | 'Responsibility';

export interface CharacterQuest {
    id: string;
    title: string;
    category: CharacterQuestCategory;
    goal: number;
    progress: number;
    lastCompletedDate: string | null;
}

export interface AiSuggestion {
    title: string;
    category: CharacterQuestCategory | 'Fun';
}

export interface StarAdjustmentLogItem {
    id: string;
    amount: number;
    reason: string;
    date: string;
}

export interface PendingRoutineApproval {
    date: string;
    routineId: ActiveRoutineId;
}

export interface AppState {
    mode: Mode;
    routines: Record<ActiveRoutineId, Routine>;
    activeRoutine: ActiveView;
    selectedDate: string;
    taskHistory: Record<string, string[]>; // date -> taskId[]
    starCount: number;
    quests: {
        weekly: Quest;
        monthly: Quest;
    };
    weeklyQuestPending: boolean;
    monthlyQuestPending: boolean;
    pendingRoutineApprovals: PendingRoutineApproval[];
    starAdjustmentLog: StarAdjustmentLogItem[];
    childName: string;
    playtimeDuration: number; // in minutes
    playtimeStarted: boolean;
    enablePlaytime: boolean;
    enableMorning: boolean;
    enableAfterSchool: boolean;
    enableBedtime: boolean;
    showPasswordModal: boolean;
    passwordIsSet: boolean;
    characterQuests: CharacterQuest[];
    enableCharacterQuests: boolean;
}

export type AppAction =
    | { type: 'TOGGLE_MODE' }
    | { type: 'SET_ACTIVE_ROUTINE'; payload: ActiveView }
    | { type: 'SET_SELECTED_DATE'; payload: string }
    | { type: 'TOGGLE_TASK_COMPLETION'; payload: { taskId: string; date: string } }
    | { type: 'UPDATE_PARENT_SETTINGS'; payload: Partial<AppState> }
    | { type: 'APPROVE_QUEST'; payload: { questId: QuestId } }
    | { type: 'REJECT_QUEST'; payload: { questId: QuestId } }
    | { type: 'REQUEST_QUEST_APPROVAL'; payload: { questId: QuestId } }
    | { type: 'ADJUST_STARS'; payload: { amount: number; reason: string } }
    | { type: 'APPROVE_ROUTINE_AWARD', payload: { routineId: ActiveRoutineId, date: string } }
    | { type: 'REJECT_ROUTINE_AWARD', payload: { routineId: ActiveRoutineId, date: string } }
    | { type: 'START_PLAYTIME' }
    | { type: 'SHOW_PASSWORD_MODAL' }
    | { type: 'HIDE_PASSWORD_MODAL' }
    | { type: 'SET_PASSWORD_STATUS'; payload: boolean }
    | { type: 'INCREMENT_CHARACTER_QUEST'; payload: string } // by quest id
    | { type: 'LOAD_STATE'; payload: AppState };