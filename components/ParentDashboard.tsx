import React, { useMemo, useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { StarIcon } from './icons/Icons';
import { ActiveRoutineId, QuestId, DAYS_OF_WEEK } from '../types';

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

const PendingRoutineCard: React.FC<{ approval: { date: string; routineId: ActiveRoutineId } }> = ({ approval }) => {
    const { state, dispatch } = useAppContext();
    const { date, routineId } = approval;
    const routine = state.routines[routineId];
    if (!routine) return null;

    const handleApprove = () => {
        dispatch({ type: 'APPROVE_ROUTINE_AWARD', payload: { routineId, date } });
    };

    const handleReject = () => {
        dispatch({ type: 'REJECT_ROUTINE_AWARD', payload: { routineId, date } });
    };

    return (
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
            <p className="font-bold text-amber-800">Routine Ready for Review</p>
            <p className="text-sm text-amber-600 mb-3">
                "{routine.name}" completed on {new Date(date.replace(/-/g, '/')).toLocaleDateString()}.
            </p>
            <div className="flex gap-2">
                <button 
                    onClick={handleApprove}
                    className="flex-1 bg-green-500 text-white text-sm font-semibold py-2 rounded-lg hover:bg-green-600 transition"
                >
                    Approve (+1 Star)
                </button>
                <button 
                     onClick={handleReject}
                    className="flex-1 bg-slate-200 text-slate-700 text-sm font-semibold py-2 rounded-lg hover:bg-slate-300 transition"
                >
                    Dismiss
                </button>
            </div>
        </div>
    );
};


export const ParentDashboard: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { routines, starCount, weeklyQuestPending, monthlyQuestPending, starAdjustmentLog, taskHistory, pendingRoutineApprovals } = state;

    const [adjustmentAmount, setAdjustmentAmount] = useState('');
    const [adjustmentReason, setAdjustmentReason] = useState('');

    const stats = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const todayDay = DAYS_OF_WEEK[new Date().getUTCDay()];
        
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


    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-700 mb-6">Dashboard</h2>

             {(weeklyQuestPending || monthlyQuestPending || pendingRoutineApprovals.length > 0) && (
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-slate-700 mb-4">Action Center</h3>
                    <div className="space-y-4">
                        {pendingRoutineApprovals.map((approval) => (
                            <PendingRoutineCard key={`${approval.date}-${approval.routineId}`} approval={approval} />
                        ))}
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
                <h3 className="text-xl font-bold text-slate-700 mb-4">Star History</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto bg-slate-50 p-3 rounded-lg">
                    {starAdjustmentLog.length > 0 ? (
                        starAdjustmentLog.map(log => (
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
                        <p className="text-center text-slate-500 py-4">No adjustments made yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};