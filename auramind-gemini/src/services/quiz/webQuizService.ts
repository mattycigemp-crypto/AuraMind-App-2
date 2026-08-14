// Quiz service that generates quizzes from web search content
import { Quiz } from '../../types';
import { webSearchService } from '../search/webSearchService';
import { generateQuizFromContent } from '../api/groqService';

interface WebQuizOptions {
  topic: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  numQuestions?: number;
  userContext?: string;
}

export class WebQuizService {
  private static instance: WebQuizService;

  private constructor() {}

  public static getInstance(): WebQuizService {
    if (!WebQuizService.instance) {
      WebQuizService.instance = new WebQuizService();
    }
    return WebQuizService.instance;
  }

  /**
   * Generate a quiz by searching the web for content on a topic
   */
  public async generateQuizFromWeb(options: WebQuizOptions): Promise<Quiz> {
    try {
      // Search for educational content on the topic
      const searchResults = await webSearchService.searchEducationalContent({
        query: options.topic,
        maxResults: 3,
        educationalFocus: true
      });

      if (searchResults.length === 0) {
        throw new Error('No educational content found for the specified topic');
      }

      // Combine content from search results
      const combinedContent = searchResults
        .map(result => `Title: ${result.title}\nContent: ${result.snippet}\nSource: ${result.url}`)
        .join('\n\n---\n\n');

      // Generate quiz from the combined content
      const quiz = await generateQuizFromContent(
        combinedContent,
        options.topic,
        options.difficulty || 'medium',
        options.userContext
      );

      // Return the quiz (sources would need to be added to Quiz type if needed)
      return quiz;
    } catch (error) {
      console.error('Failed to generate quiz from web:', error);
      throw new Error(`Could not generate quiz: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
    }
  }

  /**
   * Generate multiple quiz variations for adaptive learning
   */
  public async generateAdaptiveQuizSet(
    topic: string,
    baseDifficulty: 'easy' | 'medium' | 'hard',
    userPerformance: { correct: number; total: number } // Recent performance metrics
  ): Promise<Quiz[]> {
    try {
      // Adjust difficulty based on user performance
      const accuracy = userPerformance.total > 0 ? userPerformance.correct / userPerformance.total : 0.5;
      
      let difficulty = baseDifficulty;
      if (accuracy > 0.8) {
        // User is performing well, increase difficulty
        difficulty = this.increaseDifficulty(baseDifficulty);
      } else if (accuracy < 0.4) {
        // User is struggling, decrease difficulty
        difficulty = this.decreaseDifficulty(baseDifficulty);
      }

      // Generate quiz with adjusted difficulty
      const quiz = await this.generateQuizFromWeb({
        topic,
        difficulty,
        userContext: `User has answered ${userPerformance.correct}/${userPerformance.total} questions correctly recently (${Math.round(accuracy * 100)}% accuracy)`
      });

      return [quiz];
    } catch (error) {
      console.error('Failed to generate adaptive quiz set:', error);
      throw new Error('Could not generate adaptive quiz set', { cause: error });
    }
  }

  /**
   * Increase difficulty level
   */
  private increaseDifficulty(current: 'easy' | 'medium' | 'hard'): 'easy' | 'medium' | 'hard' {
    if (current === 'easy') return 'medium';
    if (current === 'medium') return 'hard';
    return 'hard'; // Already at max difficulty
  }

  /**
   * Decrease difficulty level
   */
  private decreaseDifficulty(current: 'easy' | 'medium' | 'hard'): 'easy' | 'medium' | 'hard' {
    if (current === 'hard') return 'medium';
    if (current === 'medium') return 'easy';
    return 'easy'; // Already at min difficulty
  }
}

// Export singleton instance
export const webQuizService = WebQuizService.getInstance();


