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

const getDeepSeekClient = () => {
    // Try API keys in order of preference
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
        apiKey = groqKey;
        baseUrl = 'https://api.groq.com/openai/v1';
        defaultModel = customModel || 'groq/groq-llama3-8b-8192-tool-preview';
        apiKeySource = 'groq';
    } else if (openRouterKey) {
        apiKey = openRouterKey;
        baseUrl = 'https://openrouter.ai/api/v1';
        defaultModel = customModel || 'deepseek/deepseek-r1-0528:free';
        apiKeySource = 'openrouter';
    } else {
        throw new Error('No valid API key found. Please set VITE_OPENROUTER_API_KEY, VITE_GROQ_API_KEY, or enable VITE_USE_LOCAL_AI=true');
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
    const client = getDeepSeekClient();
    const {
        cardStyle = 'conceptual',
        difficulty = 'medium',
        includeExplanations = false,
        userContext = '',
    } = options;

    const prompt = `You are an expert study assistant. 
Analyze the following text and create a list of effective flashcards (Question and Answer pairs) to help a student learn this material.
Focus on key concepts, definitions, and important facts.
Use this flashcard style: ${cardStyle}.
Target difficulty: ${difficulty}.
${cardStyle === 'multiple_choice'
        ? 'For multiple choice cards, write the question so the answer contains the correct option plus a short explanation.'
        : ''}
${includeExplanations
        ? 'Include a short explanation for why the answer is correct.'
        : 'Do not include explanation text.'}

${userContext ? `Student Context:\n${userContext}\nAdapt style, depth, and difficulty according to their mastery metrics.` : ''}

Text content:
"${content}"

Respond with a JSON array of flashcard objects. Each object should have:
- question: string
- answer: string
- difficulty: "easy" | "medium" | "hard"
- explanation: string (optional)

Example format:
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

        const content = response.choices[0]?.message?.content;
        if (!content) return [];

        // Parse JSON response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (!jsonMatch) return [];
        
        return JSON.parse(jsonMatch[0]) as GeneratedCard[];
    } catch (error) {
        console.error("Error generating flashcards:", error);
        throw error;
    }
};

/**
 * Generates a full deck (title, description, cards) from a topic using DeepSeek.
 */
export const generateDeckFromTopic = async (topic: string): Promise<{ title: string, description: string, cards: GeneratedCard[] }> => {
    const client = getDeepSeekClient();

    const prompt = `Create a complete study deck about: "${topic}".

Generate a response with this JSON structure:
{
    "title": "Title of the deck",
    "description": "Brief description of what this deck covers",
    "cards": [
        {
            "question": "Question text",
            "answer": "Answer text",
            "difficulty": "easy|medium|hard"
        }
    ]
}

Create 8-12 comprehensive flashcards covering the most important aspects of the topic.`;

    try {
        const response = await client.chat([
            { role: "user", content: prompt }
        ]);

        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error("No response from AI");

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Invalid JSON response");
        
        return JSON.parse(jsonMatch[0]) as { title: string, description: string, cards: GeneratedCard[] };
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
    const client = getDeepSeekClient();
    
    const contextStr = userContext ? `\n\nStudent Context:\n${userContext}\nAdjust questions based on their demonstrated proficiency/mastery in these topics.` : "";

    const prompt = `Create a clean study quiz about "${topic}" using this source content:

${content}${contextStr}

Generate a JSON quiz with this structure:
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

Create 5-8 multiple choice questions. The correctAnswer should be the index (0-3) of the correct option.`;

    try {
        const response = await client.chat([
            { role: "user", content: prompt }
        ]);

        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error("No quiz response from AI");

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Invalid JSON response");

        const parsed = JSON.parse(jsonMatch[0]) as Quiz;
        return {
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

