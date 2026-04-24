import { Quiz } from "../../types";

// Use existing OpenRouter setup instead of separate DeepSeek key
const getEnv = (key: string): string => {
    return (import.meta as any).env?.[key] || (process as any).env?.[key] || '';
};

const openRouterKey = getEnv('VITE_OPENROUTER_API_KEY');
const groqKey = getEnv('VITE_GROQ_API_KEY');
const useLocalAI = getEnv('VITE_USE_LOCAL_AI') === 'true';
const customModel = getEnv('VITE_AI_MODEL');
const localBaseUrl = '/local-ai/v1';

// Simple in-memory cache for AI responses
const responseCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Generate cache key
const getCacheKey = (prefix: string, params: any): string => {
    return `${prefix}:${JSON.stringify(params)}`;
};

// Get cached response
const getCachedResponse = (key: string): any | null => {
    const cached = responseCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('✅ Using cached response');
        return cached.data;
    }
    return null;
};

// Store response in cache
const setCachedResponse = (key: string, data: any): void => {
    responseCache.set(key, { data, timestamp: Date.now() });
    if (responseCache.size > 100) {
        const oldestKey = Array.from(responseCache.keys())[0];
        responseCache.delete(oldestKey);
    }
};

const getDeepSeekClient = () => {
    // Try API keys in order of preference (Groq first for speed, then OpenRouter)
    let apiKey: string;
    let baseUrl: string;
    let defaultModel: string;
    let apiKeySource: string;

    if (useLocalAI) {
        apiKey = 'not-needed';
        baseUrl = localBaseUrl;
        defaultModel = 'local-model';
        apiKeySource = 'local';
    } else if (groqKey) {
        // Groq is faster - use it first
        apiKey = groqKey;
        baseUrl = 'https://api.groq.com/openai/v1';
        defaultModel = customModel || 'llama-3.3-70b-versatile'; // Use faster, more capable model
        apiKeySource = 'groq';
    } else if (openRouterKey) {
        apiKey = openRouterKey;
        baseUrl = 'https://openrouter.ai/api/v1';
        defaultModel = customModel || 'deepseek/deepseek-r1-0528:free';
        apiKeySource = 'openrouter';
    } else {
        throw new Error('No valid API key found. Please set VITE_GROQ_API_KEY, VITE_OPENROUTER_API_KEY, or enable VITE_USE_LOCAL_AI=true');
    }

    if (!apiKey && !useLocalAI) {
        const source = apiKeySource === 'groq' ? 'VITE_GROQ_API_KEY' : 'VITE_OPENROUTER_API_KEY';
        throw new Error(`API Key is missing. Please set ${source} in your .env file.`);
    }
    
    return {
        chat: async (messages: any[], model: string = defaultModel) => {
            const response = await fetch(`${baseUrl}/chat/completions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey || 'not-needed'}`,
                    "HTTP-Referer": typeof window !== 'undefined' ? window.location.href : 'http://localhost:3000',
                    "X-Title": typeof document !== 'undefined' ? (document.title || 'AuraMind') : 'AuraMind App',
                },
                body: JSON.stringify({
                    model,
                    messages,
                    temperature: 0.7,
                    max_tokens: 4000
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            return response.json();
        }
    };
};

export interface GeneratedCard {
    question: string;
    answer: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    explanation?: string;
}

export interface FlashcardGenerationOptions {
    cardStyle?: 'definition' | 'conceptual' | 'multiple_choice';
    difficulty?: 'easy' | 'medium' | 'hard';
    includeExplanations?: boolean;
    useThinking?: boolean;
    userContext?: string;
}

export interface StudyBuddyResponse {
    response: string;
    followUpQuestions: string[];
    flashcards?: GeneratedCard[];
}

export interface ResearchPack {
    summary: string;
    keyConcepts: string[];
    importantFacts: string[];
    misconceptions: string[];
    flashcards: GeneratedCard[];
    quiz: Quiz;
}

/**
 * Generates flashcards from provided text content using DeepSeek.
 */
export const generateFlashcards = async (
    content: string,
    options: FlashcardGenerationOptions = {}
): Promise<GeneratedCard[]> => {
    const cacheKey = getCacheKey('flashcards', { content, options });
    const cached = getCachedResponse(cacheKey);
    if (cached) return cached;

    const client = getDeepSeekClient();
    const {
        cardStyle = 'conceptual',
        difficulty = 'medium',
        includeExplanations = false,
        userContext = '',
    } = options;

    const prompt = `You are an expert study assistant specializing in creating effective flashcards for learning.
Analyze the following text and create high-quality flashcards (Question and Answer pairs).

## Instructions:
- Focus on key concepts, definitions, relationships, and important facts
- Create questions that test understanding, not just memorization
- Use this flashcard style: ${cardStyle}
- Target difficulty: ${difficulty}
${cardStyle === 'multiple_choice'
        ? '- For multiple choice cards, write the question so the answer contains the correct option plus a short explanation'
        : ''}
${includeExplanations
        ? '- Include a brief explanation for why the answer is correct'
        : '- Do not include explanation text'}
${userContext ? `- Student Context: ${userContext}\n- Adapt style, depth, and difficulty according to their mastery metrics` : ''}

## Text to analyze:
"${content}"

## Response Format:
Respond with ONLY a valid JSON array. No conversational text, no markdown code blocks, no explanations outside the JSON.

Each flashcard object must have:
- question: string (clear, specific question)
- answer: string (concise, accurate answer)
- difficulty: "easy" | "medium" | "hard"
- explanation: string (optional, only if requested)

Example:
[
    {
        "question": "What is photosynthesis?",
        "answer": "Photosynthesis is the process by which plants convert sunlight, carbon dioxide, and water into glucose and oxygen.",
        "difficulty": "medium",
        "explanation": "This process occurs in chloroplasts and is essential for life on Earth."
    }
]`;

    try {
        const response = await client.chat([
            { role: "user", content: prompt }
        ]);

        const responseContent = response.choices[0]?.message?.content;
        if (!responseContent) return [];

        // Parse JSON response - try multiple patterns
        let jsonMatch = responseContent.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
            // Try to find JSON in code blocks
            jsonMatch = responseContent.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                jsonMatch = [jsonMatch[1]];
            }
        }
        
        if (!jsonMatch) return [];
        
        const cards = JSON.parse(jsonMatch[0]) as GeneratedCard[];
        setCachedResponse(cacheKey, cards);
        return cards;
    } catch (error) {
        console.error("Error generating flashcards:", error);
        throw error;
    }
};

/**
 * Generates a full deck (title, description, cards) from a topic using DeepSeek.
 */
export const generateDeckFromTopic = async (topic: string): Promise<{ title: string, description: string, cards: GeneratedCard[] }> => {
    const cacheKey = getCacheKey('deck', { topic });
    const cached = getCachedResponse(cacheKey);
    if (cached) return cached;

    const client = getDeepSeekClient();

    const prompt = `You are an expert educational content creator. Create a comprehensive study deck about: "${topic}".

## Instructions:
- Create a clear, descriptive title
- Write a brief description (1-2 sentences) of what this deck covers
- Generate 8-12 comprehensive flashcards covering the most important aspects
- Include a mix of easy, medium, and hard difficulty cards
- Focus on key concepts, definitions, relationships, and applications

## Response Format:
Respond with ONLY a valid JSON object. No conversational text, no markdown code blocks.

{
    "title": "Deck Title",
    "description": "Brief description of what this deck covers",
    "cards": [
        {
            "question": "Question text",
            "answer": "Answer text",
            "difficulty": "easy|medium|hard"
        }
    ]
}`;

    try {
        const response = await client.chat([
            { role: "user", content: prompt }
        ]);

        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error("No response from AI");

        // Parse JSON response - try multiple patterns
        let jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                jsonMatch = [jsonMatch[1]];
            }
        }
        
        if (!jsonMatch) throw new Error("Invalid JSON response");
        
        const deck = JSON.parse(jsonMatch[0]) as { title: string, description: string, cards: GeneratedCard[] };
        setCachedResponse(cacheKey, deck);
        return deck;
    } catch (error) {
        console.error("Error generating deck:", error);
        throw error;
    }
};

/**
 * Generates a summary of a topic using DeepSeek.
 */
export const generateSummaryFromTopic = async (topic: string, userContext?: string): Promise<string> => {
    const client = getDeepSeekClient();
    
    const contextStr = userContext ? `\n\nStudent Context:\n${userContext}\nAdapt explanation depth regarding their weak/strong spots if relevant.` : "";

    const prompt = `Research the topic "${topic}" and provide a detailed comprehensive study summary covering key facts, dates, definitions, and concepts. The summary should be dense with information suitable for creating flashcards.${contextStr}`;

    try {
        const response = await client.chat([
            { role: "user", content: prompt }
        ]);

        return response.choices[0]?.message?.content || "";
    } catch (error) {
        console.error("Error researching topic:", error);
        throw error;
    }
};

export const generateQuizFromContent = async (
    content: string,
    topic: string,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    userContext?: string
): Promise<Quiz> => {
    const cacheKey = getCacheKey('quiz', { content, topic, difficulty, userContext });
    const cached = getCachedResponse(cacheKey);
    if (cached) return cached;

    const client = getDeepSeekClient();
    
    const contextStr = userContext ? `\n\nStudent Context:\n${userContext}\nAdjust questions based on their demonstrated proficiency/mastery in these topics.` : "";

    const prompt = `You are an expert educational assessment creator. Create a comprehensive study quiz about "${topic}" using the provided source content.

## Instructions:
- Create 5-8 multiple choice questions
- Ensure questions test understanding, not just recall
- Include clear, plausible distractors (wrong answers)
- Provide explanations for why the correct answer is right
${userContext ? '- Adjust question difficulty based on student context' : ''}

## Source Content:
${content}${contextStr}

## Response Format:
Respond with ONLY a valid JSON object. No conversational text, no markdown code blocks.

{
    "id": "unique-quiz-id",
    "title": "Quiz Title",
    "topic": "${topic}",
    "difficulty": "${difficulty}",
    "questions": [
        {
            "id": "q1",
            "question": "Question text",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": 0,
            "explanation": "Explanation for why this answer is correct"
        }
    ]
}

Note: correctAnswer should be the index (0-3) of the correct option.`;

    try {
        const response = await client.chat([
            { role: "user", content: prompt }
        ]);

        const responseContent = response.choices[0]?.message?.content;
        if (!responseContent) throw new Error("No quiz response from AI");

        // Parse JSON response - try multiple patterns
        let jsonMatch = responseContent.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            jsonMatch = responseContent.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                jsonMatch = [jsonMatch[1]];
            }
        }
        
        if (!jsonMatch) throw new Error("Invalid JSON response");

        const parsed = JSON.parse(jsonMatch[0]) as Quiz;
        const quiz = {
            ...parsed,
            topic: parsed.topic || topic,
            difficulty: (parsed.difficulty || difficulty) as Quiz['difficulty'],
            questions: parsed.questions.map((question, index) => ({
                ...question,
                id: question.id || `q${index + 1}`,
                options: question.options.slice(0, 4),
                correctAnswer: Math.max(0, Math.min(question.correctAnswer, Math.max(0, question.options.length - 1))),
            }))
        };
        setCachedResponse(cacheKey, quiz);
        return quiz;
    } catch (error) {
        console.error("Error generating quiz:", error);
        throw error;
    }
};

export const generateStudyBuddyResponse = async (
    prompt: string,
    sourceText?: string,
    userContext?: string
): Promise<StudyBuddyResponse> => {
    const client = getDeepSeekClient();
    
    const contextStr = userContext ? `\nStudent Context:\n${userContext}\nIf you know their mastery level, tailor your tone and explanations to their skill.` : "";

    const fullPrompt = `You are AuraMind Companion, an elite but clear study tutor.
User request: ${prompt}
${sourceText ? `Primary source material:\n${sourceText}` : 'No source material was provided. Use general knowledge.'}${contextStr}

Respond with a JSON object containing:
{
    "response": "Your tutoring answer",
    "followUpQuestions": ["Question 1", "Question 2", "Question 3"],
    "flashcards": [
        {
            "question": "Question text",
            "answer": "Answer text",
            "difficulty": "easy|medium|hard",
            "explanation": "Explanation (optional)"
        }
    ]
}`;

    try {
        const response = await client.chat([
            { role: "user", content: fullPrompt }
        ]);

        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error("No study buddy response from AI");

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Invalid JSON response");

        const parsed = JSON.parse(jsonMatch[0]) as StudyBuddyResponse;
        return {
            response: parsed.response,
            followUpQuestions: parsed.followUpQuestions ?? [],
            flashcards: parsed.flashcards ?? []
        };
    } catch (error) {
        console.error("Error generating study buddy response:", error);
        throw error;
    }
};

export const generateResearchPack = async (
    topic: string,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    userContext?: string
): Promise<ResearchPack> => {
    const client = getDeepSeekClient();
    
    const contextStr = userContext ? `\nStudent Context:\n${userContext}\nAdapt content depth and vocabulary to fit their known metrics/weaknesses if applicable.` : "";

    const prompt = `Research "${topic}" and build a study pack for a ${difficulty} learner.${contextStr}

Generate a comprehensive JSON response with this structure:
{
    "summary": "Comprehensive summary of the topic",
    "keyConcepts": ["Concept 1", "Concept 2", "Concept 3"],
    "importantFacts": ["Fact 1", "Fact 2", "Fact 3"],
    "misconceptions": ["Misconception 1", "Misconception 2"],
    "flashcards": [
        {
            "question": "Question text",
            "answer": "Answer text",
            "difficulty": "easy|medium|hard",
            "explanation": "Explanation (optional)"
        }
    ],
    "quiz": {
        "id": "quiz-id",
        "title": "Quiz Title",
        "topic": "${topic}",
        "difficulty": "${difficulty}",
        "questions": [
            {
                "id": "q1",
                "question": "Question text",
                "options": ["Option A", "Option B", "Option C", "Option D"],
                "correctAnswer": 0,
                "explanation": "Explanation"
            }
        ]
    }
}

Include 4-6 flashcards and 4-6 quiz questions.`;

    try {
        const response = await client.chat([
            { role: "user", content: prompt }
        ]);

        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error("No research pack response from AI");

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Invalid JSON response");

        const parsed = JSON.parse(jsonMatch[0]) as ResearchPack;
        return parsed;
    } catch (error) {
        console.error("Error generating research pack:", error);
        throw error;
    }
};

/**
 * Note: DeepSeek doesn't support audio transcription like Gemini did.
 * This function is kept for compatibility but will need to be replaced
 * with a different service (e.g., OpenAI Whisper API) for audio functionality.
 */
export const transcribeAudio = async (base64Audio: string, mimeType: string = 'audio/wav'): Promise<string> => {
    throw new Error("Audio transcription is not supported with DeepSeek. Please use a different service like OpenAI Whisper API.");
};

/**
 * Note: DeepSeek doesn't support text-to-speech like Gemini did.
 * This function is kept for compatibility but will need to be replaced
 * with a different TTS service.
 */
export const generateSpeech = async (text: string): Promise<AudioBuffer | null> => {
    throw new Error("Text-to-speech is not supported with DeepSeek. Please use a different TTS service.");
};

