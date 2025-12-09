import { GoogleGenAI, Type } from "@google/genai";
import { AI_Suggestion, FilmAnalysis } from '../types';

// Update interface locally if types.ts cannot be changed easily in this context, 
// or cast result. Ideally FilmAnalysis in types.ts should match, but we can cast.
interface AIAnalysisResult {
  analysis: string;
  trivia: string;
}

export const getAIListSuggestions = async (query: string): Promise<AI_Suggestion[]> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.warn("API Key not found in environment variables.");
      return [
        { title: "Mock Film 1", year: 2024, director: "AI Director" },
        { title: "Mock Film 2", year: 2023, director: "AI Director" },
        { title: "Mock Film 3", year: 2022, director: "AI Director" }
      ];
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
    
    const data = JSON.parse(text) as AI_Suggestion[];
    return data;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return [];
  }
};

export const getFilmAnalysis = async (title: string, director: string, year: number): Promise<AIAnalysisResult | null> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return null;

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Act as a film curator. Return a JSON object with two fields for the film "${title}" (${year}) directed by ${director}:

      1. analysis: A 2-sentence cultural analysis of why '${title}' is significant. NO marketing taglines. Intellectual but accessible tone.
      2. trivia: One fascinating, obscure production fact or trivia about the film.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING },
            trivia: { type: Type.STRING },
          },
          required: ["analysis", "trivia"],
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as AIAnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
};