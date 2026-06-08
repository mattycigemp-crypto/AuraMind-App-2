interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatCompletionOptions {
  model?: string;
  messages: Message[];
  temperature?: number;
  max_tokens?: number;
}

interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface GeneratedCard {
  question: string;
  answer: string;
}

/**
 * Free AI Service using Groq API (free tier)
 * Groq provides fast inference with various open-source models
 */
export class FreeAIClient {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.groq.com/openai/v1';
  private readonly defaultModel = 'llama3-8b-8192'; // Free model

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('API key is required for FreeAIClient');
    }
    this.apiKey = apiKey;
  }

  async chatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    const {
      model = this.defaultModel,
      messages,
      temperature = 0.7,
      max_tokens = 1000,
    } = options;

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens,
      }),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      const message = errorPayload?.error?.message || 'Failed to fetch from Free AI API';
      throw new Error(message);
    }

    return response.json() as Promise<ChatCompletionResponse>;
  }

  async ask(question: string, systemPrompt?: string): Promise<string> {
    const messages: Message[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: question });

    const response = await this.chatCompletion({ messages });
    return response.choices?.[0]?.message?.content || 'No response from model';
  }

  async generateFlashcards(content: string): Promise<GeneratedCard[]> {
    const systemPrompt = `You are an expert study assistant. Analyze the following text and create a list of effective flashcards (Question and Answer pairs) to help a student learn this material. Focus on key concepts, definitions, and important facts.

Return your response as a valid JSON array with this exact structure:
[
  {
    "question": "What is [concept]?",
    "answer": "[Definition or explanation]"
  }
]

Create 5-10 high-quality flashcards from the content.`;

    const userPrompt = `Create flashcards from this content:\n\n"${content}"`;

    try {
      const response = await this.ask(userPrompt, systemPrompt);
      
      // Try to parse JSON response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as GeneratedCard[];
      }
      
      // Fallback: extract Q&A pairs manually
      const lines = response.split('\n').filter(line => line.trim());
      const cards: GeneratedCard[] = [];
      
      for (let i = 0; i < lines.length; i += 2) {
        if (lines[i] && lines[i + 1]) {
          const question = lines[i].replace(/^Q[:\s]*/i, '').trim();
          const answer = lines[i + 1].replace(/^A[:\s]*/i, '').trim();
          if (question && answer) {
            cards.push({ question, answer });
          }
        }
      }
      
      return cards.length > 0 ? cards : [
        { question: "What is the main topic?", answer: content.substring(0, 100) + "..." }
      ];
    } catch (error) {
      console.error('Error parsing flashcards:', error);
      throw new Error('Failed to generate flashcards');
    }
  }

  async generateDeckFromTopic(topic: string): Promise<{ title: string; description: string; cards: GeneratedCard[] }> {
    const systemPrompt = `You are an expert educational content creator. Create a complete study deck about the given topic.

Return your response as a valid JSON object with this exact structure:
{
  "title": "Deck Title",
  "description": "Brief description of what this deck covers",
  "cards": [
    {
      "question": "What is [concept]?",
      "answer": "[Definition or explanation]"
    }
  ]
}

Create 8-12 comprehensive flashcards covering the most important aspects of the topic.`;

    const userPrompt = `Create a complete study deck about: "${topic}"`;

    try {
      const response = await this.ask(userPrompt, systemPrompt);
      
      // Try to parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as { title: string, description: string, cards: GeneratedCard[] };
      }
      
      // Fallback response
      return {
        title: `${topic} Study Deck`,
        description: `A comprehensive deck covering key concepts in ${topic}`,
        cards: [
          { question: `What is ${topic}?`, answer: `${topic} is a subject worth studying in detail.` }
        ]
      };
    } catch (error) {
      console.error('Error generating deck:', error);
      throw new Error('Failed to generate deck');
    }
  }

  async generateSummaryFromTopic(topic: string): Promise<string> {
    const systemPrompt = `You are an expert researcher. Provide a comprehensive study summary of the given topic, covering key facts, dates, definitions, and concepts. The summary should be dense with information suitable for creating flashcards. Aim for 200-300 words.`;

    const userPrompt = `Research and summarize: "${topic}"`;

    try {
      return await this.ask(userPrompt, systemPrompt);
    } catch (error) {
      console.error('Error generating summary:', error);
      throw new Error('Failed to generate summary');
    }
  }
}

// Alternative: Ollama (local AI) service
export class OllamaClient {
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(baseUrl: string = 'http://localhost:11434', model: string = 'llama3.2') {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async ask(question: string, systemPrompt?: string): Promise<string> {
    const messages: Message[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: question });

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: systemPrompt ? `${systemPrompt}\n\n${question}` : question,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to connect to Ollama');
      }

      const data = await response.json();
      return data.response || 'No response from model';
    } catch (error) {
      console.error('Error with Ollama:', error);
      throw new Error('Failed to get response from Ollama');
    }
  }

  async generateFlashcards(content: string): Promise<GeneratedCard[]> {
    const prompt = `Create flashcards from this content. Return as JSON array with question/answer pairs:\n\n${content}`;

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt,
          format: 'json',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to connect to Ollama');
      }

      const data = await response.json();
      const responseText = data.response;

      // Try to parse JSON
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as GeneratedCard[];
      }

      // Fallback
      return [
        { question: "What is the main topic?", answer: content.substring(0, 100) + "..." }
      ];
    } catch (error) {
      console.error('Error with Ollama:', error);
      throw new Error('Failed to generate flashcards with Ollama');
    }
  }

  async generateDeckFromTopic(topic: string): Promise<{ title: string; description: string; cards: GeneratedCard[] }> {
    const prompt = `Create a study deck about "${topic}". Return as JSON with title, description, and cards array.`;

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt,
          format: 'json',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to connect to Ollama');
      }

      const data = await response.json();
      const responseText = data.response;

      // Try to parse JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as { title: string; description: string; cards: GeneratedCard[] };
      }

      // Fallback
      return {
        title: `${topic} Study Deck`,
        description: `A comprehensive deck covering key concepts in ${topic}`,
        cards: [
          { question: `What is ${topic}?`, answer: `${topic} is a subject worth studying in detail.` }
        ]
      };
    } catch (error) {
      console.error('Error with Ollama:', error);
      throw new Error('Failed to generate deck with Ollama');
    }
  }

  async generateSummaryFromTopic(topic: string): Promise<string> {
    const systemPrompt = `You are an expert researcher. Provide a comprehensive study summary of the given topic, covering key facts, dates, definitions, and concepts. The summary should be dense with information suitable for creating flashcards. Aim for 200-300 words.`;

    const userPrompt = `Research and summarize: "${topic}"`;

    try {
      return await this.ask(userPrompt, systemPrompt);
    } catch (error) {
      console.error('Error generating summary:', error);
      throw new Error('Failed to generate summary');
    }
  }
}

// Initialize clients
const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
export const freeAIClient = new FreeAIClient(groqApiKey || '');

const ollamaUrl = import.meta.env.VITE_OLLAMA_URL;
export const ollamaClient = new OllamaClient(ollamaUrl);

// Helper to determine which service to use
export const getFreeAIClient = (): FreeAIClient | OllamaClient => {
  // Use Groq if API key is available, otherwise try Ollama
  if (groqApiKey) {
    return freeAIClient;
  }
  return ollamaClient;
};



