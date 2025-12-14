import { GoogleGenAI, Type } from "@google/genai";
import { AI_Suggestion } from '../types';

// Interface for the curator analysis result
interface AIAnalysisResult {
  analysis: string;
  trivia: string;
  vibes: string[];
}

export const getAIListSuggestions = async (query: string): Promise<AI_Suggestion[]> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.warn("VIRGIL: API Key not found in environment variables.");
      return [];
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a list of 5 films fitting the theme, director, or vibe of: "${query}". 
      Return valid JSON only.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    year: { type: Type.NUMBER },
                    director: { type: Type.STRING }
                },
                required: ["title", "year", "director"]
            }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    // Clean potential markdown code blocks just in case
    const cleanText = text.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    const data = JSON.parse(cleanText) as AI_Suggestion[];
    return data;

  } catch (error) {
    console.error("Gemini List Gen Error:", error);
    return [];
  }
};

export const getFilmAnalysis = async (title: string, director: string, year: number): Promise<AIAnalysisResult | null> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.warn("VIRGIL: Gemini API Key missing.");
        return null;
    }

    const ai = new GoogleGenAI({ apiKey });
    const dirPrompt = director === "Unknown" ? "the film's director" : director;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the film "${title}" (${year}) directed by ${dirPrompt}.
      
      Provide a JSON object with:
      - analysis: A 2-sentence cultural analysis explaining its significance, directorial style, or impact on cinema history. Be intellectual but accessible. NO marketing language.
      - trivia: One fascinating, obscure production fact or trivia about the film.
      - vibes: An array of exactly 3 other film titles that share the exact specific mood, atmosphere, or thematic resonance. Do not include this film itself.`,
      config: {
        systemInstruction: "You are an expert film historian and curator like Roger Ebert or Pauline Kael. You provide insightful, intellectual, and concise analysis in JSON format.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING },
            trivia: { type: Type.STRING },
            vibes: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["analysis", "trivia", "vibes"],
        }
      }
    });

    const text = response.text;
    if (!text) {
        console.warn("Gemini returned empty text.");
        return null;
    }

    // Clean potential markdown code blocks just in case
    const cleanText = text.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    return JSON.parse(cleanText) as AIAnalysisResult;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
};