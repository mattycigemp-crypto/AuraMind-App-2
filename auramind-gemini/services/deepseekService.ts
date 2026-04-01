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

export class DeepseekClient {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://openrouter.ai/api/v1';
  private readonly defaultModel = 'deepseek/deepseek-r1-0528:free';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('API key is required for DeepseekClient');
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
        'HTTP-Referer': window.location.href,
        'X-Title': document.title,
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
      const message = errorPayload?.error?.message || 'Failed to fetch from Deepseek API';
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
}

// Initialize client with environment variable
const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
export const deepseekClient = new DeepseekClient(apiKey || '');

