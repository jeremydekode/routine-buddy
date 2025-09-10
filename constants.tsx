import React from 'react';
import { SunIcon, CloudIcon, MoonIcon, StarIcon, GamepadIcon } from './components/icons/Icons';
import { Routine, ActiveRoutineId, Quest, DAYS_OF_WEEK, Day } from './types';

export const QUESTS_THEME = {
    id: 'Quests',
    name: 'Quests',
    theme: {
        icon: <StarIcon className="text-yellow-500" />,
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

const WEEKDAYS: Day[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const INITIAL_ROUTINES: Record<ActiveRoutineId, Routine> = {
    'Morning': {
        id: 'Morning',
        name: 'Morning Routine',
        tasks: [
            { id: '1', title: 'Make Bed', icon: '🛏️', days: WEEKDAYS },
            { id: '2', title: 'Brush Teeth', icon: '🦷', days: DAYS_OF_WEEK },
            { id: '3', title: 'Get Dressed', icon: '👕', days: WEEKDAYS },
        ],
        theme: {
            icon: <SunIcon className="text-amber-500" />,
            color: 'bg-amber-100',
        },
    },
    'After-School': {
        id: 'After-School',
        name: 'After-School',
        tasks: [
            { id: '4', title: 'Tidy Up Toys', icon: '🧸', days: WEEKDAYS },
            { id: '5', title: 'Snack Time', icon: '🍎', days: DAYS_OF_WEEK },
        ],
        theme: {
            icon: <CloudIcon className="text-sky-500" />,
            color: 'bg-sky-100',
        },
    },
    'Bedtime': {
        id: 'Bedtime',
        name: 'Bedtime Routine',
        tasks: [
             { id: '6', title: 'Put on Pajamas', icon: '👚', days: DAYS_OF_WEEK },
             { id: '7', title: 'Brush Teeth', icon: '🦷', days: DAYS_OF_WEEK },
             { id: '8', title: 'Read a Book', icon: '📖', days: DAYS_OF_WEEK },
        ],
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
