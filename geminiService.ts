import { GoogleGenAI } from "@google/genai";
import { AI_Suggestion } from '../types';

// Interface for the curator analysis result
interface AIAnalysisResult {
  analysis: string;
  trivia: string;
  vibes: string[];
}

const cleanAndParseJSON = <T>(text: string): T | null => {
    try {
        // 1. Try direct parse
        return JSON.parse(text) as T;
    } catch (e) {
        // 2. Try removing markdown code blocks
        try {
            const cleanText = text.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
            return JSON.parse(cleanText) as T;
        } catch (e2) {
            // 3. Try finding the first '{' and last '}' (Extract JSON object)
            try {
                const match = text.match(/\{[\s\S]*\}/);
                if (match) {
                    return JSON.parse(match[0]) as T;
                }
            } catch (e3) {
                 // 4. Try finding array '[' and ']'
                 try {
                    const matchArr = text.match(/\[[\s\S]*\]/);
                    if (matchArr) {
                        return JSON.parse(matchArr[0]) as T;
                    }
                 } catch (e4) {
                    console.error("VIRGIL: Failed to parse Gemini response", text);
                 }
            }
        }
    }
    return null;
};

export const getAIListSuggestions = async (query: string): Promise<AI_Suggestion[]> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.warn("VIRGIL: API Key not found in environment variables.");
      return [];
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Using a simpler prompt structure for maximum compatibility
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a list of 5 films fitting the theme, director, or vibe of: "${query}". 
      Return ONLY a valid JSON array of objects.
      Format: [{"title": "Film Title", "year": 1999, "director": "Director Name"}, ...]`,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) return [];
    
    return cleanAndParseJSON<AI_Suggestion[]>(text) || [];

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
      
      Return a single valid JSON object (no markdown) with these exact keys:
      {
        "analysis": "A sophisticated 2-sentence cultural analysis.",
        "trivia": "One fascinating obscure fact.",
        "vibes": ["Film Title 1", "Film Title 2", "Film Title 3"]
      }`,
      config: {
        responseMimeType: "application/json",
        // Removing strict responseSchema to avoid potential API 400 errors with certain keys/models
      }
    });

    const text = response.text;
    if (!text) {
        console.warn("Gemini returned empty text.");
        return null;
    }

    const result = cleanAndParseJSON<AIAnalysisResult>(text);
    if (!result) {
        console.warn("VIRGIL: Could not parse analysis JSON.", text);
    }
    return result;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
};