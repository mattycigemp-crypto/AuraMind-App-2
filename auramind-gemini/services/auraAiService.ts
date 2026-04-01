// Aura AI Service
// Integrates with OpenRouter API to access AI models

// Study Agent System Prompt
// Study Agent System Prompt
export const STUDY_AGENT_SYSTEM_PROMPT = `You are Aura, an advanced AI study companion for AuraMind. Your goal is to help students calculate, memorize, and master topics efficiently.

## Your Capabilities
You have access to specific study tools. When a user requests one of these actions, you MUST output ONLY the JSON structure for that tool. DO NOT include conversational filler, markdown explanations, or backticks around the JSON unless specifically asked for a code example.

### 1. generate_quiz (For tests/assessments)
{
  "tool": "generate_quiz",
  "data": {
    "title": "Title",
    "topic": "Topic",
    "difficulty": "easy|medium|hard",
    "questions": [
      {
        "id": "1",
        "question": "text",
        "options": ["A", "B", "C", "D"],
        "correctAnswer": 0,
        "explanation": "why"
      }
    ]
  }
}

### 2. explain_concept (For deep dives)
{
  "tool": "explain_concept",
  "data": {
    "concept": "Concept",
    "explanation": "Markdown detailed text",
    "examples": ["Ex 1", "Ex 2"],
    "keyPoints": ["Point 1", "Point 2"]
  }
}

### 3. generate_flashcards (For memorization)
{
  "tool": "generate_flashcards",
  "data": {
    "cards": [
      { "question": "Q", "answer": "A", "topic": "T", "difficulty": "M" }
    ]
  }
}

### 4. generate_presentation (For summaries/slides)
{
  "tool": "generate_presentation",
  "data": {
    "title": "Title",
    "slides": [
      { "title": "S1", "bullets": ["B1"], "script": "Narrative" }
    ]
  }
}

## Core Rules
1. If a tool is requested (quiz, flashcard, slide, explanation), output ONLY the raw JSON structure. DO NOT include conversational text, preamble ("Sure", "I have generated"), or postscript.
2. If the user asks a general question NOT covered by tools, provide a friendly, academic text response.
3. For "Explain X then Y", prioritize the "explain_concept" tool which contains a rich explanation field.
4. Always respond as AuraMind AI. Be accurate, concise, and academic.
5. Never mention "DeepSeek", "Model", or internal technical details in the output.`;

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
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Create and export a singleton instance
const getEnv = (key: string): string => {
  return (import.meta as any).env?.[key] || (process as any).env?.[key] || '';
};

const openRouterKey = getEnv('VITE_OPENROUTER_API_KEY');
const useLocalAI = getEnv('VITE_USE_LOCAL_AI') === 'true';
const customModel = getEnv('VITE_AI_MODEL');
const localBaseUrl = '/local-ai/v1';

export class AuraAiClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultModel: string;

  constructor(apiKey: string, baseUrl?: string, model?: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || 'https://openrouter.ai/api/v1';

    if (model) {
      this.defaultModel = model;
    } else {
      // Fallback: Use a generic ID for local servers, or Gemini for OpenRouter
      this.defaultModel = this.baseUrl.includes('local-ai')
        ? 'local-model'
        : 'google/gemini-2.0-flash-lite-preview-02-05:free';
    }
  }

  private checkApiKey() {
    // Local servers like LM Studio often don't require an API key
    if (!this.apiKey && this.baseUrl.includes('openrouter.ai')) {
      throw new Error('API key is missing. Please set VITE_OPENROUTER_API_KEY in your .env file.');
    }
  }

  async chatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    const {
      model = this.defaultModel,
      messages,
      temperature = 0.7,
      max_tokens = 2000,
    } = options;

    this.checkApiKey();

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey || 'not-needed'}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': typeof window !== 'undefined' ? window.location.href : 'http://localhost:3000',
          'X-Title': typeof document !== 'undefined' ? (document.title || 'AuraMind') : 'AuraMind App',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to fetch from AI API';
        try {
          const jsonError = JSON.parse(errorText);
          errorMessage = jsonError.error?.message || jsonError.message || errorMessage;
        } catch (e) {
          errorMessage = `API Error (${response.status}): ${errorText || response.statusText}`;
        }

        if (this.baseUrl.includes('local-ai')) {
          errorMessage = `Local AI Connection Failed: Please ensure your local model server (e.g. LM Studio) is running on ${this.baseUrl.replace('/local-ai', 'localhost')}. Detail: ${errorMessage}`;
        }

        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in AI API call:', error);
      throw error;
    }
  }

  // Helper method for simple user messages
  async ask(question: string, systemPrompt?: string): Promise<string> {
    const messages: Message[] = [];

    // Always use Study Agent system prompt unless overridden
    const finalSystemPrompt = systemPrompt || STUDY_AGENT_SYSTEM_PROMPT;
    messages.push({ role: 'system', content: finalSystemPrompt });

    messages.push({ role: 'user', content: question });

    const response = await this.chatCompletion({
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    return response.choices[0]?.message?.content || 'No response from model';
  }

  // Method specifically for Study Agent interactions
  async studyAgentAsk(question: string): Promise<string> {
    // Use the comprehensive global prompt which includes tool definitions
    return this.ask(question, STUDY_AGENT_SYSTEM_PROMPT);
  }

  // Method for streaming responses (if needed for real-time chat)
  async *streamChatCompletion(options: ChatCompletionOptions): AsyncGenerator<string> {
    const {
      model = this.defaultModel,
      messages,
      temperature = 0.7,
      max_tokens = 2000,
    } = options;

    this.checkApiKey();

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey || 'not-needed'}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': typeof window !== 'undefined' ? window.location.href : 'http://localhost:3000',
          'X-Title': typeof document !== 'undefined' ? (document.title || 'AuraMind') : 'AuraMind App',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to fetch from AI API';
        try {
          const jsonError = JSON.parse(errorText);
          errorMessage = jsonError.error?.message || jsonError.message || errorMessage;
        } catch (e) {
          errorMessage = `API Error (${response.status}): ${errorText || response.statusText}`;
        }

        if (this.baseUrl.includes('local-ai')) {
          errorMessage = `Local AI Connection Failed: Please ensure your local model server (e.g. LM Studio) is running. Detail: ${errorMessage}`;
        }

        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Response body is not readable');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              if (content) yield content;
            } catch (e) {
              // Ignore parsing errors for malformed chunks
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in streaming AI API call:', error);
      throw error;
    }
  }
}

export const auraAiClient = new AuraAiClient(
  openRouterKey,
  useLocalAI ? localBaseUrl : undefined,
  customModel || undefined
);

// Export types for use in other components
export type { Message, ChatCompletionOptions, ChatCompletionResponse };

// Example usage:
// import { deepseekClient } from './services/deepseekService';
//
// // Simple Q&A
// const answer = await deepseekClient.ask('What is the meaning of life?');
// console.log(answer);
//
// // Advanced usage
// const response = await deepseekClient.chatCompletion({
//   messages: [
//     { role: 'system', content: 'You are a helpful assistant.' },
//     { role: 'user', content: 'Tell me a joke' }
//   ],
//   temperature: 0.7
// });
// console.log(response.choices[0].message.content);
//
// // Streaming usage
// for await (const chunk of deepseekClient.streamChatCompletion({
//   messages: [{ role: 'user', content: 'Write a story' }]
// })) {
//   console.log(chunk);
// }
