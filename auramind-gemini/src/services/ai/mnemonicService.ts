import { auraAiClient } from '../api/auraAiService';
import { logger } from '../../lib/logger';

export interface MnemonicResult {
  topic: string;
  acronyms: string[];
  mnemonics: string[];
  memoryPalace?: string;
  story?: string;
  visualCue?: string;
}

const MNEMONIC_PROMPT = `You are a creative memory expert. Given a topic or list of items, generate memorable learning aids.

Rules:
- Generate 2-3 acronyms if applicable
- Generate 2-3 vivid mnemonics (sentences, phrases, or imagery)
- Generate one short memory palace scenario (a vivid walkthrough of a familiar place)
- Optionally include a short story that encodes the information
- Keep outputs concise, vivid, and easy to remember
- Output ONLY valid JSON with no markdown, no backticks, no commentary

Required JSON format:
{
  "topic": "Original topic",
  "acronyms": ["ACRONYM - meaning", "..."],
  "mnemonics": ["Mnemonic sentence", "..."],
  "memoryPalace": "Walk through your childhood home...",
  "story": "A short memorable story...",
  "visualCue": "A single vivid mental image description"
}`;

export async function generateMnemonic(topic: string): Promise<MnemonicResult> {
  if (!topic.trim()) {
    throw new Error('Topic is required');
  }

  try {
    const response = await auraAiClient.chatCompletion({
      messages: [
        { role: 'system', content: MNEMONIC_PROMPT },
        { role: 'user', content: `Generate memory aids for: ${topic}` },
      ],
      temperature: 0.85,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content || '';
    const data = parseMnemonicJson(content);
    return data;
  } catch (error) {
    logger.error('Failed to generate mnemonic:', error);
    throw error;
  }
}

function parseMnemonicJson(content: string): MnemonicResult {
  try {
    const parsed = JSON.parse(content.trim());
    return normalizeMnemonic(parsed, content);
  } catch {
    const fenceMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      try {
        const parsed = JSON.parse(fenceMatch[1].trim());
        return normalizeMnemonic(parsed, content);
      } catch {
        // fall through
      }
    }

    const objectMatch = content.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        const parsed = JSON.parse(objectMatch[0]);
        return normalizeMnemonic(parsed, content);
      } catch {
        // fall through
      }
    }
  }

  // Fallback: treat the whole response as a single mnemonic
  return {
    topic: 'Topic',
    acronyms: [],
    mnemonics: [content.trim().slice(0, 500)],
  };
}

function normalizeMnemonic(data: any, rawContent: string): MnemonicResult {
  return {
    topic: data.topic || data.subject || 'Topic',
    acronyms: Array.isArray(data.acronyms) ? data.acronyms.filter(Boolean) : [],
    mnemonics: Array.isArray(data.mnemonics) ? data.mnemonics.filter(Boolean) : [],
    memoryPalace: data.memoryPalace || data.memory_palace || '',
    story: data.story || '',
    visualCue: data.visualCue || data.visual_cue || '',
  };
}
