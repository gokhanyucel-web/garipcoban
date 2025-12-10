import { GoogleGenerativeAI } from "@google/generative-ai";
import { AI_Suggestion } from '../types';

// Interface for the curator analysis result
interface AIAnalysisResult {
  analysis: string;
  trivia: string;
  vibes: string[];
}

export const getAIListSuggestions = async (query: string): Promise<AI_Suggestion[]> => {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) {
      console.warn("API Key not found in environment variables.");
      return [];
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent(`
      Generate a list of 5 films fitting the theme, director, or vibe of: "${query}". 
      Return valid JSON array of objects with title, year, director. No markdown formatting.
    `);

    const text = result.response.text();
    // JSON temizliği (Markdown backtick'lerini temizle)
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanText) as AI_Suggestion[];

  } catch (error) {
    console.error("Gemini API Error:", error);
    return [];
  }
};

export const getFilmAnalysis = async (title: string, director: string, year: number, context?: string): Promise<AIAnalysisResult | null> => {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY;
    if (!apiKey) return null;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const promptContext = context 
        ? `CONTEXT: This film is part of a curated list titled "${context}". Explain why it fits THIS specific list.` 
        : `CONTEXT: General cinematic analysis.`;

    const result = await model.generateContent(`
      Analyze the film "${title}" (${year}) directed by ${director}.
      
      ${promptContext}

      Output MUST be valid JSON with these keys:
      1. analysis: A 2-sentence sophisticated analysis explaining its significance in this context.
      2. trivia: One obscure production fact.
      3. vibes: Array of 3 film titles sharing the specific mood (not same director).
      
      Return ONLY JSON. No markdown.
    `);

    const text = result.response.text();
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanText) as AIAnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
};