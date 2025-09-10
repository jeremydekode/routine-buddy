import React from 'react';
import { SunIcon, CloudIcon, MoonIcon, StarIcon, GamepadIcon } from './components/icons/Icons';
import { Routine, ActiveRoutineId, Quest } from './types';

// FIX: Add 'as const' to give `id` the literal type 'Quests' instead of string.
export const QUESTS_THEME = {
    id: 'Quests',
    name: 'Quests',
    theme: {
        icon: <StarIcon className="text-purple-500" />,
        color: 'bg-purple-100',
    },
} as const;

export const PLAYTIME_THEME = {
    id: 'Playtime',
    name: 'Playtime',
    theme: {
        icon: <GamepadIcon className="text-teal-500" />,
        color: 'bg-teal-100',
    },
} as const;

export const INITIAL_ROUTINES: Record<ActiveRoutineId, Routine> = {
    'Morning': {
        id: 'Morning',
        name: 'Morning Routine',
        tasks: [
            { id: '1', title: 'Make Bed', icon: '🛏️', completed: false },
            { id: '2', title: 'Brush Teeth', icon: '🦷', completed: false },
            { id: '3', title: 'Get Dressed', icon: '👕', completed: false },
        ],
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        theme: {
            icon: <SunIcon className="text-amber-500" />,
            color: 'bg-amber-100',
        },
    },
    'After-School': {
        id: 'After-School',
        name: 'After-School',
        tasks: [
            { id: '4', title: 'Tidy Up Toys', icon: '🧸', completed: false },
            { id: '5', title: 'Snack Time', icon: '🍎', completed: false },
        ],
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        theme: {
            icon: <CloudIcon className="text-sky-500" />,
            color: 'bg-sky-100',
        },
    },
    'Bedtime': {
        id: 'Bedtime',
        name: 'Bedtime Routine',
        tasks: [
             { id: '6', title: 'Put on Pajamas', icon: '👚', completed: false },
             { id: '7', title: 'Brush Teeth', icon: '🦷', completed: false },
             { id: '8', title: 'Read a Book', icon: '📖', completed: false },
        ],
        days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        theme: {
            icon: <MoonIcon className="text-indigo-500" />,
            color: 'bg-indigo-200',
        },
    },
};

export const INITIAL_QUESTS: { weekly: Quest; monthly: Quest } = {
    weekly: {
        id: 'weekly',
        name: 'Weekly Wonder',
        goal: 7,
    },
    monthly: {
        id: 'monthly',
        name: 'Monthly Marvel',
        goal: 30,
    }
};