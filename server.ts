import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GEMINI_MODEL = 'gemini-4-hydrogen';

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: { 'User-Agent': 'aistudio-build' },
    },
  });
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '1mb' }));

  // AI status probe (never exposes API key)
  app.get('/api/ai/status', (_req, res) => {
    const configured = Boolean(getGeminiClient());
    res.json({ configured });
  });

  // Daily Summary Card ("Aaj ka khulasa")
  app.post('/api/ai/summary', async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        configured: false,
        error: 'GEMINI_NOT_CONFIGURED',
      });
    }

    try {
      const body = req.body as {
        language?: 'ur' | 'en';
        todayDate?: string;
        shopName?: string;
        summary?: Record<string, unknown>;
        recentRecords?: unknown[];
        partyHighlights?: unknown[];
      };

      const langLabel = body.language === 'en' ? 'English' : 'simple Pakistani Urdu (using clean Urdu script)';
      const prompt = [
        `You are the Mandi Khata Hisaab Assistant for a Pakistani agricultural commission shop (Aarhti).`,
        `Write a concise, practical 3-to-4 sentence daily business summary in ${langLabel}.`,
        `STRICT RULES:`,
        `- Use ONLY the exact numbers provided in the JSON context below. NEVER invent, guess, or alter any number.`,
        `- Do not use markdown headers or code blocks; write clear, friendly sentences.`,
        `- Mention today's sales, purchases, commission earned (or note if commission is off/0), and any notable pending/overdue party balance if present.`,
        `Context JSON:`,
        JSON.stringify({
          todayDate: String(body.todayDate || ''),
          shopName: String(body.shopName || ''),
          todayStats: body.summary || {},
          recentRecords: Array.isArray(body.recentRecords) ? body.recentRecords.slice(0, 12) : [],
          partyHighlights: Array.isArray(body.partyHighlights) ? body.partyHighlights.slice(0, 10) : [],
        }),
      ].join('\n');

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
      });

      return res.json({
        configured: true,
        text: (response.text || '').trim(),
      });
    } catch (err) {
      console.error('AI summary error:', err);
      return res.status(500).json({
        configured: true,
        error: 'AI_REQUEST_FAILED',
      });
    }
  });

  // AI Hisaab Agent Chat & Draft Entry Parser
  app.post('/api/ai/chat', async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        configured: false,
        error: 'GEMINI_NOT_CONFIGURED',
      });
    }

    try {
      const body = req.body as {
        language?: 'ur' | 'en';
        message?: string;
        todayDate?: string;
        settings?: Record<string, unknown>;
        summary?: Record<string, unknown>;
        records?: unknown[];
        parties?: unknown[];
      };

      const userMessage = typeof body.message === 'string' ? body.message.trim().slice(0, 1000) : '';
      if (!userMessage) {
        return res.status(400).json({ error: 'MESSAGE_REQUIRED' });
      }

      const langInstruction =
        body.language === 'en'
          ? 'Reply in clear English.'
          : 'Reply in clear Pakistani Urdu (or Urdu script with clean English/digits where needed).';

      const prompt = [
        `You are the Mandi Khata AI Hisaab Agent for a Pakistani grain market commission shop.`,
        `${langInstruction}`,
        `STRICT RULES:`,
        `1. Answer questions strictly from the user's actual local records JSON below. Never invent any sale, purchase, weight, rate, or balance.`,
        `2. If the user is describing a new sale or purchase entry (for example "Ahmed se 5000 kg gandum 4200 rate par liya" or "Al-Madina mill ko 9000 kg 150 bags 4300 rate par becha"), extract a structured draftEntry object AND explain clearly in reply that this is a DRAFT waiting for their confirmation before saving.`,
        `3. For purchases ("liya", "kharida", "khareed", "from farmer"), set draftEntry.type = "purchase". For sales ("becha", "farokht", "sold to", "mill ko"), set draftEntry.type = "sale".`,
        `4. Match cropId to one of the crops in settings.crops if possible.`,
        `Context JSON:`,
        JSON.stringify({
          todayDate: String(body.todayDate || ''),
          settings: body.settings || {},
          summary: body.summary || {},
          records: Array.isArray(body.records) ? body.records.slice(0, 40) : [],
          parties: Array.isArray(body.parties) ? body.parties.slice(0, 40) : [],
        }),
        `User request: ${userMessage}`,
      ].join('\n');

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: {
                type: Type.STRING,
                description: 'Helpful Urdu or English response grounded strictly in the provided data.',
              },
              hasDraftEntry: {
                type: Type.BOOLEAN,
                description: 'True only when the user asked to prepare or record a sale or purchase transaction.',
              },
              draftEntry: {
                type: Type.OBJECT,
                nullable: true,
                properties: {
                  type: { type: Type.STRING, enum: ['sale', 'purchase'] },
                  partyName: { type: Type.STRING },
                  cropId: { type: Type.STRING },
                  variety: { type: Type.STRING },
                  totalWeight: { type: Type.NUMBER },
                  bags: { type: Type.NUMBER },
                  marginCut: { type: Type.NUMBER },
                  kandaCut: { type: Type.NUMBER },
                  ratePerMaund: { type: Type.NUMBER },
                  advance: { type: Type.NUMBER },
                  taxLabour: { type: Type.NUMBER },
                  notes: { type: Type.STRING },
                },
              },
            },
            required: ['reply', 'hasDraftEntry'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}') as {
        reply?: string;
        hasDraftEntry?: boolean;
        draftEntry?: Record<string, unknown> | null;
      };

      return res.json({
        configured: true,
        reply: String(parsed.reply || '').trim(),
        hasDraftEntry: Boolean(parsed.hasDraftEntry && parsed.draftEntry),
        draftEntry: parsed.hasDraftEntry ? parsed.draftEntry : null,
      });
    } catch (err) {
      console.error('AI chat error:', err);
      return res.status(500).json({
        configured: true,
        error: 'AI_REQUEST_FAILED',
      });
    }
  });

  const httpServer = http.createServer(app);

  // Vite dev middleware or static dist serving
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: { server: httpServer },
      },
      appType: 'spa',
      configLoader: 'native',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Mandi Khata server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
