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
            { title: "AI Disabled", description: "Please set your API_KEY to enable suggestions.", category: 'Fun' }
        ]);
    }
    
    const prompt = `You are an expert in early childhood development. For a 4-year-old child, suggest 3 simple, age-appropriate tasks or character-building quests for their ${timeOfDay} routine. The child is feeling ${feeling}. The tasks should promote discipline, kindness, patience, gratitude, or responsibility. Provide the output in a structured JSON format.`;

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
                            description: {
                                type: Type.STRING,
                                description: 'A brief, simple explanation of the task for the parent.'
                            },
                            category: {
                                type: Type.STRING,
                                enum: ['Kindness', 'Patience', 'Gratitude', 'Responsibility', 'Fun'],
                                description: 'The character trait this task helps develop.'
                            }
                        },
                        required: ["title", "description", "category"]
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
            { title: "Error", description: "Could not fetch AI suggestions at this time.", category: 'Fun' }
        ];
    }
};