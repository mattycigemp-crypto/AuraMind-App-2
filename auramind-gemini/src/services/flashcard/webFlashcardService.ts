// Flashcard service for generating flashcards from web articles and PDFs
import { GeneratedCard } from '../../services/api/groqService';
import { webSearchService } from '../search/webSearchService';

interface FlashcardGenerationOptions {
  topic: string;
  numCards?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  cardType?: 'definition' | 'conceptual' | 'application' | 'mixed';
  userContext?: string;
}

interface WebFlashcardResult {
  cards: GeneratedCard[];
  sources: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
  generationMethod: 'web-search' | 'pdf-extraction' | 'manual';
}

export class WebFlashcardService {
  private static instance: WebFlashcardService;

  private constructor() {}

  public static getInstance(): WebFlashcardService {
    if (!WebFlashcardService.instance) {
      WebFlashcardService.instance = new WebFlashcardService();
    }
    return WebFlashcardService.instance;
  }

  /**
   * Generate flashcards from web search results on a topic
   */
  public async generateFlashcardsFromWeb(
    options: FlashcardGenerationOptions
  ): Promise<WebFlashcardResult> {
    try {
      // Search for educational content on the topic
      const searchResults = await webSearchService.searchEducationalContent({
        query: options.topic,
        maxResults: 5,
        educationalFocus: true
      });

      if (searchResults.length === 0) {
        throw new Error('No educational content found for the specified topic');
      }

      // Combine content from search results
      const combinedContent = searchResults
        .map(result => `Source: ${result.title}\nURL: ${result.url}\nContent: ${result.snippet}`)
        .join('\n\n---\n\n');

      // Generate flashcards from the combined content
      const cards = await this.generateFlashcardsFromContent(
        combinedContent,
        options.topic,
        options
      );

      return {
        cards,
        sources: searchResults.map(result => ({
          title: result.title,
          url: result.url,
          snippet: result.snippet
        })),
        generationMethod: 'web-search'
      };
    } catch (error) {
      console.error('Failed to generate flashcards from web:', error);
      throw new Error(`Could not generate flashcards: ${error.message}`);
    }
  }

  /**
   * Generate flashcards from a PDF (placeholder for PDF extraction)
   * In a real implementation, this would use a PDF parsing library
   */
  public async generateFlashcardsFromPdf(
    pdfData: string | ArrayBuffer, // Base64 string or binary data
    options: FlashcardGenerationOptions
  ): Promise<WebFlashcardResult> {
    try {
      // For now, we'll simulate PDF flashcard generation
      // In a real implementation, we would:
      // 1. Extract text from PDF using a library like pdfjs-dist
      // 2. Process the extracted text to generate flashcards
      
      // Simulate PDF content extraction
      const simulatedPdfContent = `
        PDF Content Extraction Placeholder
        Topic: ${options.topic}
        
        This would contain the actual text extracted from the PDF document.
        The flashcard generation process would analyze this content to create
        educational flashcards covering key concepts, definitions, and applications.
      `;

      // Generate flashcards from the simulated PDF content
      const cards = await this.generateFlashcardsFromContent(
        simulatedPdfContent,
        options.topic,
        options
      );

      return {
        cards,
        sources: [{
          title: `PDF Document: ${options.topic}`,
          url: 'pdf-source://local-file',
          snippet: 'Content extracted from PDF document'
        }],
        generationMethod: 'pdf-extraction'
      };
    } catch (error) {
      console.error('Failed to generate flashcards from PDF:', error);
      throw new Error(`Could not generate flashcards from PDF: ${error.message}`);
    }
  }

  /**
   * Generate flashcards from content using AI
   */
  private async generateFlashcardsFromContent(
    content: string,
    topic: string,
    options: FlashcardGenerationOptions
  ): Promise<GeneratedCard[]> {
    try {
      // In a real implementation, this would use the deepseek service
      // For now, we'll generate structured flashcards based on the content
      
      const numCards = options.numCards || 8;
      const difficulty = options.difficulty || 'medium';
      const cardType = options.cardType || 'mixed';
      
      const cards: GeneratedCard[] = [];
      
      // Generate different types of flashcards based on cardType
      for (let i = 0; i < numCards; i++) {
        let question: string;
        let answer: string;
        
        switch (cardType) {
          case 'definition':
            [question, answer] = this.generateDefinitionCard(topic, i, content);
            break;
          case 'conceptual':
            [question, answer] = this.generateConceptualCard(topic, i, content);
            break;
          case 'application':
            [question, answer] = this.generateApplicationCard(topic, i, content);
            break;
          case 'mixed':
          default:
            // Rotate through different card types
            const typeIndex = i % 3;
            switch (typeIndex) {
              case 0:
                [question, answer] = this.generateDefinitionCard(topic, i, content);
                break;
              case 1:
                [question, answer] = this.generateConceptualCard(topic, i, content);
                break;
              case 2:
                [question, answer] = this.generateApplicationCard(topic, i, content);
                break;
            }
            break;
        }
        
        cards.push({
          question,
          answer,
          difficulty: this.getDifficultyForCard(i, numCards, difficulty),
          explanation: `This flashcard was generated from educational web sources about ${topic}.`
        });
      }
      
      return cards;
    } catch (error) {
      console.error('Failed to generate flashcards from content:', error);
      
      // Return fallback flashcards
      return Array.from({ length: options.numCards || 5 }, (_, i) => ({
        question: `What is an important aspect of ${topic} (part ${i + 1})?`,
        answer: `An important aspect of ${topic} involves key concepts that are essential for understanding the subject.`,
        difficulty: options.difficulty || 'medium',
        explanation: `This is a fallback flashcard generated when web content processing failed.`
      }));
    }
  }

  /**
   * Generate a definition-style flashcard
   */
  private generateDefinitionCard(
    topic: string,
    index: number,
    content: string
  ): [string, string] {
    // Extract potential definitions from content
    const definitionPatterns = [
      /is defined as\s+([^.]+)/gi,
      /refers to\s+([^.]+)/gi,
      /means\s+([^.]+)/gi,
      /is\s+([^.]+)\s+that/i
    ];
    
    let definition = '';
    for (const pattern of definitionPatterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > index) {
        definition = matches[index] || matches[0];
        break;
      }
    }
    
    if (!definition) {
      definition = `a key concept related to ${topic}`;
    }
    
    return [
      `What is ${topic}?`,
      `${topic} is ${definition.trim()}.`
    ];
  }

  /**
   * Generate a conceptual flashcard
   */
  private generateConceptualCard(
    topic: string,
    index: number,
    content: string
  ): [string, string] {
    const concepts = [
      `the main purpose of ${topic}`,
      `how ${topic} works`,
      `why ${topic} is important`,
      `when to use ${topic}`,
      `the key components of ${topic}`,
      `the benefits of ${topic}`,
      `the challenges associated with ${topic}`,
      `the future of ${topic}`
    ];
    
    const concept = concepts[index % concepts.length] || `an important aspect of ${topic}`;
    
    return [
      `What is ${concept}?`,
      `${concept} is a fundamental concept in understanding ${topic} and its applications.`
    ];
  }

  /**
   * Generate an application-style flashcard
   */
  private generateApplicationCard(
    topic: string,
    index: number,
    content: string
  ): [string, string] {
    const applications = [
      `real-world applications of ${topic}`,
      `how ${topic} is used in industry`,
      `practical examples of ${topic}`,
      `case studies involving ${topic}`,
      `how to implement ${topic}`,
      `tools and technologies related to ${topic}`,
      `best practices for ${topic}`,
      `common mistakes when using ${topic}`
    ];
    
    const application = applications[index % applications.length] || `practical uses of ${topic}`;
    
    return [
      `How is ${topic} applied in practice?`,
      `${topic} is applied through ${application}, which demonstrates its practical value and utility.`
    ];
  }

  /**
   * Get appropriate difficulty for a card based on position
   */
  private getDifficultyForCard(
    index: number,
    totalCards: number,
    baseDifficulty: 'easy' | 'medium' | 'hard'
  ): 'easy' | 'medium' | 'hard' {
    // Distribute difficulty evenly across the set of cards
    const third = Math.ceil(totalCards / 3);
    
    if (index < third) {
      // First third: easier cards
      if (baseDifficulty === 'hard') return 'medium';
      if (baseDifficulty === 'medium') return 'easy';
      return 'easy';
    } else if (index < 2 * third) {
      // Middle third: base difficulty
      return baseDifficulty;
    } else {
      // Last third: harder cards
      if (baseDifficulty === 'easy') return 'medium';
      if (baseDifficulty === 'medium') return 'hard';
      return 'hard';
    }
  }
}

// Export singleton instance
export const webFlashcardService = WebFlashcardService.getInstance();


