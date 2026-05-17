import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import schemesData from "./src/data/schemes.json";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY!,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Helper for structured output from Gemini
async function getRecommendations(userProfile: any) {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `You are the YojanaAI Eligibility Assistant, a premium, trustworthy AI specialized in Indian Government Schemes.

Your mission is to provide surgical-grade eligibility analysis for Indian citizens. 

CORE PRINCIPLES:
1. MAXIMUM RELEVANCE: Prioritize schemes that match the user's 'purposes' (intents) and 'state'.
2. COMPREHENSIVE DISCOVERY: If a scheme is highly relevant to the user's intent, include it even if it's a 'Potential Match' (e.g., if income is missing but they align on everything else).
3. EXHAUSTIVE SEARCH: Aim to provide a diverse list of 5-8 highly relevant schemes if possible.
4. VERIFIED ONLY: Only recommend officially existing Indian government schemes.
5. NUANCED EXPLANATION: In 'why_this_matches', explain specifically how it helps the user's chosen purpose.

MATCHING GUIDELINES:
- HIGH CONFIDENCE (90-100%): All criteria match.
- POTENTIAL MATCH (70-89%): Core criteria (Intent, State, Gender, Student Status) match, but minor variable fields are unknown.
- REJECTED: Hard failure (e.g., wrong state for a state-specific scheme).

PRIMARY SCHEMES DATA:
${JSON.stringify(schemesData, null, 2)}

EXTENDED KNOWLEDGE: 
If the user profile matches well-known, high-impact officially verified Indian Government schemes (Central or State) that are NOT present in the PRIMARY SCHEMES DATA, you MUST include them to provide a complete answer. Ensure they follow the JSON schema perfectly.

Analyze the profile for:
- STATE specific benefits (Rajasthan, West Bengal, etc.)
- INTENT specific benefits (Women Empowerment, Education, etc.)
- SOCIO-ECONOMIC benefits based on category and income.

If you are uncertain about a scheme's existence, include it in 'uncertain_schemes'.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: `Analyze the following profile and recommend the best eligible schemes from the provided data: ${JSON.stringify(userProfile)}` }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            eligible_schemes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  scheme_name: { type: Type.STRING },
                  ministry: { type: Type.STRING },
                  category: { type: Type.STRING },
                  eligibility_match_score: { type: Type.NUMBER },
                  why_this_matches: { type: Type.STRING },
                  eligibility_bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
                  missing_eligibility_factors: { type: Type.ARRAY, items: { type: Type.STRING } },
                  benefits: { type: Type.ARRAY, items: { type: Type.STRING } },
                  income_limit: { type: Type.STRING },
                  eligible_categories: { type: Type.ARRAY, items: { type: Type.STRING } },
                  education_requirement: { type: Type.STRING },
                  official_source: { type: Type.STRING },
                  application_process: { type: Type.STRING },
                  state: { type: Type.STRING },
                  deadline: { type: Type.STRING },
                  documents_required: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: [
                  "scheme_name", "ministry", "category", "eligibility_match_score", "why_this_matches", 
                  "eligibility_bullets", "missing_eligibility_factors", "benefits", "income_limit", "eligible_categories", "education_requirement", 
                  "official_source", "application_process", "state", "deadline", "documents_required"
                ]
              }
            },
            rejected_schemes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  reason: { type: Type.STRING }
                },
                required: ["name", "reason"]
              }
            },
            uncertain_schemes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  reason: { type: Type.STRING }
                },
                required: ["name", "reason"]
              }
            }
          },
          required: ["eligible_schemes", "rejected_schemes", "uncertain_schemes"]
        }
      }
    });

    const text = response.text || (response as any).response?.text?.() || (response as any).candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("No response text received from Gemini");
    }
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Gemini Content Generation Error:", error);
    throw error;
  }
}

app.post("/api/recommend", async (req, res) => {
  try {
    const recommendations = await getRecommendations(req.body);
    res.json(recommendations);
  } catch (error: any) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: "Failed to fetch recommendations", details: error.message });
  }
});

app.post("/api/parse-profile", async (req, res) => {
  try {
    const { query } = req.body;
    const model = "gemini-3-flash-preview";
    
    const systemInstruction = `Extract structured eligibility data from the user's natural language input.
If a field is not mentioned, return null for it.
Category must be one of: General, OBC, SC, ST, EWS, Minority Class.
Education must be one of: Below 10th, 10th Pass, 12th Pass, Diploma, Undergraduate, Postgraduate, Skill Certification, All.
Income must be a numeric string or null.
State must be a full Indian state name.
Gender must be Male, Female, or All.

In addition to fields, return 'missing_fields' as an array of strings for any critical details (state, income, caste, etc.) that are missing.
Also return a 'friendly_response' which is a ChatGPT-like acknowledgement of what you understood and a polite request for missing info if any.

RETURN JSON ONLY.`;

    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: query }] }],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            state: { type: Type.STRING, nullable: true },
            familyIncome: { type: Type.STRING, nullable: true },
            caste: { type: Type.STRING, nullable: true },
            gender: { type: Type.STRING, nullable: true },
            educationLevel: { type: Type.STRING, nullable: true },
            occupation: { type: Type.STRING, nullable: true },
            age: { type: Type.STRING, nullable: true },
            missing_fields: { type: Type.ARRAY, items: { type: Type.STRING } },
            friendly_response: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text || (response as any).response?.text?.() || (response as any).candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("No response text received from Gemini");
    }
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Parse Error:", error);
    res.status(500).json({ error: "Failed to parse query" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
