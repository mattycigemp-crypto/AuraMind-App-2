// Homework solver service for providing step-by-step explanations.
// All solutions are produced by the Groq API — no simulated answers.
import { groqChat } from '../api/groqClient';

interface HomeworkProblem {
  id: string;
  subject: 'math' | 'science' | 'history' | 'literature' | 'other';
  problemText: string;
  gradeLevel?: 'elementary' | 'middle' | 'high' | 'college' | 'unknown';
  steps?: SolutionStep[];
  finalAnswer?: string;
  explanation?: string;
}

interface SolutionStep {
  stepNumber: number;
  description: string;
  mathematicalExpression?: string;
  explanation?: string;
  imageUrl?: string; // For visual aids
}

interface HomeworkSolution {
  problem: HomeworkProblem;
  solutionSteps: SolutionStep[];
  finalAnswer: string;
  explanation: string;
  confidenceScore: number; // 0-1 score of solution confidence
  alternativeMethods?: AlternativeMethod[];
}

interface AlternativeMethod {
  name: string;
  description: string;
  steps: SolutionStep[];
  finalAnswer: string;
}

export class HomeworkSolverService {
  private static instance: HomeworkSolverService;

  private constructor() {}

  public static getInstance(): HomeworkSolverService {
    if (!HomeworkSolverService.instance) {
      HomeworkSolverService.instance = new HomeworkSolverService();
    }
    return HomeworkSolverService.instance;
  }

  /**
   * Solve a homework problem with step-by-step explanation
   */
  public async solveHomeworkProblem(
    problemText: string,
    subject: HomeworkProblem['subject'] = 'math',
    gradeLevel?: HomeworkProblem['gradeLevel'],
    userContext?: string
  ): Promise<HomeworkSolution> {
    try {
      const subjectGuide: Record<string, string> = {
        math: 'expert math tutor; show every algebraic/numerical step',
        science: 'expert science tutor; identify principles, list knowns, apply the law, check units',
        history: 'expert history tutor; ground claims in real events, dates and sources',
        literature: 'expert literature tutor; quote and analyze the text',
        other: 'expert tutor',
      };

      const solution = await this.callSolver(
        problemText,
        subject,
        subjectGuide[subject] || subjectGuide.other,
        gradeLevel,
        userContext
      );

      if (!solution) {
        throw new Error('The solver returned no valid solution');
      }

      return solution;
    } catch (error) {
      console.error('Homework solving error:', error);
      throw new Error(`Could not solve homework problem: ${error.message}`, { cause: error });
    }
  }

  /**
   * Ask Groq for a structured step-by-step solution and parse it.
   * Throws on invalid output — fabricated steps are never returned.
   */
  private async callSolver(
    problemText: string,
    subject: HomeworkProblem['subject'],
    role: string,
    gradeLevel?: HomeworkProblem['gradeLevel'],
    userContext?: string
  ): Promise<HomeworkSolution | null> {
    const prompt = `You are an ${role}. Solve the following ${subject} problem with clear, step-by-step explanation:

Problem: ${problemText}

${gradeLevel ? `Grade Level: ${gradeLevel}` : ''}
${userContext ? `Student Context: ${userContext}` : ''}

Return ONLY a JSON object (no markdown fences, no commentary) shaped exactly like:
{
  "problem": { "id": "prob_<timestamp>", "subject": "${subject}", "problemText": "...", "gradeLevel": "${gradeLevel || 'unknown'}" },
  "solutionSteps": [
    { "stepNumber": 1, "description": "Step description", "mathematicalExpression": "optional", "explanation": "optional" }
  ],
  "finalAnswer": "final answer",
  "explanation": "brief explanation of approach",
  "confidenceScore": 0.95,
  "alternativeMethods": [ { "name": "...", "description": "...", "steps": [...], "finalAnswer": "..." } ]
}`;

    const { content } = await groqChat({ prompt, temperature: 0.3 });
    const parsed = this.parseSolutionJson(content);

    if (!parsed || !Array.isArray(parsed.solutionSteps) || parsed.solutionSteps.length === 0 || !parsed.finalAnswer) {
      return null;
    }

    const steps: SolutionStep[] = parsed.solutionSteps
      .map((s: any, idx: number) => ({
        stepNumber: Number(s.stepNumber) || idx + 1,
        description: String(s.description || ''),
        mathematicalExpression: s.mathematicalExpression != null ? String(s.mathematicalExpression) : undefined,
        explanation: s.explanation != null ? String(s.explanation) : undefined,
        imageUrl: s.imageUrl != null ? String(s.imageUrl) : undefined,
      }))
      .filter((s: SolutionStep) => s.description.length > 0);

    if (steps.length === 0) return null;

    const alternativeMethods: AlternativeMethod[] = Array.isArray(parsed.alternativeMethods)
      ? parsed.alternativeMethods
          .filter((a: any) => a && a.name && Array.isArray(a.steps) && a.finalAnswer)
          .map((a: any) => ({
            name: String(a.name),
            description: String(a.description || ''),
            steps: a.steps.map((s: any, idx: number) => ({
              stepNumber: Number(s.stepNumber) || idx + 1,
              description: String(s.description || ''),
              mathematicalExpression: s.mathematicalExpression != null ? String(s.mathematicalExpression) : undefined,
              explanation: s.explanation != null ? String(s.explanation) : undefined,
            })),
            finalAnswer: String(a.finalAnswer),
          }))
      : [];

    return {
      problem: {
        id: `prob_${Date.now()}`,
        subject,
        problemText,
        gradeLevel: (parsed.problem?.gradeLevel ?? gradeLevel ?? 'unknown') as HomeworkProblem['gradeLevel'],
      },
      solutionSteps: steps,
      finalAnswer: String(parsed.finalAnswer),
      explanation: String(parsed.explanation || ''),
      confidenceScore: Math.min(1, Math.max(0, Number(parsed.confidenceScore) || 0.5)),
      alternativeMethods,
    };
  }

  private parseSolutionJson(text: string): any {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const candidate = fenced ? fenced[1] : text;
    try {
      return JSON.parse(candidate);
    } catch {
      const bareMatch = candidate.match(/\{[\s\S]*\}/);
      if (bareMatch) {
        try { return JSON.parse(bareMatch[0]); } catch { /* not JSON at all */ }
      }
    }
    return null;
  }

  /**
   * Generate practice problems similar to a given problem — generated by Groq.
   */
  public async generatePracticeProblems(
    originalProblem: string,
    subject: HomeworkProblem['subject'],
    count: number = 3
  ): Promise<HomeworkProblem[]> {
    try {
      const prompt = `You are a tutor creating practice problems. Given the problem below, generate ${count} NEW practice problems of similar difficulty and style in the same subject.

Original problem: ${originalProblem}
Subject: ${subject}

Return ONLY a JSON array (no markdown fences, no commentary):
[ { "problemText": "..." }, { "problemText": "..." } ]`;

      const { content } = await groqChat({ prompt, temperature: 0.8 });
      const parsed = this.parseSolutionJson(content);

      if (!Array.isArray(parsed) || parsed.length === 0) {
        return [];
      }

      return parsed
        .filter((p: any) => p && typeof p.problemText === 'string' && p.problemText.trim().length > 0)
        .map((p: any, i: number) => ({
          id: `practice_${Date.now()}_${i}`,
          subject,
          problemText: p.problemText.trim(),
          gradeLevel: undefined,
        }));
    } catch (error) {
      console.error('Error generating practice problems:', error);
      return [];
    }
  }
}

// Export singleton instance
export const homeworkSolverService = HomeworkSolverService.getInstance();
