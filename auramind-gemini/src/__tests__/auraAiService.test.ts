import { describe, expect, it, beforeAll } from 'vitest';
import { auraAiClient } from '../services/api/auraAiService';
import { supabase } from '../services/database/supabase';

let userId: string;

beforeAll(async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.id) userId = user.id;
});

describe('auraAiService', () => {
  it('auraAiClient.ask returns a non-empty response from Groq', async () => {
    const reply = await auraAiClient.ask('What is 2+2?');
    expect(reply).toBeTruthy();
    expect(typeof reply).toBe('string');
    expect(reply.length).toBeGreaterThan(0);
  });

  it('auraAiClient can handle a longer context question', async () => {
    const reply = await auraAiClient.ask('Explain the concept of recursion in programming in one sentence.');
    expect(reply).toBeTruthy();
    expect(reply.length).toBeGreaterThan(0);
  });

  it('auraAiClient is an instance of AuraAiClient', () => {
    expect(auraAiClient).toBeDefined();
    expect(typeof auraAiClient.ask).toBe('function');
    expect(typeof auraAiClient.chatCompletion).toBe('function');
  });

  it('chatCompletion returns a valid response', async () => {
    const response = await auraAiClient.chatCompletion({
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say hello in one word.' },
      ],
      temperature: 0.1,
      max_tokens: 10,
    });
    expect(response.choices).toHaveLength(1);
    expect(response.choices[0].message.content).toBeTruthy();
    expect(response.choices[0].message.role).toBe('assistant');
  });
});
