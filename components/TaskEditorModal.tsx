import React, { useState, useEffect } from 'react';
import { Task } from '../types';

interface TaskEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (taskData: Omit<Task, 'id' | 'completed'> & { id?: string }) => void;
    taskToEdit: Task | null;
    routineId: string;
}

export const TaskEditorModal: React.FC<TaskEditorModalProps> = ({ isOpen, onClose, onSave, taskToEdit, routineId }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [icon, setIcon] = useState('🌟');
    const [duration, setDuration] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (taskToEdit) {
                setTitle(taskToEdit.title);
                setDescription(taskToEdit.description);
                setIcon(taskToEdit.icon);
                setDuration(taskToEdit.duration ? String(taskToEdit.duration) : '');
            } else {
                // Reset for new task
                setTitle('');
                setDescription('');
                setIcon('🌟');
                setDuration('');
            }
        }
    }, [taskToEdit, isOpen]);

    const handleSave = () => {
        if (!title.trim()) {
            alert('Task title is required.');
            return;
        }
        onSave({
            id: taskToEdit?.id,
            title: title.trim(),
            description: description.trim(),
            icon: icon.trim() || '🌟',
            duration: duration ? parseInt(duration, 10) : undefined,
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">{taskToEdit ? 'Edit Task' : 'Add New Task'}</h2>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-600">Task Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g., Water the plants"
                            className="w-full mt-1 p-2 border border-slate-300 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-600">Description (optional)</label>
                        <input
                            type="text"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="A short description of the task"
                            className="w-full mt-1 p-2 border border-slate-300 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-600">Icon (Emoji)</label>
                        <input
                            type="text"
                            value={icon}
                            onChange={e => setIcon(e.target.value)}
                            maxLength={2}
                            className="w-full mt-1 p-2 border border-slate-300 rounded-lg"
                        />
                    </div>
                    {routineId === 'Bedtime' && (
                         <div>
                            <label className="text-sm font-medium text-slate-600">Timer Duration (seconds, optional)</label>
                            <input
                                type="number"
                                value={duration}
                                onChange={e => setDuration(e.target.value)}
                                placeholder="e.g., 120 for 2 minutes"
                                min="0"
                                className="w-full mt-1 p-2 border border-slate-300 rounded-lg"
                            />
                        </div>
                    )}
                </div>
                <div className="mt-8 flex justify-end gap-4">
                    <button onClick={onClose} className="font-bold text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-200 transition">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="font-bold text-white bg-purple-500 px-4 py-2 rounded-lg hover:bg-purple-600 transition shadow-md">
                        {taskToEdit ? 'Save Changes' : 'Add Task'}
                    </button>
                </div>
            </div>
        </div>
    );
};