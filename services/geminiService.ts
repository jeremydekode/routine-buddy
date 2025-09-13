import { GoogleGenAI, Type } from "@google/genai";
import { AiSuggestion } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const getAiSuggestions = async (timeOfDay: 'Morning' | 'After-School' | 'Bedtime', feeling: string): Promise<AiSuggestion[]> => {
    if (!API_KEY) {
        return Promise.resolve([
            { title: "AI Disabled", category: 'Fun' }
        ]);
    }
    
    const prompt = `You are an expert in early childhood development. For a 4-year-old child, suggest 3 simple, age-appropriate tasks or character-building quests for their ${timeOfDay} routine. The child is feeling ${feeling}. The tasks should promote discipline, kindness, patience, gratitude, or responsibility. Each task should have a title and a category. Provide the output in a structured JSON format.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: {
                                type: Type.STRING,
                                description: 'A short, fun title for the task or quest.'
                            },
                            category: {
                                type: Type.STRING,
                                enum: ['Kindness', 'Patience', 'Gratitude', 'Responsibility', 'Fun'],
                                description: 'The character trait this task helps develop.'
                            }
                        },
                        required: ["title", "category"]
                    },
                },
            },
        });

        const jsonStr = response.text.trim();
        const suggestions: AiSuggestion[] = JSON.parse(jsonStr);
        return suggestions;

    } catch (error) {
        console.error("Error fetching AI suggestions:", error);
        return [
            { title: "Error", category: 'Fun' }
        ];
    }
};

export const generateQuestImage = async (questItemDescription: string): Promise<string | null> => {
    if (!API_KEY) {
        console.warn("API_KEY not set. Image generation disabled.");
        return null;
    }

    const prompt = `A colorful, child-friendly 3D illustration of a ${questItemDescription}. 
Style: bright, playful, smooth toy-like render, high detail, no background clutter. 
Perfect for a kids' quest app.`;

    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/png',
              aspectRatio: '1:1',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/png;base64,${base64ImageBytes}`;
        }
        return null;
    } catch (error) {
        console.error("Error generating quest image:", error);
        return null;
    }
};