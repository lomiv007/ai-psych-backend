import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// CORS konfiguracija - dozvoljava frontend domen
app.use(cors({
  origin: 'https://vinarijesrbije.rs',
  methods: ['GET', 'POST', 'OPTIONS'],
}));

app.use(bodyParser.json());

// Inicijalizacija OpenAI klijenta sa API ključem iz .env
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Test GET endpoint da proveriš da backend radi
app.get('/', (req, res) => {
  res.send('AI Psych Backend is running');
});

// API endpoint za chat
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful AI psychologist." },
        { role: "user", content: message },
      ],
    });

    const reply = completion.choices[0].message.content;

    res.json({ reply });
  } catch (error) {
    console.error("OpenAI API error:", error);
    res.status(500).json({ error: "Failed to get AI response" });
  }
});

// Start servera
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
