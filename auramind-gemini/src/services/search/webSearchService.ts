// Web search service for searching educational content
import { GeneratedCard } from '../api/groqService';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  relevanceScore: number;
}

interface WebSearchOptions {
  query: string;
  maxResults?: number;
  educationalFocus?: boolean;
  safeSearch?: boolean;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export class WebSearchService {
  private static instance: WebSearchService;
  private apiKey: string | null = null;
  private searchEngineId: string | null = null;

  private constructor() {
    // Initialize with environment variables
    this.apiKey = import.meta.env.VITE_GOOGLE_SEARCH_API_KEY || null;
    this.searchEngineId = import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID || null;
  }

  public static getInstance(): WebSearchService {
    if (!WebSearchService.instance) {
      WebSearchService.instance = new WebSearchService();
    }
    return WebSearchService.instance;
  }

  /**
   * Search the web for educational content via the Google Custom Search
   * JSON API. Throws when the API keys are not configured — no simulated
   * results are ever returned.
   */
  public async searchEducationalContent(options: WebSearchOptions): Promise<SearchResult[]> {
    if (!this.apiKey || !this.searchEngineId) {
      throw new Error(
        'Web search unavailable: set VITE_GOOGLE_SEARCH_API_KEY and VITE_GOOGLE_SEARCH_ENGINE_ID in auramind-gemini/.env (Google Custom Search JSON API) to enable live results.'
      );
    }

    try {
      const params = new URLSearchParams({
        key: this.apiKey,
        cx: this.searchEngineId,
        q: options.query,
        num: String(Math.min(options.maxResults || 10, 10)),
      });
      if (options.safeSearch) params.set('safe', 'active');

      const res = await fetch(`https://www.googleapis.com/customsearch/v1?${params.toString()}`);
      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new Error(`Google Custom Search API error (${res.status}): ${detail.slice(0, 200)}`);
      }

      const json = await res.json();
      const results: SearchResult[] = (json.items ?? []).map((item: any) => ({
        title: item.title || 'Untitled',
        url: item.link || '#',
        snippet: item.snippet || '',
        source: (item.displayLink || new URL(item.link || 'https://example.com').hostname).replace(/^www\./, ''),
        relevanceScore: item.score ?? 0.5,
      }));

      if (options.educationalFocus) {
        return results.filter(result =>
          this.isEducationalContent(result.title, result.snippet)
        );
      }

      return results;
    } catch (error) {
      console.error('Web search error:', error);
      throw error;
    }
  }

  /**
   * Generate flashcards from web search results
   */
  public async generateFlashcardsFromWeb(query: string, maxCards: number = 10): Promise<GeneratedCard[]> {
    try {
      const searchResults = await this.searchEducationalContent({
        query,
        maxResults: 5,
        educationalFocus: true
      });

      const flashcards: GeneratedCard[] = [];
      
      // Process each search result to extract key information
      for (const result of searchResults) {
        if (flashcards.length >= maxCards) break;
        
        // Extract key concepts from title and snippet
        const concepts = this.extractKeyConcepts(result.title + ' ' + result.snippet);
        
        for (const concept of concepts) {
          if (flashcards.length >= maxCards) break;
          
          flashcards.push({
            question: `What is ${concept.term}?`,
            answer: concept.description
          });
        }
      }
      
      return flashcards;
    } catch (error) {
      console.error('Failed to generate flashcards from web:', error);
      throw new Error('Could not generate flashcards from web search results', { cause: error });
    }
  }

  /**
   * Generate quiz questions from web search results
   */
  public async generateQuizFromWeb(query: string, numQuestions: number = 5): Promise<QuizQuestion[]> {
    try {
      const searchResults = await this.searchEducationalContent({
        query,
        maxResults: 5,
        educationalFocus: true
      });

      const questions: QuizQuestion[] = [];
      
      // Generate questions based on search results
      for (const result of searchResults) {
        if (questions.length >= numQuestions) break;
        
        const concept = this.extractMainConcept(result.title + ' ' + result.snippet);
        if (concept) {
          questions.push({
            question: `According to the source "${result.title}", what is ${concept.term}?`,
            options: [
              concept.description,
              this.generateDistractor(concept.description),
              this.generateDistractor(concept.description),
              this.generateDistractor(concept.description)
            ],
            correctAnswer: 0, // Correct answer is first option
            explanation: `This information is sourced from ${result.url}`
          });
        }
      }
      
      // Shuffle options for each question
      return questions.map(q => {
        const shuffledOptions = [...q.options];
        for (let i = shuffledOptions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
        }
        
        // Find new correct answer index
        const newCorrectIndex = shuffledOptions.indexOf(q.options[0]);
        
        return {
          ...q,
          options: shuffledOptions,
          correctAnswer: newCorrectIndex
        };
      });
    } catch (error) {
      console.error('Failed to generate quiz from web:', error);
      throw new Error('Could not generate quiz from web search results', { cause: error });
    }
  }

  /**
   * Check if content is educational
   */
  private isEducationalContent(title: string, snippet: string): boolean {
    const educationalKeywords = [
      'learn', 'study', 'education', 'tutorial', 'guide', 'lesson', 
      'course', 'academic', 'university', 'college', 'school', 'how to',
      'what is', 'definition', 'explanation', 'theory', 'concept',
      'mathematics', 'science', 'history', 'literature', 'physics',
      'chemistry', 'biology', 'algebra', 'calculus', 'statistics'
    ];
    
    const content = (title + ' ' + snippet).toLowerCase();
    return educationalKeywords.some(keyword => content.includes(keyword));
  }

  /**
   * Extract key concepts from text
   */
  private extractKeyConcepts(text: string): { term: string; description: string }[] {
    // Simple concept extraction - in production would use NLP
    const sentences = text.split(/[.!?]+/);
    const concepts: { term: string; description: string }[] = [];
    
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (trimmed.length > 20 && trimmed.length < 200) {
        // Look for definition patterns
        if (trimmed.includes(' is ') || trimmed.includes(' are ')) {
          const parts = trimmed.split(/ is | are /);
          if (parts.length >= 2) {
            concepts.push({
              term: parts[0].trim(),
              description: parts.slice(1).join(' is ').trim()
            });
          }
        }
      }
    }
    
    // Limit to reasonable number of concepts
    return concepts.slice(0, 5);
  }

  /**
   * Extract main concept from text
   */
  private extractMainConcept(text: string): { term: string; description: string } | null {
    const concepts = this.extractKeyConcepts(text);
    return concepts.length > 0 ? concepts[0] : null;
  }

  /**
   * Generate distractors for quiz questions
   */
  private generateDistractor(correctAnswer: string): string {
    // Simple distractor generation - in production would be more sophisticated
    const words = correctAnswer.split(' ');
    if (words.length <= 1) return correctAnswer + ' (incorrect)';
    
    // Shuffle a few words
    for (let i = words.length - 1; i > Math.max(0, words.length - 3); i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [words[i], words[j]] = [words[j], words[i]];
    }
    
    return words.join(' ');
  }
}

// Export singleton instance
export const webSearchService = WebSearchService.getInstance();


