import { Quiz } from '../types';
import { extractTextFromPdf } from './pdfService';
import {
    GeneratedCard,
    ResearchPack,
    StudyBuddyResponse,
    generateFlashcards,
    generateQuizFromContent,
    generateResearchPack,
    generateStudyBuddyResponse,
    generateSummaryFromTopic
} from './deepseekService';

export type AuraAgentMode =
    | 'study_from_anything'
    | 'study_buddy'
    | 'content_pipeline'
    | 'research_assistant';

export type AuraAgentOutputType = 'flashcards' | 'quiz' | 'summary' | 'deck' | 'all';

export interface AuraAgentRequest {
    mode: AuraAgentMode;
    prompt: string;
    sourceText?: string;
    sourceUrl?: string;
    outputType?: AuraAgentOutputType;
    difficulty?: 'easy' | 'medium' | 'hard';
    file?: File | null;
    userContext?: string;
}

export interface AuraAgentResult {
    title: string;
    summary?: string;
    flashcards?: GeneratedCard[];
    quiz?: Quiz;
    studyBuddy?: StudyBuddyResponse;
    researchPack?: ResearchPack;
    extractedText?: string;
    metadata?: Record<string, string | number>;
}

const clampText = (text: string, limit = 18000) => text.length > limit ? `${text.slice(0, limit)}\n\n[Content truncated for processing]` : text;

const cleanExtractedText = (text: string) => text.replace(/\s+/g, ' ').trim();

export const extractTextFromUrl = async (url: string): Promise<string> => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Could not load URL content (${response.status}).`);
    }

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    doc.querySelectorAll('script, style, noscript, svg').forEach((node) => node.remove());

    const text = doc.body?.textContent || doc.documentElement?.textContent || '';
    const cleaned = cleanExtractedText(text);

    if (!cleaned) {
        throw new Error('The URL did not return readable text content.');
    }

    return clampText(cleaned);
};

export const extractTextFromFile = async (file: File): Promise<string> => {
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        return clampText(await extractTextFromPdf(file));
    }

    if (
        file.type.startsWith('text/') ||
        file.name.toLowerCase().endsWith('.md') ||
        file.name.toLowerCase().endsWith('.json') ||
        file.name.toLowerCase().endsWith('.csv')
    ) {
        return clampText(await file.text());
    }

    throw new Error('Unsupported file type. Upload PDF, TXT, MD, JSON, or CSV.');
};

const resolveSourceText = async (request: AuraAgentRequest): Promise<string> => {
    const chunks: string[] = [];

    if (request.sourceText?.trim()) {
        chunks.push(request.sourceText.trim());
    }

    if (request.sourceUrl?.trim()) {
        const extractedUrlText = await extractTextFromUrl(request.sourceUrl.trim());
        chunks.push(`Source URL: ${request.sourceUrl.trim()}\n${extractedUrlText}`);
    }

    if (request.file) {
        const fileText = await extractTextFromFile(request.file);
        chunks.push(`Uploaded file: ${request.file.name}\n${fileText}`);
    }

    return clampText(chunks.join('\n\n'));
};

export const runAuraAgent = async (request: AuraAgentRequest): Promise<AuraAgentResult> => {
    const difficulty = request.difficulty ?? 'medium';
    const outputType = request.outputType ?? 'all';
    const sourceText = await resolveSourceText(request);

    if (request.mode === 'study_from_anything') {
        if (!sourceText && !request.prompt.trim()) {
            throw new Error('Add source text, a URL, or a file before running Study From Anything.');
        }

        const effectiveContent = sourceText || request.prompt.trim();
        const result: AuraAgentResult = {
            title: 'Study From Anything',
            extractedText: sourceText || undefined,
            metadata: { outputType, difficulty }
        };

        if (outputType === 'flashcards' || outputType === 'all' || outputType === 'deck') {
            result.flashcards = await generateFlashcards(effectiveContent, {
                difficulty,
                includeExplanations: true,
                useThinking: outputType === 'deck' || outputType === 'all',
                userContext: request.userContext
            });
        }

        if (outputType === 'quiz' || outputType === 'all') {
            result.quiz = await generateQuizFromContent(effectiveContent, request.prompt || 'Study Material', difficulty, request.userContext);
        }

        if (outputType === 'summary' || outputType === 'all') {
            result.summary = sourceText
                ? `Processed source content and generated study outputs for "${request.prompt || 'uploaded material'}".`
                : await generateSummaryFromTopic(request.prompt.trim(), request.userContext);
        }

        return result;
    }

    if (request.mode === 'study_buddy') {
        if (!request.prompt.trim()) {
            throw new Error('Give the study buddy a question, concept, or tutoring goal.');
        }

        return {
            title: 'Study Buddy',
            studyBuddy: await generateStudyBuddyResponse(request.prompt.trim(), sourceText || undefined, request.userContext),
            extractedText: sourceText || undefined,
            metadata: { difficulty }
        };
    }

    if (request.mode === 'content_pipeline') {
        if (!sourceText) {
            throw new Error('Upload a file, paste text, or provide a URL for the content pipeline.');
        }

        const flashcards = await generateFlashcards(sourceText, {
            difficulty,
            includeExplanations: true,
            useThinking: true,
            userContext: request.userContext
        });
        const quiz = await generateQuizFromContent(sourceText, request.prompt || request.file?.name || 'Imported Content', difficulty, request.userContext);

        return {
            title: 'Content Pipeline',
            summary: `Processed ${request.file?.name || 'source material'} into structured study assets.`,
            flashcards,
            quiz,
            extractedText: sourceText,
            metadata: {
                difficulty,
                source: request.file?.name || request.sourceUrl || 'pasted text'
            }
        };
    }

    if (!request.prompt.trim()) {
        throw new Error('Give the research assistant a topic to investigate.');
    }

    return {
        title: 'Research Assistant',
        researchPack: await generateResearchPack(request.prompt.trim(), difficulty, request.userContext),
        metadata: { difficulty }
    };
};

