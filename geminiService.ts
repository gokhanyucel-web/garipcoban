import { GoogleGenAI, Type } from "@google/genai";
import { AI_Suggestion, FilmAnalysis } from '../types';

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

export const getFilmAnalysis = async (title: string): Promise<FilmAnalysis | null> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return null;

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the film "${title}".
      1. Summary: Provide a one-sentence logline focusing ONLY on the setup or inciting incident. Do not reveal the ending or the main turn of events.
      2. Significance: Why does it matter cinematically?
      3. Fun Fact: One rare production fact.
      Also verify director, year and top cast.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            significance: { type: Type.STRING },
            funFact: { type: Type.STRING },
            director: { type: Type.STRING },
            cast: { type: Type.ARRAY, items: { type: Type.STRING } },
            year: { type: Type.NUMBER },
          },
          required: ["summary", "significance", "funFact", "director", "cast", "year"],
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as FilmAnalysis;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
};