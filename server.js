// 📦 Instaliraj pre pokretanja:
// npm install express cors body-parser dotenv openai mongoose google-auth-library jsonwebtoken

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { OpenAI } from 'openai';

dotenv.config();

console.log("🔑 MONGO_URI:", MONGO_URI);

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'tajna';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const MONGO_URI = process.env.MONGO_URI;

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// 📡 CORS za frontend
app.use(cors({
  origin: 'https://vinarijesrbije.rs',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(bodyParser.json());

// 🔌 MongoDB konekcija
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// 🧠 User model
const userSchema = new mongoose.Schema({
  googleId: String,
  email: String,
  name: String,
  theme: { type: String, default: 'light' },
  language: { type: String, default: 'en' },
  sessions: [
    {
      date: Date,
      transcript: [String],
    },
  ],
});
const User = mongoose.model('User', userSchema);

// 🧾 Middleware za JWT auth
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.sendStatus(401);
  const token = authHeader.split(' ')[1];
  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch (e) {
    return res.sendStatus(403);
  }
};

// 🔐 Google Login
app.post('/api/google-login', async (req, res) => {
  const { credential } = req.body;
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  const { sub, email, name } = payload;

  let user = await User.findOne({ googleId: sub });
  if (!user) {
    user = await User.create({ googleId: sub, email, name });
  }

  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

// 🧠 Dohvati podatke o korisniku
app.get('/api/user', authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.userId);
  if (!user) return res.sendStatus(404);
  res.json({ name: user.name, theme: user.theme, language: user.language });
});

// 💾 Ažuriraj podatke korisnika
app.post('/api/user', authMiddleware, async (req, res) => {
  const { name, theme, language } = req.body;
  const user = await User.findById(req.user.userId);
  if (!user) return res.sendStatus(404);
  if (name) user.name = name;
  if (theme) user.theme = theme;
  if (language) user.language = language;
  await user.save();
  res.json({ success: true });
});

// 🤖 AI terapeut
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/api/chat', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a helpful AI psychologist.' },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
    });

    const reply = completion?.choices?.[0]?.message?.content || 'Sorry, something went wrong.';

    // Sačuvaj u sesije
    const user = await User.findById(req.user.userId);
    if (user) {
      user.sessions.push({ date: new Date(), transcript: [message, reply] });
      await user.save();
    }

    res.json({ reply });
  } catch (error) {
    console.error('❌ OpenAI error:', error);
    res.status(500).json({ error: 'AI response failed' });
  }
});

// 🚀 Pokretanje servera
app.get('/', (req, res) => res.send('Nala AI Backend running'));

app.listen(port, () => console.log(`🚀 Server is running on port ${port}`));

