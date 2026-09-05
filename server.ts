import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

// Load Firebase configuration for auth validation
let firebaseConfig: { projectId?: string } = {};
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  }
} catch (err) {
  console.warn("Could not read firebase-applet-config.json:", err);
}

const FIREBASE_PROJECT_ID = firebaseConfig.projectId || "yachty-magpie-njcsn";

// Lazy initialization for Google GenAI
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Resilient Gemini model caller with exponential backoff and seamless fallback
interface GenerateOptions {
  contents: unknown;
  systemInstruction?: string;
  responseMimeType?: string;
  temperature?: number;
}

async function generateWithFallback(
  ai: GoogleGenAI,
  options: GenerateOptions
) {
  // Ordered by priority: standard default model first, followed by production flash and flash-lite
  const candidateModels = ["gemini-3.8-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
  let lastError: unknown = null;

  for (const model of candidateModels) {
    // Retry up to 2 attempts per candidate model for transient spikes
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const config: Record<string, unknown> = {};
        if (options.systemInstruction) config.systemInstruction = options.systemInstruction;
        if (options.responseMimeType) config.responseMimeType = options.responseMimeType;
        if (options.temperature !== undefined) config.temperature = options.temperature;

        const response = await ai.models.generateContent({
          model,
          contents: options.contents as any,
          config,
        });

        return response;
      } catch (err: unknown) {
        lastError = err;
        const errMsg = err instanceof Error ? err.message : String(err);
        const isTransient =
          errMsg.includes("503") ||
          errMsg.includes("UNAVAILABLE") ||
          errMsg.includes("high demand") ||
          errMsg.includes("429") ||
          errMsg.includes("RESOURCE_EXHAUSTED");

        console.warn(`[Gemini] Model ${model} attempt ${attempt + 1} encountered error:`, errMsg);

        if (isTransient && attempt === 0) {
          // Wait 600ms before retrying the same model
          await new Promise((r) => setTimeout(r, 600));
          continue;
        }
        // Fall back to next model in the pool
        break;
      }
    }
  }

  throw lastError;
}

// Input sanitization against injection and oversized payloads
function sanitizeInput(text: unknown, maxLength = 5000): string {
  if (typeof text !== "string") return "";
  // Strip control characters (except newline and tab)
  const cleaned = text.replace(/[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g, "");
  return cleaned.trim().slice(0, maxLength);
}

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
  };
}

// Authentication middleware verifying Firebase ID token JWT claims
function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized: Missing Bearer token" });
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || typeof decoded === "string" || !decoded.payload) {
      res.status(401).json({ error: "Unauthorized: Malformed JWT token" });
      return;
    }

    const payload = decoded.payload as jwt.JwtPayload;
    const now = Math.floor(Date.now() / 1000);

    // Verify token expiration
    if (payload.exp && payload.exp < now) {
      res.status(401).json({ error: "Unauthorized: Token expired" });
      return;
    }

    // Verify standard Firebase issuer & audience
    const expectedIssuer = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;
    if (payload.iss && payload.iss !== expectedIssuer) {
      res.status(401).json({ error: "Unauthorized: Invalid token issuer" });
      return;
    }

    if (payload.aud && payload.aud !== FIREBASE_PROJECT_ID) {
      res.status(401).json({ error: "Unauthorized: Invalid token audience" });
      return;
    }

    if (!payload.sub || typeof payload.sub !== "string") {
      res.status(401).json({ error: "Unauthorized: Missing user identity" });
      return;
    }

    req.user = {
      uid: payload.sub,
      email: payload.email as string | undefined,
    };

    next();
  } catch (error) {
    console.error("JWT validation error:", error);
    res.status(401).json({ error: "Unauthorized: Token validation failed" });
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "1mb" }));

  // Security Headers
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    next();
  });

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      projectId: FIREBASE_PROJECT_ID,
      geminiConfigured: !!process.env.GEMINI_API_KEY,
    });
  });

  // Multi-turn Gemini Chat for Journaling
  app.post("/api/chat", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { messages, entryContext } = req.body;

      if (!Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({ error: "Messages array is required." });
        return;
      }

      const safeContext = sanitizeInput(entryContext || "", 1000);

      // Sanitize and prepare messages history
      const formattedContents = messages.map((m: { role: string; text: string }) => {
        const role = m.role === "assistant" || m.role === "model" ? "model" : "user";
        return {
          role,
          parts: [{ text: sanitizeInput(m.text || "", 4000) }],
        };
      });

      const systemInstruction = `You are Gemini Journal Coach, a warm, perceptive, and empathetic personal journaling partner.
Your role:
1. Listen attentively, validate the user's emotions, and mirror key feelings with deep empathy.
2. Ask one clear, reflective follow-up question to help the user unpack their thoughts, recognize patterns, or uncover gratitude.
3. Keep your tone encouraging, reflective, and conversational. Keep replies concise (2 to 4 sentences).
4. Guardrails: Do not provide clinical diagnosis or preach unsolicited advice. Maintain emotional safety.
${safeContext ? `Context about current journal focus: ${safeContext}` : ""}`;

      const ai = getGenAI();
      const response = await generateWithFallback(ai, {
        contents: formattedContents,
        systemInstruction,
        temperature: 0.7,
      });

      const replyText = response.text || "I'm listening. Tell me more about what's on your mind.";
      res.json({ reply: replyText });
    } catch (err: unknown) {
      console.error("Error in /api/chat:", err);
      let message = "Gemini is currently experiencing high demand. Please try again in a moment.";
      if (err instanceof Error) {
        const raw = err.message;
        try {
          const match = raw.match(/"message"\s*:\s*"([^"]+)"/);
          message = match ? match[1] : raw;
        } catch {
          message = raw;
        }
      }
      res.status(500).json({ error: message });
    }
  });

  // Automated AI Summary and Theme Extraction for Journal Entry
  app.post("/api/summarize", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { messages, titleHint } = req.body;

      if (!Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({ error: "Messages array is required for summarization." });
        return;
      }

      // Build transcript from messages
      const transcript = messages
        .map((m: { role: string; text: string }) => {
          const speaker = m.role === "user" ? "User" : "Gemini Coach";
          return `${speaker}: ${sanitizeInput(m.text || "", 2000)}`;
        })
        .join("\n\n");

      const prompt = `You are an AI Reflection & Journaling Analyst.
Read the following multi-turn personal journaling session and extract a rich, structured reflection summary.
${titleHint ? `Existing Title Hint: "${sanitizeInput(titleHint, 100)}"` : ""}

Provide a valid JSON object matching this schema:
{
  "title": "A thoughtful, poetic or grounded 3-6 word title for this entry",
  "summary": "A cohesive, 2-3 paragraph summary of what the user experienced, thought about, emotionally processed, and realized",
  "mood": "A single word or short phrase capturing the emotional tone (e.g., Grateful, Reflective, Hopeful, Overwhelmed, Peaceful, Resilient, Introspective)",
  "keyThemes": ["theme 1", "theme 2", "theme 3", "theme 4"],
  "actionableInsights": ["Actionable takeaway or gentle affirmation 1", "Actionable takeaway 2"]
}

Journal Transcript:
${transcript}`;

      const ai = getGenAI();
      const response = await generateWithFallback(ai, {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        responseMimeType: "application/json",
        temperature: 0.3,
      });

      const responseText = response.text || "{}";
      let parsed = {};
      try {
        parsed = JSON.parse(responseText);
      } catch (parseError) {
        console.warn("Failed to parse JSON response from Gemini, falling back:", parseError);
        parsed = {
          title: titleHint || "Personal Reflection",
          summary: responseText,
          mood: "Reflective",
          keyThemes: ["Journaling", "Personal Growth"],
          actionableInsights: ["Continue exploring your inner thoughts."],
        };
      }

      res.json(parsed);
    } catch (err: unknown) {
      console.error("Error in /api/summarize:", err);
      let message = "Gemini is currently experiencing high demand. Please try again in a moment.";
      if (err instanceof Error) {
        const raw = err.message;
        try {
          const match = raw.match(/"message"\s*:\s*"([^"]+)"/);
          message = match ? match[1] : raw;
        } catch {
          message = raw;
        }
      }
      res.status(500).json({ error: message });
    }
  });

  // Vite middleware in dev; static dist serving in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
