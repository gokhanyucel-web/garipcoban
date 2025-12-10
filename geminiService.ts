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
    // Vite ve Process env desteği (Garanti çözüm)
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY;
    
    if (!apiKey) {
      console.warn("API Key not found in environment variables.");
      return [];
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash", // Hızlı ve güncel model
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

    const text = response.text(); 
    if (!text) return [];
    
    const data = JSON.parse(text) as AI_Suggestion[];
    return data;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return [];
  }
};

export const getFilmAnalysis = async (title: string, director: string, year: number, context?: string): Promise<AIAnalysisResult | null> => {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) return null;

    const ai = new GoogleGenAI({ apiKey });
    
    // Prompt: Eğer context (liste adı) varsa ona odaklan, yoksa genel analiz yap.
    const promptContext = context 
        ? `CONTEXT: This film is part of a curated list titled "${context}". Explain why it fits THIS specific list.` 
        : `CONTEXT: General cinematic analysis.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Analyze the film "${title}" (${year}) directed by ${director}.
      
      ${promptContext}

      1. analysis: Write a 2-sentence sophisticated analysis explaining its significance specifically regarding the CONTEXT provided above. If the context is a Director's list, focus on their style. If it's a theme, focus on that theme.
      2. trivia: Provide one fascinating, obscure production fact.
      3. vibes: List exactly 3 other film titles that share the exact specific MOOD, ATMOSPHERE, or PHILOSOPHY of this film. Do NOT list films by the same director. Do NOT include this film itself.
      `,
      config: {
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

    const text = response.text();
    if (!text) return null;
    return JSON.parse(text) as AIAnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
};