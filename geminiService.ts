import { GoogleGenAI, Type } from "@google/genai";
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
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a list of 5 films fitting the theme, director, or vibe of: "${query}". 
      Return ONLY a valid JSON array. No markdown formatting.`,
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
      
      Return valid JSON only. Structure:
      {
        "analysis": "Two sophisticated sentences about cultural significance or style.",
        "trivia": "One obscure fact.",
        "vibes": ["Film 1", "Film 2", "Film 3"]
      }`,
      config: {
        systemInstruction: "You are an expert film curator. Provide output in pure JSON format without Markdown code blocks.",
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