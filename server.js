import express from 'express';
import cors from 'cors';
import { Configuration, OpenAIApi } from 'openai';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.post('/chat', async (req, res) => {
  try {
    const { message, conversation } = req.body;
    if (!message) return res.status(400).json({ error: 'No message provided' });

    const chatMessages = conversation || [];
    chatMessages.push({ role: 'user', content: message });

    const completion = await openai.createChatCompletion({
      model: 'gpt-4o-mini',
      messages: chatMessages,
      temperature: 0.7,
    });

    const aiResponse = completion.data.choices[0].message;

    res.json({ reply: aiResponse, conversation: [...chatMessages, aiResponse] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get AI response' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
