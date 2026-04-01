import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeepseekClient } from '../../services/deepseekService';

// Mock fetch
global.fetch = vi.fn();

describe('DeepseekClient', () => {
  let client: DeepseekClient;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    vi.clearAllMocks();
    client = new DeepseekClient(mockApiKey);
  });

  describe('constructor', () => {
    it('should throw error if no API key provided', () => {
      expect(() => new DeepseekClient('')).toThrow('API key is required for DeepseekClient');
    });

    it('should create instance with valid API key', () => {
      expect(() => new DeepseekClient(mockApiKey)).not.toThrow();
    });
  });

  describe('ask', () => {
    it('should send a simple question and return response', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'Test response'
            }
          }]
        })
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      const result = await client.ask('What is the meaning of life?');

      expect(fetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockApiKey}`,
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('What is the meaning of life?')
        })
      );

      expect(result).toBe('Test response');
    });

    it('should include system prompt if provided', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{
            message: {
              content: 'Test response with system prompt'
            }
          }]
        })
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      await client.ask('Test question', 'You are a helpful assistant');

      expect(fetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          body: expect.stringContaining('You are a helpful assistant')
        })
      );
    });

    it('should handle API errors', async () => {
      const mockResponse = {
        ok: false,
        json: vi.fn().mockResolvedValue({
          error: { message: 'API Error' }
        })
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      await expect(client.ask('Test question')).rejects.toThrow('API Error');
    });

    it('should handle network errors', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      await expect(client.ask('Test question')).rejects.toThrow('Network error');
    });
  });

  describe('chatCompletion', () => {
    it('should use default model and parameters', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          id: 'test-id',
          choices: [{
            message: { content: 'Response' }
          }],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 5,
            total_tokens: 15
          }
        })
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      const result = await client.chatCompletion({
        messages: [{ role: 'user', content: 'Test' }]
      });

      expect(fetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          body: expect.stringContaining('"model":"deepseek/deepseek-r1-0528:free"')
        })
      );

      expect(result.id).toBe('test-id');
      expect(result.choices[0].message.content).toBe('Response');
    });

    it('should accept custom parameters', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Custom response' } }]
        })
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      await client.chatCompletion({
        model: 'custom-model',
        messages: [{ role: 'user', content: 'Test' }],
        temperature: 0.5,
        max_tokens: 500
      });

      const bodyString = JSON.stringify({
        model: 'custom-model',
        messages: [{ role: 'user', content: 'Test' }],
        temperature: 0.5,
        max_tokens: 500
      });

      expect(fetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          body: bodyString
        })
      );
    });
  });
});
