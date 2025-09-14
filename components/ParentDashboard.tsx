

import * as React from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { StarIcon } from './icons/Icons';
import { ActiveRoutineId, QuestId, DAYS_OF_WEEK, StarAdjustmentLogEntry } from '../types';

const PendingApprovalCard: React.FC<{ questId: QuestId }> = ({ questId }) => {
    const { state, dispatch } = useAppContext();
    const quest = state.quests[questId];

    return (
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
            <p className="font-bold text-amber-800">Pending Approval</p>
            <p className="text-sm text-amber-600 mb-3">"{quest.name}" quest is complete.</p>
            <div className="flex gap-2">
                <button 
                    onClick={() => dispatch({ type: 'APPROVE_QUEST', payload: { questId } })}
                    className="flex-1 bg-green-500 text-white text-sm font-semibold py-2 rounded-lg hover:bg-green-600 transition"
                >
                    Approve
                </button>
                <button 
                     onClick={() => dispatch({ type: 'REJECT_QUEST', payload: { questId } })}
                    className="flex-1 bg-slate-200 text-slate-700 text-sm font-semibold py-2 rounded-lg hover:bg-slate-300 transition"
                >
                    Reject
                </button>
            </div>
        </div>
    );
};

// FIX: Added a helper function to get the local date string to avoid timezone bugs.
const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const ParentDashboard: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { routines, starCount, weeklyQuestPending, monthlyQuestPending, starAdjustmentLog, taskHistory, weeklyQuestLastResetDate, monthlyQuestLastResetDate } = state;

    const [adjustmentAmount, setAdjustmentAmount] = React.useState('');
    const [adjustmentReason, setAdjustmentReason] = React.useState('');
    const [historyTab, setHistoryTab] = React.useState<'weekly' | 'monthly' | 'all'>('weekly');

    const stats = React.useMemo(() => {
        // FIX: Use local date and day for accurate "Today" stats, avoiding UTC-related bugs.
        const today = new Date();
        const todayStr = getLocalDateString(today);
        const todayDay = DAYS_OF_WEEK[today.getDay()];
        
        let totalTasks = 0;
        let completedTasks = 0;
        
        const completedTaskIdsForToday = new Set(taskHistory[todayStr] || []);

        for (const routineId in routines) {
            const routine = routines[routineId as ActiveRoutineId];
            const tasksForToday = routine.tasks.filter(t => t.days.includes(todayDay));
            totalTasks += tasksForToday.length;
            completedTasks += tasksForToday.filter(t => completedTaskIdsForToday.has(t.id)).length;
        }

        const overallProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        return { overallProgress };
    }, [routines, taskHistory]);
    
    const handleAdjustStars = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseInt(adjustmentAmount, 10);
        if (!isNaN(amount) && adjustmentReason.trim()) {
            dispatch({ type: 'ADJUST_STARS', payload: { amount, reason: adjustmentReason.trim() } });
            setAdjustmentAmount('');
            setAdjustmentReason('');
        }
    };

    const filteredLogs = React.useMemo(() => {
        let logs: StarAdjustmentLogEntry[] = [...starAdjustmentLog].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        if (historyTab === 'weekly' && weeklyQuestLastResetDate) {
            return logs.filter(log => new Date(log.date) >= new Date(weeklyQuestLastResetDate));
        }
        if (historyTab === 'monthly' && monthlyQuestLastResetDate) {
            return logs.filter(log => new Date(log.date) >= new Date(monthlyQuestLastResetDate));
        }
        return logs;
    }, [starAdjustmentLog, historyTab, weeklyQuestLastResetDate, monthlyQuestLastResetDate]);
    
    const HistoryTabButton: React.FC<{ tab: typeof historyTab, label: string }> = ({ tab, label }) => (
        <button
            onClick={() => setHistoryTab(tab)}
            className={`px-3 py-1 text-sm font-bold rounded-full transition-colors ${historyTab === tab ? 'bg-purple-500 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
        >
            {label}
        </button>
    );

    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-700 mb-6">Dashboard</h2>

             {(weeklyQuestPending || monthlyQuestPending) && (
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-slate-700 mb-4">Action Center</h3>
                    <div className="space-y-4">
                        {weeklyQuestPending && <PendingApprovalCard questId="weekly" />}
                        {monthlyQuestPending && <PendingApprovalCard questId="monthly" />}
                    </div>
                </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div className="bg-purple-50 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                    <StarIcon className="w-12 h-12 text-yellow-400 mb-2" />
                    <p className="text-5xl font-bold text-slate-700">{starCount}</p>
                    <p className="text-slate-500 font-semibold">Total Stars Earned</p>
                </div>
                 <div className="bg-green-50 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                     <div className="relative w-24 h-24">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e6e6e6" strokeWidth="3" />
                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#4ade80" strokeWidth="3" strokeDasharray={`${stats.overallProgress}, 100`} strokeLinecap="round" />
                        </svg>
                        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                            <span className="text-2xl font-bold text-slate-700">{Math.round(stats.overallProgress)}%</span>
                        </div>
                     </div>
                     <p className="text-slate-500 font-semibold mt-2">Today's Completion</p>
                </div>
            </div>

            <div className="mt-8">
                <h3 className="text-xl font-bold text-slate-700 mb-4">Adjust Stars</h3>
                <form onSubmit={handleAdjustStars} className="bg-slate-50 p-4 rounded-xl space-y-3">
                    <div className="flex gap-3">
                        <input
                            type="number"
                            value={adjustmentAmount}
                            onChange={e => setAdjustmentAmount(e.target.value)}
                            placeholder="e.g. 5 or -2"
                            className="w-1/3 p-2 border border-slate-300 rounded-lg"
                            required
                        />
                         <input
                            type="text"
                            value={adjustmentReason}
                            onChange={e => setAdjustmentReason(e.target.value)}
                            placeholder="Reason (e.g., Helped with chores)"
                            className="w-2/3 p-2 border border-slate-300 rounded-lg"
                            required
                        />
                    </div>
                    <button type="submit" className="w-full bg-purple-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-600 transition">
                        Submit Adjustment
                    </button>
                </form>
            </div>

             <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-700">Star History</h3>
                    <div className="flex gap-2">
                        <HistoryTabButton tab="weekly" label="Weekly" />
                        <HistoryTabButton tab="monthly" label="Monthly" />
                        <HistoryTabButton tab="all" label="All Time" />
                    </div>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto bg-slate-50 p-3 rounded-lg">
                    {filteredLogs.length > 0 ? (
                        filteredLogs.map(log => (
                            <div key={log.id} className="bg-white p-3 rounded-lg flex justify-between items-center text-sm">
                                <div>
                                    <p className="font-semibold text-slate-700">{log.reason}</p>
                                    <p className="text-xs text-slate-400">{new Date(log.date).toLocaleString()}</p>
                                </div>
                                <span className={`font-bold ${log.amount > 0 ? 'text-green-500' : log.amount < 0 ? 'text-red-500' : 'text-slate-500'}`}>
                                    {log.amount > 0 ? `+${log.amount}` : log.amount < 0 ? log.amount : '---'}
                                </span>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-slate-500 py-4">No adjustments in this period yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};