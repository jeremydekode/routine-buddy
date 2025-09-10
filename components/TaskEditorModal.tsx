import React, { useState, useEffect } from 'react';
import { Task, Day, DAYS_OF_WEEK } from '../types';

interface TaskEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (taskData: Omit<Task, 'id'> & { id?: string }) => void;
    taskToEdit: Task | null;
    routineId: string;
}

const ICON_OPTIONS = ['🌟', '🧸', '🍎', '🦷', '👕', '🛏️', '📖', '👚', '👟', '🧼', '🍽️', '🎨', '🧩', '🚲', '🥕', '💧', '☀️', '🌙', '❤️', '👍', '🥦', '🛁', '🎒', '🐶'];

export const TaskEditorModal: React.FC<TaskEditorModalProps> = ({ isOpen, onClose, onSave, taskToEdit, routineId }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [icon, setIcon] = useState('🌟');
    const [duration, setDuration] = useState('');
    const [days, setDays] = useState<Day[]>([...DAYS_OF_WEEK]);

    useEffect(() => {
        if (isOpen) {
            if (taskToEdit) {
                setTitle(taskToEdit.title);
                setIcon(taskToEdit.icon);
                setDescription(taskToEdit.description || '');
                setDuration(taskToEdit.duration ? String(taskToEdit.duration) : '');
                setDays(taskToEdit.days || [...DAYS_OF_WEEK]);
            } else {
                // Reset for new task
                setTitle('');
                setIcon('🌟');
                setDescription('');
                setDuration('');
                setDays([...DAYS_OF_WEEK]);
            }
        }
    }, [taskToEdit, isOpen]);

    const handleDayToggle = (day: Day) => {
        setDays(prevDays => 
            prevDays.includes(day)
            ? prevDays.filter(d => d !== day)
            : [...prevDays, day]
        );
    };

    const handleSave = () => {
        if (!title.trim()) {
            alert('Task title is required.');
            return;
        }
        if (days.length === 0) {
            alert('Please select at least one day for the task.');
            return;
        }
        onSave({
            id: taskToEdit?.id,
            title: title.trim(),
            description: description.trim() || undefined,
            icon: icon,
            days: days,
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
                            placeholder="e.g., Use the green watering can"
                            className="w-full mt-1 p-2 border border-slate-300 rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-slate-600">Icon</label>
                        <div className="mt-2 grid grid-cols-8 gap-2 bg-slate-50 p-2 rounded-lg">
                            {ICON_OPTIONS.map((ico) => (
                                <button
                                    key={ico}
                                    type="button"
                                    onClick={() => setIcon(ico)}
                                    className={`text-2xl rounded-lg p-2 transition-all ${
                                        icon === ico
                                            ? 'bg-purple-500 ring-2 ring-purple-300 ring-offset-2'
                                            : 'bg-slate-200 hover:bg-slate-300'
                                    }`}
                                    aria-label={ico}
                                >
                                    {ico}
                                </button>
                            ))}
                        </div>
                    </div>
                     <div>
                        <h3 className="text-sm font-medium text-slate-600 mb-2">Active Days</h3>
                        <div className="flex flex-wrap gap-2">
                            {DAYS_OF_WEEK.map(day => (
                                <button
                                    key={day}
                                    onClick={() => handleDayToggle(day)}
                                    className={`px-3 py-1 text-sm font-bold rounded-full transition-colors ${
                                        days.includes(day)
                                        ? 'bg-purple-500 text-white'
                                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                    }`}
                                >{day.slice(0, 3)}</button>
                            ))}
                        </div>
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