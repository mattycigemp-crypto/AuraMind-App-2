export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { topic, count = 5 } = req.body;

    // 1. Sanitize the API Key
    let rawKey = process.env.VITE_HUGGINGFACE_API_KEY || '';
    const HF_API_KEY = rawKey.trim().replace(/^["']|["']$/g, '');

    // Use a model that supports chat completions via hf-inference
    // Changed from meta-llama/Llama-2-7b-chat-hf to a supported model
    const MODEL_ID = 'mistralai/Mistral-7B-Instruct-v0.2';

    if (!HF_API_KEY) {
      return res.status(500).json({
        error: 'Missing API Key',
        message: 'VITE_HUGGINGFACE_API_KEY is missing in Vercel. Please add it in project settings.'
      });
    }

    console.log(`AI Proxy Final Deployment: Requesting topic "${topic}" using ${MODEL_ID}`);

    const response = await fetch(
      'https://router.huggingface.co/v1/chat/completions',
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          model: MODEL_ID,
          messages: [
            {
              role: 'system',
              content: 'You are a professional educational assistant. Generate ONLY a valid JSON array of flashcards.'
            },
            {
              role: 'user',
              content: `Generate ${count} educational flashcards about "${topic}". 
              Format: [{"front": "Question", "back": "Answer"}]
              Return ONLY the JSON array.`
            }
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Hugging Face Router Error (${response.status}):`, errorText);

      let cleanedError = errorText;
      try {
        const err = JSON.parse(errorText);
        cleanedError = err.error?.message || err.error || errorText;
      } catch (e) { }

      return res.status(response.status).json({
        error: 'AI Provider Error',
        status: response.status,
        message: cleanedError,
        details: errorText
      });
    }

    const result = await response.json();
    const text = result.choices?.[0]?.message?.content || '';

    if (!text) {
      return res.status(500).json({ error: 'Model returned no content', raw: result });
    }

    return res.status(200).json({ text });

  } catch (error) {
    console.error('Serverless Function Error:', error);
    return res.status(500).json({ error: 'Server Error', message: error.message });
  }
}
