import React, { useState } from 'react';
import { ActiveRoutineId, Routine, Task } from '../types';
import { PlusIcon, TrashIcon, PencilIcon } from './icons/Icons';
import { TaskEditorModal } from './TaskEditorModal';

interface RoutineConfiguratorProps {
    routines: Record<ActiveRoutineId, Routine>;
    onRoutinesChange: (routines: Record<ActiveRoutineId, Routine>) => void;
}

export const RoutineConfigurator: React.FC<RoutineConfiguratorProps> = ({ routines, onRoutinesChange }) => {
    const [selectedRoutine, setSelectedRoutine] = useState<ActiveRoutineId>('Morning');
    
    // State for the editor modal
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

    const routine = routines[selectedRoutine];

    const handleOpenEditorForNew = () => {
        setTaskToEdit(null);
        setIsEditorOpen(true);
    };

    const handleOpenEditorForEdit = (task: Task) => {
        setTaskToEdit(task);
        setIsEditorOpen(true);
    };

    // FIX: Remove 'completed' from Omit type as it doesn't exist on Task.
    const handleSaveTask = (taskData: Omit<Task, 'id'> & { id?: string }) => {
        const newRoutines = { ...routines };
        const currentRoutine = newRoutines[selectedRoutine];

        if (taskData.id) { // Existing task
            const taskIndex = currentRoutine.tasks.findIndex(t => t.id === taskData.id);
            if (taskIndex > -1) {
                // Ensure days property is always an array
                const updatedTask = { ...currentRoutine.tasks[taskIndex], ...taskData, days: taskData.days || [] };
                currentRoutine.tasks[taskIndex] = updatedTask as Task;
            }
        } else { // New task
             const newTask: Task = {
                 ...taskData,
                 id: new Date().toISOString(),
                 // FIX: Remove 'completed' property as it doesn't exist on Task type.
                 days: taskData.days || [],
             };
             currentRoutine.tasks.push(newTask);
        }
        
        onRoutinesChange(newRoutines);
    };


    const handleDeleteTask = (taskId: string) => {
        const newRoutines = { ...routines };
        const currentRoutine = newRoutines[selectedRoutine];
        newRoutines[selectedRoutine] = { ...currentRoutine, tasks: currentRoutine.tasks.filter(t => t.id !== taskId) };
        onRoutinesChange(newRoutines);
    };
    
    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-700 mb-4">Edit Routines</h2>
            
            <div className="mb-6">
                <label className="text-sm font-medium text-slate-600">Select Routine:</label>
                <select 
                    value={selectedRoutine} 
                    onChange={e => setSelectedRoutine(e.target.value as ActiveRoutineId)}
                    className="w-full mt-1 p-2 border border-slate-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                >
                    {Object.keys(routines).map(key => (
                        <option key={key} value={key}>{routines[key as ActiveRoutineId].name}</option>
                    ))}
                </select>
            </div>

            {routine && (
                <div>
                    <h3 className="text-lg font-semibold text-slate-600 mb-3">Tasks for {routine.name}</h3>
                    <div className="space-y-3 mb-6">
                        {routine.tasks.map(task => (
                            <div key={task.id} className="flex items-center bg-slate-50 p-3 rounded-lg">
                                <span className="mr-3 text-lg">{task.icon}</span>
                                <div className="flex-grow">
                                    <p className="font-semibold text-slate-800">{task.title}</p>
                                    <div className="flex gap-1 mt-1">
                                        {task.days.map(day => (
                                            <span key={day} className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">{day.slice(0,3)}</span>
                                        ))}
                                    </div>
                                </div>
                                <button onClick={() => handleOpenEditorForEdit(task)} className="text-slate-400 hover:text-purple-500 transition-colors p-2">
                                    <PencilIcon className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleDeleteTask(task.id)} className="text-slate-400 hover:text-red-500 transition-colors p-2">
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                    
                    <button onClick={handleOpenEditorForNew} className="w-full bg-purple-100 text-purple-700 font-bold py-3 px-4 rounded-lg hover:bg-purple-200 transition flex items-center justify-center gap-2">
                        <PlusIcon className="w-5 h-5" />
                        Add New Task
                    </button>
                </div>
            )}
             <TaskEditorModal 
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                onSave={handleSaveTask}
                taskToEdit={taskToEdit}
                routineId={selectedRoutine}
            />
        </div>
    );
};
