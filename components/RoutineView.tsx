import React, { useEffect, useMemo } from 'react';
import { Routine } from '../types';
import { TaskCard } from './TaskCard';
import { useAppContext } from '../hooks/useAppContext';
import { generateTaskImage } from '../services/geminiService';

interface RoutineViewProps {
    routine: Routine;
}

const IMAGE_CACHE_PREFIX = 'task-image-';
const THROTTLE_MS = 1500; // 1.5 second delay between image generation requests

export const RoutineView: React.FC<RoutineViewProps> = ({ routine }) => {
    const { state, dispatch } = useAppContext();
    const { imageGenerationApiRateLimited } = state;
    
    // Create a stable dependency based on the tasks that need processing.
    const taskIdsToProcess = useMemo(() =>
        routine.tasks.filter(t => typeof t.image === 'undefined').map(t => t.id).join(','),
        [routine.tasks]
    );

    useEffect(() => {
        if (!routine || imageGenerationApiRateLimited || !taskIdsToProcess) return;

        let isCancelled = false;
        
        const generateImagesForRoutine = async () => {
            // Filter tasks inside the effect to get the full task objects
            const tasksToProcess = routine.tasks.filter(task => typeof task.image === 'undefined');

            for (const task of tasksToProcess) {
                if (isCancelled || state.imageGenerationApiRateLimited) break;

                try {
                    const cacheKey = `${IMAGE_CACHE_PREFIX}${task.id}`;
                    const cachedImage = localStorage.getItem(cacheKey);

                    if (cachedImage) {
                        if (!isCancelled) {
                             dispatch({ type: 'SET_TASK_IMAGE', payload: { routineId: routine.id, taskId: task.id, imageUrl: cachedImage } });
                        }
                        continue;
                    }

                    // Throttle before making an API call
                    if (!isCancelled) {
                        await new Promise(resolve => setTimeout(resolve, THROTTLE_MS));
                    }
                    
                    if (isCancelled) break;

                    const imageUrl = await generateTaskImage(task.title);

                    if (isCancelled) break;
                    
                    const finalImageUrl = imageUrl || 'FAILED';
                    
                    dispatch({ type: 'SET_TASK_IMAGE', payload: { routineId: routine.id, taskId: task.id, imageUrl: finalImageUrl } });
                    
                    if (imageUrl) {
                        localStorage.setItem(cacheKey, imageUrl);
                    }

                } catch (error: any) {
                    // Check for rate limit error from the service
                     if (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED')) {
                        console.warn("API Rate Limit hit. Halting further image generation for this session.");
                        dispatch({ type: 'SET_IMAGE_API_RATE_LIMITED' });
                        // Mark remaining unprocessed tasks as FAILED so they show icons
                        tasksToProcess.forEach(t => {
                            if (typeof t.image === 'undefined') {
                                dispatch({ type: 'SET_TASK_IMAGE', payload: { routineId: routine.id, taskId: t.id, imageUrl: 'FAILED' } });
                            }
                        });
                        break; // Exit the loop
                    } else {
                        console.error(`Failed to process image for task "${task.title}":`, error);
                         if (!isCancelled) {
                            dispatch({ type: 'SET_TASK_IMAGE', payload: { routineId: routine.id, taskId: task.id, imageUrl: 'FAILED' } });
                         }
                    }
                }
            }
        };

        generateImagesForRoutine();

        return () => {
            isCancelled = true;
        };
    // This effect now re-runs only when the list of tasks needing an image changes.
    }, [routine.id, taskIdsToProcess, dispatch, imageGenerationApiRateLimited, state.imageGenerationApiRateLimited]);


    if (!routine) return null;

    return (
        <div className="space-y-4">
            {routine.tasks.map(task => (
                <TaskCard key={task.id} task={task} routineId={routine.id} />
            ))}
        </div>
    );
};