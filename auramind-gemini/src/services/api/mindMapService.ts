import { auraAiClient } from './auraAiService';

export interface MindMapNode {
  id: string;
  label: string;
  description?: string;
  children: MindMapNode[];
}

export interface MindMapData {
  title: string;
  root: MindMapNode;
}

export async function generateMindMap(
  content: string,
  title: string
): Promise<MindMapData> {
  const prompt = `You are an expert at creating structured knowledge maps from study content.

Analyze the following content and extract its key concepts into a hierarchical mind map structure.

Title: "${title}"
Content:
${content.slice(0, 25000)}

## Rules:
- The root node is the main topic (use the title or a concise label)
- Create 3-7 main branches (key subtopics/concepts)
- Each main branch can have 2-5 sub-nodes
- Sub-nodes can have detail nodes (1-3)
- Max depth: 4 levels (root → main → sub → detail)
- Labels must be short (2-6 words)
- Optional "description" gives 1-2 sentences of context
- Every node must have a unique "id" (use kebab-case)
- Children array can be empty

## Response Format:
Respond with ONLY valid JSON. No markdown, no code fences, no extra text.

{
  "title": "Knowledge Map Title",
  "root": {
    "id": "main-topic",
    "label": "Main Topic Label",
    "description": "Brief overview of the topic (optional)",
    "children": [
      {
        "id": "branch-1",
        "label": "Branch Label",
        "description": "Description (optional)",
        "children": [
          {
            "id": "sub-branch-1",
            "label": "Sub Label",
            "description": "Description (optional)",
            "children": [
              {
                "id": "detail-1",
                "label": "Detail Label",
                "description": "Detail description (optional)",
                "children": []
              }
            ]
          }
        ]
      }
    ]
  }
}`;

  const response = await auraAiClient.chatCompletion({
    messages: [
      { role: 'system', content: 'You are a knowledge mapping AI. Always respond with valid JSON only, no markdown, no other text.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.4,
    max_tokens: 4096,
  });

  const raw = response.choices[0]?.message?.content || '';

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse mind map response from AI');
  }

  let jsonStr = jsonMatch[0];
  try {
    JSON.parse(jsonStr);
  } catch {
    jsonStr = jsonStr
      .replace(/,\s*([\]}])/g, '$1')
      .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
  }

  const parsed = JSON.parse(jsonStr) as MindMapData;

  if (!parsed.root || !parsed.root.label) {
    throw new Error('Invalid mind map structure from AI');
  }

  return parsed;
}
