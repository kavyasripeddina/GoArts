// GoArts AI - Gemini AI Service using official @google/genai SDK
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini client safely from environment variable (never exposed to client or logs)
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) return null;
  return new GoogleGenAI({ apiKey: apiKey.trim() });
};

// Candidate models in order of capability and speed
const GEMINI_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
  'gemini-3.8-flash',
  'gemini-2.5-flash',
  'gemini-pro-latest',
];

/**
 * Execute Gemini request across candidate models with automatic failover
 */
async function callGemini(contents, systemInstruction = '', responseSchema = null) {
  const ai = getGeminiClient();
  if (!ai) return null; // No API key configured -> fallback

  const config = {};
  if (systemInstruction) config.systemInstruction = systemInstruction;
  if (responseSchema) {
    config.responseMimeType = 'application/json';
    config.responseSchema = responseSchema;
  }

  for (const model of GEMINI_MODELS) {
    try {
      const response = await Promise.race([
        ai.models.generateContent({
          model,
          contents,
          config,
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Gemini API timeout (5s)')), 5000)),
      ]);

      const text = response?.text;
      if (text && text.trim()) {
        return { text: text.trim(), model };
      }
    } catch (err) {
      // Gracefully continue to next model on 404, 503, 429 quota exhaustion or timeouts
      // Security rule: NEVER print API key or sensitive credentials in logs
      const status = err.status || err.code || 'ERROR';
      const cleanMessage = (err.message || '').replace(/AIza[a-zA-Z0-9_\-]{20,}/g, '[REDACTED_API_KEY]');
      // Informative internal trace without exposing secrets
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[Gemini SDK] Model "${model}" failed (${status}): ${cleanMessage.slice(0, 140)}... Trying next candidate.`);
      }
    }
  }

  return null; // All models unavailable or quota exceeded -> triggers rule-based fallback
}

/**
 * AI Event Planner with structured Gemini output
 */
export async function planEventWithGemini({
  description,
  eventType,
  city,
  budget,
  date,
  audienceSize,
  language,
  availableArtists = [],
}) {
  const prompt = `You are the lead event production director and talent curator for GoArts AI, India's premier live entertainment booking platform.
Generate a structured, highly tailored event entertainment production blueprint based on these parameters:
- Event Type: ${eventType || 'Celebration'}
- City / Destination: ${city || 'India'}
- Target Entertainment Budget: ₹${budget || '1,00,000'}
- Audience Size: ${audienceSize || '250'} guests
- Preferred Language: ${language || 'Any / Multilingual'}
- Event Date: ${date || 'Upcoming'}
- Client Vision / Description: "${description || ''}"

Return a valid JSON object strictly matching this schema:
{
  "interpretedRequirements": {
    "eventType": string,
    "city": string,
    "budget": string (formatted in INR e.g. "₹1,50,000"),
    "audienceSize": string,
    "language": string,
    "date": string
  },
  "suggestedCategories": string[] (e.g. ["Singer", "DJ", "Cultural Troupe"]),
  "budgetAllocation": [
    { "category": string, "allocated": number, "note": string }
  ],
  "timeline": [
    { "time": string, "task": string }
  ],
  "technicalRequirements": string[],
  "assumptions": string[]
}
Ensure all budget numbers in budgetAllocation sum up to roughly the total budget, including sound, lighting, and stage rider allocations. Output ONLY the JSON object.`;

  const systemInstruction = 'You are an expert Indian entertainment curator and stage producer. Always respond with strict, valid JSON without markdown fences.';

  const result = await callGemini(prompt, systemInstruction);
  if (!result || !result.text) return null;

  try {
    let cleanJson = result.text.trim();
    if (cleanJson.startsWith('```json')) cleanJson = cleanJson.replace(/^```json/, '').replace(/```$/, '').trim();
    else if (cleanJson.startsWith('```')) cleanJson = cleanJson.replace(/^```/, '').replace(/```$/, '').trim();

    const parsed = JSON.parse(cleanJson);
    return {
      plan: {
        ...parsed,
        source: `gemini-ai (${result.model})`,
      },
    };
  } catch {
    return null; // Fallback to rule-based planner if parsing fails
  }
}

/**
 * AI Chat Assistant with Gemini
 */
export async function chatWithGemini({ message, conversationHistory = [] }) {
  const prompt = `You are "GoArts AI", a sophisticated, helpful, and knowledgeable live entertainment advisor and booking specialist for GoArts AI (India's live artist booking marketplace).
You help clients plan celebrations, choose between live bands, playback singers, Bollywood DJs, classical dancers, stand-up comedians, and cultural troupes, understand artist pricing in India, sound/rider logistics, and platform escrow booking guarantees (where clients pay half in advance and half upon verified performance, backed by Aadhaar/Govt-verified profiles).

Client query: "${message}"

Provide a warm, concise, and insightful response (use bold markdown sparingly for key takeaways). Also provide 3 quick follow-up prompt suggestions relevant to the query.
Return your answer strictly in valid JSON format:
{
  "response": "Your markdown formatted advice...",
  "suggestions": ["Follow-up question 1", "Follow-up question 2", "Follow-up question 3"]
}`;

  const systemInstruction = 'You are GoArts AI, India\'s leading live entertainment curator. Respond strictly with a JSON object containing "response" and "suggestions".';

  const result = await callGemini(prompt, systemInstruction);
  if (!result || !result.text) return null;

  try {
    let cleanJson = result.text.trim();
    if (cleanJson.startsWith('```json')) cleanJson = cleanJson.replace(/^```json/, '').replace(/```$/, '').trim();
    else if (cleanJson.startsWith('```')) cleanJson = cleanJson.replace(/^```/, '').replace(/```$/, '').trim();

    const parsed = JSON.parse(cleanJson);
    if (parsed.response) {
      return {
        response: parsed.response,
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
        source: `gemini-ai (${result.model})`,
        timestamp: new Date().toISOString(),
      };
    }
  } catch {
    // If not strict JSON, return text directly
    return {
      response: result.text,
      suggestions: ['Find top artists for my event', 'Get an AI entertainment blueprint', 'How does verified booking work?'],
      source: `gemini-ai (${result.model})`,
      timestamp: new Date().toISOString(),
    };
  }

  return null;
}
