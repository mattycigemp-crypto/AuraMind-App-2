import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AuraAiClient } from '../services/api/auraAiService';

// Mock fetch globally
global.fetch = vi.fn();

describe('AuraAiClient', () => {
  let client: AuraAiClient;

  beforeEach(() => {
    vi.clearAllMocks();
    // Set test environment variables
    process.env.VITE_GROQ_API_KEY = 'test-key';
    process.env.VITE_USE_LOCAL_AI = 'false';
    client = new AuraAiClient();
  });

  describe('constructor', () => {
    it('should initialize with available API key', () => {
      const newClient = new AuraAiClient();
      expect(newClient).toBeDefined();
    });

    it('should use local AI when enabled', () => {
      process.env.VITE_USE_LOCAL_AI = 'true';
      const localClient = new AuraAiClient();
      expect(localClient).toBeDefined();
      process.env.VITE_USE_LOCAL_AI = 'false'; // Reset
    });
  });

  describe('chatCompletion', () => {
    it('should make API call with correct parameters', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Test response'
          }
        }]
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await client.chatCompletion({
        messages: [{ role: 'user', content: 'Test message' }],
        temperature: 0.7,
        max_tokens: 1000
      });

      expect(result.choices[0].message.content).toBe('Test response');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/chat/completions'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': expect.stringContaining('Bearer')
          })
        })
      );
    });

    it('should handle API errors', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Error message'
      } as Response);

      await expect(
        client.chatCompletion({
          messages: [{ role: 'user', content: 'Test' }]
        })
      ).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

      await expect(
        client.chatCompletion({
          messages: [{ role: 'user', content: 'Test' }]
        })
      ).rejects.toThrow('Network error');
    });
  });

  describe('ask', () => {
    it('should return response from simple question', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Test answer'
          }
        }]
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await client.ask('What is 2+2?');
      
      expect(result).toBe('Test answer');
    });

    it('should use custom system prompt when provided', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Custom response'
          }
        }]
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response);

      await client.ask('Test', 'Custom system prompt');
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('Custom system prompt')
        })
      );
    });
  });

  describe('studyAgentAsk', () => {
    it('should use study agent system prompt', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Study response'
          }
        }]
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await client.studyAgentAsk('Help me study');
      
      expect(result).toBe('Study response');
    });
  });

  describe('streamChatCompletion', () => {
    it('should stream response chunks', async () => {
      const mockChunks = [
        'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" world"}}]}\n\n',
        'data: [DONE]\n\n'
      ];

      const mockReader = {
        read: async () => {
          const chunk = mockChunks.shift();
          if (chunk) {
            return { done: false, value: new TextEncoder().encode(chunk) };
          }
          return { done: true, value: null };
        }
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        body: {
          getReader: () => mockReader
        }
      } as Response);

      const chunks = [];
      for await (const chunk of client.streamChatCompletion({
        messages: [{ role: 'user', content: 'Test' }]
      })) {
        chunks.push(chunk);
      }

      expect(chunks).toContain('Hello');
      expect(chunks).toContain(' world');
    });

    it('should handle streaming errors', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Stream error'
      } as Response);

      const chunks = [];
      try {
        for await (const chunk of client.streamChatCompletion({
          messages: [{ role: 'user', content: 'Test' }]
        })) {
          chunks.push(chunk);
        }
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});


