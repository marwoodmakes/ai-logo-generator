import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/generate', async (req, res) => {
  try {
    const { name, symbols, colors, vibe, style } = req.body;

    if (!name || !symbols || !colors || !vibe || !style) {
      return res.status(400).json({
        error: 'Missing required fields: name, symbols, colors, vibe, style',
      });
    }

    const gptResponse = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Create a {{style}} family crest for the name "{{name}}".
Incorporate the following elements as visual inspiration: {{elements}}.
The design style should reflect {{vibe}}, using clean, solid shapes only.
Use a harmonious two-color palette: {{color}}.
Place the elements within a centered, symmetrical layout — shield, circular, or open composition.
Ensure the design is embroidery-friendly: no gradients, only solid fills, bold shapes, and clear outlines.
Include the name "{{name}}" this should be the only text in the image. The spelling of the name must be exact, legible
`,
        },
        {
          role: 'user',
          content: `Generate a DALL·E prompt using these values:
Name: ${name}
Elements: ${symbols}
Colors: ${colors}
Vibe: ${vibe}
Style: ${style}`,
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
    res.status(500).json({ error: 'Image generation failed', detail: err.message });
  }
});

app.listen(port, () => {
  console.log(`🧵 Krestly Server running on http://localhost:${port}`);
});
