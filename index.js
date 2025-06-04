// index.js

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { OpenAI } = require('openai');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Set up OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Store this in Render or your .env file
});

// Endpoint to generate image
app.post('/generate-logo', async (req, res) => {
  const { name, vibe, symbols, style, colors } = req.body;

  if (!name || !vibe || !symbols || !style || !colors) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const prompt = `A custom logo for "${name}" with a ${vibe} vibe, including elements like ${symbols}, in the style of ${style}, using colors like ${colors}. Clean background, logo centered.`;

  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
    });

    const imageUrl = response.data[0].url;
    res.json({ imageUrl });
  } catch (error) {
    console.error('Error generating image:', error.message || error);
    res.status(500).json({ error: 'Image generation failed' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
