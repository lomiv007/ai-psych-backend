import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// ✅ Omogući CORS za tvoj frontend domen
app.use(cors({
  origin: 'https://vinarijesrbije.rs',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

// ✅ JSON body parser
app.use(bodyParser.json());

// ✅ Inicijalizuj OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ✅ Test ruta da proveriš da backend radi
app.get('/', (req, res) => {
  res.send('AI Psych Backend is running');
});

// ✅ Glavna /api/chat ruta
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      console.warn("No message received in body");
      return res.status(400).json({ error: "Message is required" });
    }

    console.log("📨 User message:", message);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful AI psychologist." },
        { role: "user", content: message }
      ],
      temperature: 0.7,
    });

    console.log("✅ OpenAI response:", JSON.stringify(completion, null, 2));

    const reply = completion?.choices?.[0]?.message?.content;

    if (reply) {
      res.json({ reply });
    } else {
      console.warn("⚠️ OpenAI response missing content");
      res.json({ reply: "I'm here for you, but I didn’t catch that. Could you repeat it?" });
    }

  } catch (error) {
    console.error("❌ Error during OpenAI request:", error);
    res.status(500).json({ error: "Failed to get AI response" });
  }
});

// ✅ Startuj server
app.listen(port, () => {
  console.log(`🚀 Server listening on port ${port}`);
});
