import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client safely
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please add it to your Settings > Secrets.");
    }
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

// Keep a simple healthcheck route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Gemini AI Generator for "Telaah Staf" (Staff Study)
app.post("/api/generate-telaah", async (req, res) => {
  try {
    const { topic, context, goal } = req.body;

    if (!topic) {
      res.status(400).json({ error: "Topic is required" });
      return;
    }

    const ai = getGeminiClient();

    const systemPrompt = `Anda adalah Asisten AI Administrasi Pemerintah Indonesia (Inspektorat Daerah).
Tugas Anda adalah memformulasikan dokumen "TELAAH STAF" (Staff Study) dalam Bahasa Indonesia Birokrasi (Ejaan Bahasa Indonesia Resmi, formal, padat, dan persuasif).
Telaah Staf harus terbagi menjadi 5 bab/segmen:
1. Latar Belakang / Persoalan: Menjabarkan masalah, dasar hukum (bila relevan), urgensi, dan kondisi saat ini secara logis.
2. Fakta-fakta yang Mempengaruhi: Menyajikan data hipotesis, fakta lapangan, peraturan terkait, atau kendala operasional secara kuantitatif maupun kualitatif.
3. Analisis & Pembahasan: Menilai konsekuensi tindakan, membahas opsi solusi, risiko, efisiensi anggaran, dan implikasi jangka panjang.
4. Kesimpulan: Menyimpulkan inti permasalahan dan jalur pemecahan terbaik secara komprehensif namun singkat.
5. Saran / Rekomendasi: Langkah taktis operasional konkrit yang direkomendasikan kepada pimpinan (Inspektur / Bupati) untuk segera ditindaklanjuti.

Tulis dalam gaya formal aparat sipil negara (ASN) tingkat tinggi yang sopan demi tercapainya keputusan pimpinan yang memuaskan.`;

    const userPrompt = `Buatlah telaah staf resmi berdasarkan data masukan berikut:
- Pokok Masalah / Topik: "${topic}"
- Latar Belakang Masalah / Keadaan Saat Ini: "${context || 'Belum ada detail spesifik'}"
- Harapan / Sasaran yang Ingin Dicapai: "${goal || 'Penyelesaian masalah dengan solusi terbaik'}"

Pastikan seluruh bab diisi secara detail (minimal 2-3 kalimat per bab, mengalir secara alamiah).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            background: {
              type: Type.STRING,
              description: "Latar Belakang / Persoalan resmi dinas (Bahasa Indonesia formal)"
            },
            facts: {
              type: Type.STRING,
              description: "Fakta-Fakta yang Mempengaruhi (Bahasa Indonesia formal)"
            },
            analysis: {
              type: Type.STRING,
              description: "Analisis dan Pembahasan kritis (Bahasa Indonesia formal)"
            },
            conclusion: {
              type: Type.STRING,
              description: "Kesimpulan pokok telaah (Bahasa Indonesia formal)"
            },
            suggestion: {
              type: Type.STRING,
              description: "Saran atau Rekomendasi aksi taktis (Bahasa Indonesia formal)"
            }
          },
          required: ["background", "facts", "analysis", "conclusion", "suggestion"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response from Gemini API");
    }

    const parsedData = JSON.parse(resultText.trim());
    res.json(parsedData);
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate Staff Study from Gemini" });
  }
});

async function run() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Middlewares registered with Vite DevServer.");
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express DevServer is running on http://localhost:${PORT}`);
  });
}

run();
