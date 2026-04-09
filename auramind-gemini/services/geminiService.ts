import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Quiz } from "../types";

const apiKey = process.env.API_KEY;

const getAIClient = () => {
    if (!apiKey) {
        throw new Error("API Key is missing. Please set process.env.API_KEY.");
    }
    return new GoogleGenAI({ apiKey });
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
 * Generates flashcards from provided text content.
 * Supports "Deep Thinking" mode for complex queries.
 */
export const generateFlashcards = async (
    content: string,
    options: FlashcardGenerationOptions = {}
): Promise<GeneratedCard[]> => {
    const ai = getAIClient();
    const {
        cardStyle = 'conceptual',
        difficulty = 'medium',
        includeExplanations = false,
        useThinking = false,
    } = options;
    const model = useThinking ? "gemini-3-pro-preview" : "gemini-3-flash-preview";

    const prompt = `
    You are an expert study assistant. 
    Analyze the following text and create a list of effective flashcards (Question and Answer pairs) to help a student learn this material.
    Focus on key concepts, definitions, and important facts.
    Use this flashcard style: ${cardStyle}.
    Target difficulty: ${difficulty}.
    Use this flashcard style: ${cardStyle}.
    Target difficulty: ${difficulty}.
    ${cardStyle === 'multiple_choice'
        ? 'For multiple choice cards, write the question so the answer contains the correct option plus a short explanation.'
        : ''}
    ${includeExplanations
        ? 'Include a short explanation for why the answer is correct.'
        : 'Do not include explanation text.'}
    
    ${options.userContext ? `Student Context:\n${options.userContext}\nAdapt style, depth, and difficulty according to their mastery metrics.` : ''}
    
    Text content:
    "${content}"
    `;

    const config: any = {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    question: { type: Type.STRING },
                    answer: { type: Type.STRING },
                    difficulty: { type: Type.STRING },
                    explanation: { type: Type.STRING }
                },
                required: ["question", "answer"]
            }
        }
    };

    // Apply thinking config if requested
    if (useThinking) {
        config.thinkingConfig = { thinkingBudget: 32768 };
        // Note: Do not set maxOutputTokens when using thinking budget as per guidelines
    }

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config
        });

        const text = response.text;
        if (!text) return [];
        return JSON.parse(text) as GeneratedCard[];
    } catch (error) {
        console.error("Error generating flashcards:", error);
        throw error;
    }
};

/**
 * Generates a full deck (title, description, cards) from a topic using Thinking Mode.
 */
export const generateDeckFromTopic = async (topic: string): Promise<{ title: string, description: string, cards: GeneratedCard[] }> => {
    const ai = getAIClient();
    const model = "gemini-3-pro-preview"; // Always use Pro with Thinking for full deck creation

    const prompt = `Create a complete study deck about: "${topic}".`;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 32768 },
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        cards: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    question: { type: Type.STRING },
                                    answer: { type: Type.STRING }
                                },
                                required: ["question", "answer"]
                            }
                        }
                    },
                    required: ["title", "description", "cards"]
                },
                tools: [{ googleSearch: {} }]
            }
        });

        const text = response.text;
        if (!text) throw new Error("No response from AI");
        return JSON.parse(text) as { title: string, description: string, cards: GeneratedCard[] };
    } catch (error) {
        console.error("Error generating deck:", error);
        throw error;
    }
};

/**
 * Uses Search Grounding to research a topic and return a summary.
 */
export const generateSummaryFromTopic = async (topic: string, userContext?: string): Promise<string> => {
    const ai = getAIClient();
    const model = "gemini-3-flash-preview";
    
    const contextStr = userContext ? `\n\nStudent Context:\n${userContext}\nAdapt explanation depth regarding their weak/strong spots if relevant.` : "";

    try {
        const response = await ai.models.generateContent({
            model,
            contents: `Research the topic "${topic}" and provide a detailed comprehensive study summary covering key facts, dates, definitions, and concepts. The summary should be dense with information suitable for creating flashcards.${contextStr}`,
            config: {
                tools: [{ googleSearch: {} }]
            }
        });

        return response.text || "";
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
    const ai = getAIClient();
    const model = "gemini-3-flash-preview";
    
    const contextStr = userContext ? `\n\nStudent Context:\n${userContext}\nAdjust questions based on their demonstrated proficiency/mastery in these topics.` : "";

    const response = await ai.models.generateContent({
        model,
        contents: `Create a clean study quiz about "${topic}" using this source content:\n\n${content}${contextStr}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    topic: { type: Type.STRING },
                    difficulty: { type: Type.STRING },
                    questions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                question: { type: Type.STRING },
                                options: {
                                    type: Type.ARRAY,
                                    items: { type: Type.STRING }
                                },
                                correctAnswer: { type: Type.NUMBER },
                                explanation: { type: Type.STRING }
                            },
                            required: ["id", "question", "options", "correctAnswer"]
                        }
                    }
                },
                required: ["id", "title", "topic", "difficulty", "questions"]
            }
        }
    });

    const text = response.text;
    if (!text) {
        throw new Error("No quiz response from AI");
    }

    const parsed = JSON.parse(text) as Quiz;
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
};

export const generateStudyBuddyResponse = async (
    prompt: string,
    sourceText?: string,
    userContext?: string
): Promise<StudyBuddyResponse> => {
    const ai = getAIClient();
    const model = "gemini-3-flash-preview";
    
    const contextStr = userContext ? `\nStudent Context:\n${userContext}\nIf you know their mastery level, tailor your tone and explanations to their skill.` : "";

    const response = await ai.models.generateContent({
        model,
        contents: `You are AuraMind Companion, an elite but clear study tutor.
User request: ${prompt}
${sourceText ? `Primary source material:\n${sourceText}` : 'No source material was provided. Use general knowledge.'}${contextStr}
Respond with a tutoring answer, 3 follow-up questions, and up to 4 helpful flashcards.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    response: { type: Type.STRING },
                    followUpQuestions: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                    },
                    flashcards: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                question: { type: Type.STRING },
                                answer: { type: Type.STRING },
                                difficulty: { type: Type.STRING },
                                explanation: { type: Type.STRING }
                            },
                            required: ["question", "answer"]
                        }
                    }
                },
                required: ["response", "followUpQuestions"]
            }
        }
    });

    const text = response.text;
    if (!text) {
        throw new Error("No study buddy response from AI");
    }

    const parsed = JSON.parse(text) as StudyBuddyResponse;
    return {
        response: parsed.response,
        followUpQuestions: parsed.followUpQuestions ?? [],
        flashcards: parsed.flashcards ?? []
    };
};

export const generateResearchPack = async (
    topic: string,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    userContext?: string
): Promise<ResearchPack> => {
    const ai = getAIClient();
    const model = "gemini-3-pro-preview";
    
    const contextStr = userContext ? `\nStudent Context:\n${userContext}\nAdapt content depth and vocabulary to fit their known metrics/weaknesses if applicable.` : "";

    const response = await ai.models.generateContent({
        model,
        contents: `Research "${topic}" and build a study pack for a ${difficulty} learner.${contextStr}\nInclude a tight summary, key concepts, important facts, misconceptions, flashcards, and a quiz.`,
        config: {
            thinkingConfig: { thinkingBudget: 24576 },
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    summary: { type: Type.STRING },
                    keyConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
                    importantFacts: { type: Type.ARRAY, items: { type: Type.STRING } },
                    misconceptions: { type: Type.ARRAY, items: { type: Type.STRING } },
                    flashcards: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                question: { type: Type.STRING },
                                answer: { type: Type.STRING },
                                difficulty: { type: Type.STRING },
                                explanation: { type: Type.STRING }
                            },
                            required: ["question", "answer"]
                        }
                    },
                    quiz: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            title: { type: Type.STRING },
                            topic: { type: Type.STRING },
                            difficulty: { type: Type.STRING },
                            questions: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        id: { type: Type.STRING },
                                        question: { type: Type.STRING },
                                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                        correctAnswer: { type: Type.NUMBER },
                                        explanation: { type: Type.STRING }
                                    },
                                    required: ["id", "question", "options", "correctAnswer"]
                                }
                            }
                        },
                        required: ["id", "title", "topic", "difficulty", "questions"]
                    }
                },
                required: ["summary", "keyConcepts", "importantFacts", "misconceptions", "flashcards", "quiz"]
            }
        }
    });

    const text = response.text;
    if (!text) {
        throw new Error("No research pack response from AI");
    }

    const parsed = JSON.parse(text) as ResearchPack;
    return parsed;
};

/**
 * Transcribes audio using Gemini.
 */
export const transcribeAudio = async (base64Audio: string, mimeType: string = 'audio/wav'): Promise<string> => {
    const ai = getAIClient();
    const model = "gemini-3-flash-preview";

    try {
        const response = await ai.models.generateContent({
            model,
            contents: [
                {
                    inlineData: {
                        mimeType: mimeType,
                        data: base64Audio
                    }
                },
                { text: "Transcribe this audio accurately, focusing on the study content spoken." }
            ]
        });
        return response.text || "";
    } catch (error) {
        console.error("Error transcribing audio:", error);
        throw error;
    }
};

/**
 * Generates speech for flashcards (TTS).
 */
export const generateSpeech = async (text: string): Promise<AudioBuffer | null> => {
    const ai = getAIClient();
    const model = "gemini-2.5-flash-preview-tts";

    try {
        const response = await ai.models.generateContent({
            model,
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) return null;

        const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const audioBuffer = await decodeAudioData(
            decode(base64Audio),
            outputAudioContext,
            24000,
            1
        );
        return audioBuffer;

    } catch (error) {
        console.error("Error generating speech:", error);
        return null;
    }
};

// Helper to decode base64 to Uint8Array
function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

// Helper to decode PCM to AudioBuffer
async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}
