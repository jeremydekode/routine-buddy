import React from 'react';
import { Routine } from '../types';
import { TaskCard } from './TaskCard';

interface RoutineViewProps {
    routine: Routine;
}

export const RoutineView: React.FC<RoutineViewProps> = ({ routine }) => {
    if (!routine) return null;

    return (
        <div className="space-y-4">
            {routine.tasks.map(task => (
                <TaskCard key={task.id} task={task} routineId={routine.id} />
            ))}
        </div>
    );
};