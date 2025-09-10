import React, { useState, useCallback, useEffect } from 'react';
import { getAiSuggestions } from '../services/geminiService';
import { AiSuggestion } from '../types';

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
    </div>
);

const SuggestionCard: React.FC<{ suggestion: AiSuggestion }> = ({ suggestion }) => {
    const categoryColors: Record<string, string> = {
        Kindness: 'bg-pink-100 text-pink-700',
        Patience: 'bg-sky-100 text-sky-700',
        Gratitude: 'bg-amber-100 text-amber-700',
        Responsibility: 'bg-green-100 text-green-700',
        Fun: 'bg-indigo-100 text-indigo-700',
    };

    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <h4 className="font-bold text-slate-800">{suggestion.title}</h4>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${categoryColors[suggestion.category] || 'bg-gray-100 text-gray-700'}`}>
                    {suggestion.category}
                </span>
            </div>
            <p className="text-slate-500 mt-1 text-sm">{suggestion.description}</p>
            <div className="mt-4 flex gap-2">
                <button className="flex-1 bg-purple-500 text-white text-sm font-semibold py-2 rounded-lg hover:bg-purple-600 transition">Add to Routine</button>
                <button className="flex-1 bg-slate-200 text-slate-700 text-sm font-semibold py-2 rounded-lg hover:bg-slate-300 transition">Dismiss</button>
            </div>
        </div>
    );
};

export const AiSuggestions: React.FC = () => {
    const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [timeOfDay, setTimeOfDay] = useState<'Morning' | 'After-School' | 'Bedtime'>('After-School');
    const [feeling, setFeeling] = useState('Happy');

    const fetchSuggestions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await getAiSuggestions(timeOfDay, feeling.toLowerCase());
            setSuggestions(result);
        } catch (err) {
            setError('Failed to fetch suggestions.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [timeOfDay, feeling]);

    useEffect(() => {
        fetchSuggestions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const feelings = ["Happy", "Tired", "Excited", "Calm", "Grumpy"];

    return (
        <div>
            <h2 className="text-2xl font-bold text-slate-700 mb-4">AI Quest Ideas</h2>
            <div className="bg-slate-50 p-4 rounded-xl mb-6 flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex-1 w-full">
                    <label className="text-sm font-medium text-slate-600">Child's Feeling:</label>
                    <select value={feeling} onChange={e => setFeeling(e.target.value)} className="w-full mt-1 p-2 border border-slate-300 rounded-lg focus:ring-purple-500 focus:border-purple-500">
                        {feelings.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                </div>
                <div className="flex-1 w-full">
                    <label className="text-sm font-medium text-slate-600">Routine:</label>
                     <select value={timeOfDay} onChange={e => setTimeOfDay(e.target.value as any)} className="w-full mt-1 p-2 border border-slate-300 rounded-lg focus:ring-purple-500 focus:border-purple-500">
                        <option value="Morning">Morning</option>
                        <option value="After-School">After-School</option>
                        <option value="Bedtime">Bedtime</option>
                    </select>
                </div>
                <button onClick={fetchSuggestions} disabled={loading} className="w-full sm:w-auto mt-2 sm:mt-6 self-end bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 transition disabled:bg-purple-300">
                    {loading ? 'Thinking...' : 'Get Ideas'}
                </button>
            </div>
            
            {loading && <LoadingSpinner />}
            {error && <p className="text-red-500 text-center">{error}</p>}
            {!loading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {suggestions.map((s, i) => <SuggestionCard key={i} suggestion={s} />)}
                </div>
            )}
        </div>
    );
};