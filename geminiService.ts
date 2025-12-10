import { AI_Suggestion, FilmAnalysis } from '../types';

interface AIAnalysisResult {
  analysis: string;
  trivia: string;
  vibes: string[];
}

// YARDIMCI: Güvenli JSON Temizleyici
const cleanAndParseJSON = (text: string) => {
  try {
    // Markdown formatındaki (```json ... ```) fazlalıkları temizle
    let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
    // Bazen AI en başa veya sona gereksiz karakter koyabilir, onları da temizleyelim
    if (clean.startsWith('`')) clean = clean.slice(1);
    if (clean.endsWith('`')) clean = clean.slice(0, -1);
    return JSON.parse(clean);
  } catch (e) {
    console.error("JSON Parse Hatası:", e);
    return null;
  }
};

export const getAIListSuggestions = async (query: string): Promise<AI_Suggestion[]> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) { console.warn("API Key Eksik!"); return []; }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{
      parts: [{
        text: `Generate a list of 5 films fitting the theme, director, or vibe of: "${query}". 
               Return strictly a JSON array of objects with keys: "title", "year", "director". 
               Do NOT use markdown. Just raw JSON.`
      }]
    }]
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!rawText) return [];
    return cleanAndParseJSON(rawText) || [];

  } catch (error) {
    console.error("Gemini API Error:", error);
    return [];
  }
};

export const getFilmAnalysis = async (title: string, director: string, year: number, context?: string): Promise<AIAnalysisResult | null> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  const promptContext = context 
    ? `CONTEXT: This film is part of a curated list titled "${context}". Explain why it fits THIS specific list.` 
    : `CONTEXT: General cinematic analysis.`;

  const prompt = `Analyze the film "${title}" (${year}) directed by ${director}.
      
      ${promptContext}

      Output MUST be valid JSON with these exact keys:
      1. analysis: A 2-sentence sophisticated analysis explaining its significance in this context.
      2. trivia: One obscure production fact.
      3. vibes: Array of exactly 3 other film titles sharing the specific mood (do NOT list films by the same director).
      
      Return ONLY raw JSON. No markdown formatting.`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }]
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) return null;
    return cleanAndParseJSON(rawText);

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
};