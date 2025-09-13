import * as React from 'react';

export enum Mode {
    Parent,
    Child,
}

export type Day = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export const DAYS_OF_WEEK: Day[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export interface Task {
    id: string;
    title: string;
    icon: string;
    description?: string;
    duration?: number; // in seconds
    days: Day[];
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

export interface StarAdjustmentLogEntry {
    id: string;
    date: string;
    amount: number;
    reason: string;
}

export interface AppState {
    mode: Mode;
    selectedDate: string;
    activeRoutine: ActiveRoutineId | 'Quests' | 'Playtime' | 'Character';
    routines: Record<ActiveRoutineId, Routine>;
    quests: {
        weekly: Quest;
        monthly: Quest;
    };
    characterQuests: CharacterQuest[];
    taskHistory: Record<string, string[]>; // date -> task_id[]
    starCount: number;
    weeklyQuestPending: boolean;
    monthlyQuestPending: boolean;
    starAdjustmentLog: StarAdjustmentLogEntry[];
    childName: string;
    playtimeDuration: number; // in minutes
    playtimeStarted: boolean; // has it been started for the day
    enablePlaytime: boolean;
    enableMorning: boolean;
    enableAfterSchool: boolean;
    enableBedtime: boolean;
    enableCharacterQuests: boolean;
    weeklyQuestResetEnabled: boolean;
    monthlyQuestResetEnabled: boolean;
    isLoading: boolean;
    isLoggedIn: boolean;
    showPasswordModal: boolean;
    isGuest: boolean;
    showOnboarding: boolean;
}