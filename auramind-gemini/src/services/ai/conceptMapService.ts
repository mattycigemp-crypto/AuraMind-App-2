import { auraAiClient } from '../api/auraAiService';
import { logger } from '../../lib/logger';

export interface ConceptNode {
  id: string;
  label: string;
  group: string;
  description?: string;
  size?: number;
}

export interface ConceptEdge {
  source: string;
  target: string;
  label?: string;
  strength?: number;
}

export interface ConceptMapData {
  topic: string;
  nodes: ConceptNode[];
  edges: ConceptEdge[];
  summary?: string;
}

const CONCEPT_MAP_PROMPT = `You are an to an educational concept mapping assistant. Given a topic, generate a structured concept map as JSON.

Rules:
- Create 6-12 nodes representing key concepts
- Create 8-16 edges showing relationships between concepts
- Use descriptive labels and group related concepts by category
- Include a brief summary of the map
- Output ONLY valid JSON with no markdown, no backticks, no commentary

Required JSON format:
{
  "topic": "Topic name",
  "summary": "Brief overview of the concept map",
  "nodes": [
    { "id": "unique-id", "label": "Concept Name", "group": "category", "description": "Short description", "size": 1 }
  ],
  "edges": [
    { "source": "source-id", "target": "target-id", "label": "relationship", "strength": 0.8 }
  ]
}

The "size" field should be 1-3 based on importance (1 = minor, 2 = important, 3 = central).
The "strength" field should be 0.1-1.0 based on how strongly concepts are connected.`;

export async function generateConceptMap(topic: string): Promise<ConceptMapData> {
  if (!topic.trim()) {
    throw new Error('Topic is required');
  }

  try {
    const response = await auraAiClient.chatCompletion({
      messages: [
        { role: 'system', content: CONCEPT_MAP_PROMPT },
        { role: 'user', content: `Generate a concept map for: ${topic}` },
      ],
      temperature: 0.7,
      max_tokens: 2500,
    });

    const content = response.choices[0]?.message?.content || '';
    const data = parseConceptMapJson(content);

    if (!data.nodes?.length) {
      throw new Error('No concept nodes were generated');
    }

    return data;
  } catch (error) {
    logger.error('Failed to generate concept map:', error);
    throw error;
  }
}

function parseConceptMapJson(content: string): ConceptMapData {
  // Try direct JSON parse first
  try {
    const parsed = JSON.parse(content.trim());
    return normalizeConceptMap(parsed);
  } catch {
    // Try extracting JSON from markdown code fences
    const fenceMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      try {
        const parsed = JSON.parse(fenceMatch[1].trim());
        return normalizeConceptMap(parsed);
      } catch {
        // fall through
      }
    }

    // Try finding JSON object in the text
    const objectMatch = content.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        const parsed = JSON.parse(objectMatch[0]);
        return normalizeConceptMap(parsed);
      } catch {
        // fall through
      }
    }
  }

  throw new Error('Could not parse concept map JSON');
}

function normalizeConceptMap(data: any): ConceptMapData {
  return {
    topic: data.topic || 'Concept Map',
    summary: data.summary || '',
    nodes: (data.nodes || []).map((n: any, i: number) => ({
      id: n.id || `node-${i}`,
      label: n.label || n.name || n.id || `Concept ${i + 1}`,
      group: n.group || n.category || 'General',
      description: n.description || '',
      size: Math.max(1, Math.min(3, Number(n.size) || 1)),
    })),
    edges: (data.edges || []).map((e: any, _i: number) => ({
      source: e.source || '',
      target: e.target || '',
      label: e.label || e.relationship || '',
      strength: Math.max(0.1, Math.min(1, Number(e.strength) || 0.5)),
    })).filter((e: ConceptEdge) => e.source && e.target),
  };
}
