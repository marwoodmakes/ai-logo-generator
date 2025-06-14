import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// --- CRITICAL UPDATE FOR CORS ---
// Configure CORS to allow both versions of your custom domain.
app.use(cors({
  origin: ['https://www.krestly.com', 'https://krestly.com', 'https://krestly.myshopify.com'], // <--- UPDATED LINE!
  methods: ['POST', 'GET', 'OPTIONS'],
  credentials: true
}));
// --- END CRITICAL UPDATE ---

app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/generate', async (req, res) => {
  try {
    const { name, symbols, colors, vibe, style } = req.body;

    // Build the input list dynamically
    const lines = [];
    if (name) lines.push(`Name: ${name}`);
    if (symbols) lines.push(`Elements: ${symbols}`);
    if (colors) lines.push(`Colors: ${colors}`);
    if (vibe) lines.push(`Vibe: ${vibe}`);
    if (style) lines.push(`Style: ${style}`);

    // Fallback in case literally all inputs are missing
    if (lines.length === 0) {
      lines.push('Design a general family crest using any artistic freedom.');
    }

    const userPrompt = `Generate a DALL·E prompt for a family crest:\n` + lines.join('\n');

    const gptResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `
Create a DALL·E 3 image prompt for a modern embroidery-safe family crest.
- Use only bold, solid shapes (no gradients)
- Keep layout symmetrical and centered
- Limit to 2 harmonious thread-safe colours
- Only include the given name in the image if it is provided
- If no name is given, do not include any text at all
- Composition should be sqaure, circular, or open badge-style

`
,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const prompt = gptResponse.choices?.[0]?.message?.content?.trim();
    if (!prompt) throw new Error('GPT did not return a valid prompt.');

    const imageResponse = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
    });

    const imageUrl = imageResponse.data?.[0]?.url;
    if (!imageUrl) throw new Error('DALL·E did not return an image.');

    res.json({ imageUrl });

  } catch (err) {
    console.error('❌ Error in /generate:', err);
    res.status(500).json({
      error: 'Image generation failed',
      detail: err.message,
    });
  }
});

app.listen(port, () => {
  console.log(`🧵 Krestly Server running on http://localhost:${port}`);
});