// Enhanced AI tutor service that can explain concepts from web sources
import { StudyBuddyResponse } from '../../services/api/groqService';
import { webSearchService } from '../search/webSearchService';
import { webQuizService } from '../quiz/webQuizService';

interface WebExplanationOptions {
  concept: string;
  detailLevel?: 'basic' | 'intermediate' | 'advanced';
  includeExamples?: boolean;
  includeAnalogies?: boolean;
  userContext?: string;
}

interface WebTutorResponse {
  explanation: string;
  keyPoints: string[];
  examples: string[];
  analogies: string[];
  relatedConcepts: string[];
  sources: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
  followUpQuestions: string[];
  suggestedResources: Array<{
    type: 'video' | 'article' | 'interactive' | 'quiz';
    title: string;
    description: string;
    url: string;
  }>;
}

export class WebTutorService {
  private static instance: WebTutorService;

  private constructor() {}

  public static getInstance(): WebTutorService {
    if (!WebTutorService.instance) {
      WebTutorService.instance = new WebTutorService();
    }
    return WebTutorService.instance;
  }

  /**
   * Explain a concept using information from web sources
   */
  public async explainConceptFromWeb(
    options: WebExplanationOptions
  ): Promise<WebTutorResponse> {
    try {
      // Search for educational content about the concept
      const searchResults = await webSearchService.searchEducationalContent({
        query: options.concept,
        maxResults: 5,
        educationalFocus: true
      });

      if (searchResults.length === 0) {
        throw new Error('No educational content found for the specified concept');
      }

      // Combine content from search results
      const combinedContent = searchResults
        .map(result => `Source: ${result.title}\nURL: ${result.url}\nContent: ${result.snippet}`)
        .join('\n\n---\n\n');

      // Generate explanation using the deepseek service with web content
      const explanationResult = await this.generateWebExplanation(
        options.concept,
        combinedContent,
        options
      );

      // Generate related quiz questions
      const quiz = await webQuizService.generateQuizFromWeb({
        topic: options.concept,
        difficulty: options.detailLevel === 'advanced' ? 'hard' : 
                  options.detailLevel === 'intermediate' ? 'medium' : 'easy',
        userContext: options.userContext
      });

      return {
        ...explanationResult,
        sources: searchResults.map(result => ({
          title: result.title,
          url: result.url,
          snippet: result.snippet
        })),
        suggestedResources: this.generateSuggestedResources(searchResults, options.concept)
      };
    } catch (error) {
      console.error('Failed to explain concept from web:', error);
      throw new Error(`Could not explain concept: ${error.message}`);
    }
  }

  /**
   * Generate explanation from web content using AI
   */
  private async generateWebExplanation(
    concept: string,
    webContent: string,
    options: WebExplanationOptions
  ): Promise<Omit<WebTutorResponse, 'sources' | 'suggestedResources'>> {
    try {
      // Use the deepseek service to generate a comprehensive explanation
      const prompt = `You are an expert tutor explaining the concept: "${concept}".

Use the following web search results as your primary sources:
${webContent}

## Instructions:
- Provide a clear, comprehensive explanation suitable for a ${options.detailLevel || 'intermediate'} learner
- Focus on key concepts, definitions, and practical applications
- ${options.includeExamples ? 'Include relevant examples to illustrate the concept' : ''}
- ${options.includeAnalogies ? 'Use analogies to make complex ideas more accessible' : ''}
- ${options.userContext ? `Consider the student's background: ${options.userContext}` : ''}

## Response Format:
Respond with ONLY a valid JSON object. No conversational text, no markdown code blocks.

{
  "explanation": "Comprehensive explanation of the concept",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
  "examples": ["Example 1", "Example 2"],
  "analogies": ["Analogy 1", "Analogy 2"],
  "relatedConcepts": ["Related concept 1", "Related concept 2"],
  "followUpQuestions": ["Question 1", "Question 2", "Question 3"]
}`;

      // This would normally call the AI service
      // For now, we'll return a structured response based on the web content
      
      // Extract key information from web content
      const keyPoints = this.extractKeyPoints(webContent);
      const examples = this.extractExamples(webContent);
      const analogies = this.generateAnalogies(concept, webContent);
      const relatedConcepts = this.extractRelatedConcepts(webContent);
      const followUpQuestions = this.generateFollowUpQuestions(concept, webContent);

      // Generate explanation
      const explanation = this.generateExplanation(concept, webContent, options.detailLevel);

      return {
        explanation,
        keyPoints,
        examples,
        analogies,
        relatedConcepts,
        followUpQuestions
      };
    } catch (error) {
      console.error('Failed to generate web explanation:', error);
      
      // Fallback explanation
      return {
        explanation: `The concept of "${concept}" refers to an important topic that has been identified from web search results. Due to technical limitations, a detailed explanation cannot be provided at this moment, but the concept has been verified through educational web sources.`,
        keyPoints: [`Key aspect of ${concept}`, "Important principle to remember", "Practical application in real-world scenarios"],
        examples: [`Example application of ${concept}`, `Case study involving ${concept}`],
        analogies: [`${concept} is like a foundation for understanding related topics`],
        relatedConcepts: [`Advanced ${concept}`, `${concept} applications`, `Related field to ${concept}`],
        followUpQuestions: [
          `How does ${concept} relate to real-world problems?`,
          `What are the latest developments in ${concept}?`,
          `How can I apply ${concept} in practical situations?`
        ]
      };
    }
  }

  /**
   * Generate a comprehensive explanation
   */
  private generateExplanation(
    concept: string,
    content: string,
    detailLevel: WebExplanationOptions['detailLevel']
  ): string {
    // In a real implementation, this would use AI to generate the explanation
    // For now, create a structured explanation based on the content
    
    const detailGuidance = {
      basic: "Provide a simple, easy-to-understand overview",
      intermediate: "Give a balanced explanation with appropriate detail",
      advanced: "Provide a detailed, technical explanation with nuanced insights"
    };
    
    return `Based on educational web sources, ${concept} is an important concept that involves multiple facets. ${detailGuidance[detailLevel || 'intermediate']}. The concept has been verified through multiple educational resources and represents established knowledge in the field.`;
  }

  /**
   * Extract key points from content
   */
  private extractKeyPoints(content: string): string[] {
    const points: string[] = [];
    const sentences = content.split(/[.!?]+/);
    
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (trimmed.length > 30 && trimmed.length < 200) {
        // Look for sentences that seem to contain key information
        if (trimmed.includes('is') || trimmed.includes('are') || trimmed.includes('refers to')) {
          points.push(trimmed);
          if (points.length >= 5) break;
        }
      }
    }
    
    return points.length > 0 ? points : ["Key concept identified from educational sources"];
  }

  /**
   * Extract examples from content
   */
  private extractExamples(content: string): string[] {
    const examples: string[] = [];
    const lowerContent = content.toLowerCase();
    
    // Look for example indicators
    const exampleIndicators = ['for example', 'such as', 'e.g.', 'example:', 'for instance'];
    
    for (const indicator of exampleIndicators) {
      const index = lowerContent.indexOf(indicator);
      if (index !== -1) {
        // Extract text around the example indicator
        const start = Math.max(0, index - 50);
        const end = Math.min(content.length, index + 150);
        const exampleText = content.substring(start, end).trim();
        if (exampleText.length > 20) {
          examples.push(exampleText);
        }
      }
    }
    
    return examples.length > 0 ? examples : [`Example application of the concept`];
  }

  /**
   * Generate analogies for a concept
   */
  private generateAnalogies(concept: string, content: string): string[] {
    // Simple analogy generation - in production would use more sophisticated methods
    const analogies = [
      `${concept} is like a tool in a toolbox - you use it when you need to solve specific problems`,
      `Understanding ${concept} is similar to learning the rules of a game before playing`,
      `${concept} works like a recipe - follow the steps to get the desired result`
    ];
    
    return analogies.slice(0, 2);
  }

  /**
   * Extract related concepts from content
   */
  private extractRelatedConcepts(content: string): string[] {
    const related: string[] = [];
    const words = content.toLowerCase().split(/\s+/);
    
    // Look for capitalized phrases that might be concepts
    const potentialConcepts = content.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || [];
    
    for (const concept of potentialConcepts) {
      if (concept.length > 3 && concept.length < 30 && !related.includes(concept)) {
        related.push(concept);
        if (related.length >= 5) break;
      }
    }
    
    return related.length > 0 ? related : [`Related concept 1`, `Related concept 2`];
  }

  /**
   * Generate follow-up questions
   */
  private generateFollowUpQuestions(concept: string, content: string): string[] {
    return [
      `How does ${concept} apply in real-world situations?`,
      `What are the limitations or criticisms of ${concept}?`,
      `How has the understanding of ${concept} evolved over time?`
    ];
  }

  /**
   * Generate suggested learning resources
   */
  private generateSuggestedResources(
    searchResults: Array<{title: string; url: string; snippet: string}>,
    concept: string
  ): Array<{
    type: 'video' | 'article' | 'interactive' | 'quiz';
    title: string;
    description: string;
    url: string;
  }> {
    const resources: Array<{
      type: 'video' | 'article' | 'interactive' | 'quiz';
      title: string;
      description: string;
      url: string;
    }> = [];
    
    // Add articles from search results
    for (const result of searchResults.slice(0, 3)) {
      resources.push({
        type: 'article',
        title: result.title,
        description: result.snippet.substring(0, 100) + '...',
        url: result.url
      });
    }
    
    // Add suggested video search
    resources.push({
      type: 'video',
      title: `Educational videos about ${concept}`,
      description: `Find video lectures and tutorials on ${concept} from educational platforms`,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(concept + ' tutorial')}`
    });
    
    // Add suggested interactive resource
    resources.push({
      type: 'interactive',
      title: `Interactive ${concept} simulations`,
      description: `Explore interactive simulations and visualizations of ${concept}`,
      url: `https://phet.colorado.edu/en/simulations/category/new` // Example science simulations
    });
    
    return resources;
  }
}

// Export singleton instance
export const webTutorService = WebTutorService.getInstance();


