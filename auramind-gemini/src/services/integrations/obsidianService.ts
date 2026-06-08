// Obsidian Markdown Import Service for AuraMind
// Handles importing markdown files from Obsidian vaults

interface ObsidianFile {
  name: string;
  path: string;
  content: string;
  tags: string[];
  links: string[];
}

class ObsidianService {
  parseMarkdown(content: string): ObsidianFile {
    const lines = content.split('\n');
    const tags: string[] = [];
    const links: string[] = [];

    // Extract tags (Obsidian format: #tag)
    for (const line of lines) {
      const tagMatches = line.match(/#(\w+)/g);
      if (tagMatches) {
        tags.push(...tagMatches.map(t => t.substring(1)));
      }

      // Extract wiki-style links [[link]]
      const linkMatches = line.match(/\[\[([^\]]+)\]\]/g);
      if (linkMatches) {
        links.push(...linkMatches.map(l => l.slice(2, -2)));
      }
    }

    return {
      name: '',
      path: '',
      content,
      tags,
      links,
    };
  }

  extractFlashcardsFromMarkdown(content: string): Array<{ question: string; answer: string }> {
    const cards: Array<{ question: string; answer: string }> = [];
    const lines = content.split('\n');
    let currentQuestion = '';
    let currentAnswer = '';
    let inAnswer = false;

    for (const line of lines) {
      // Detect question patterns (lines ending with ? or starting with Q:)
      if (line.trim().endsWith('?') || line.trim().toLowerCase().startsWith('q:')) {
        if (currentQuestion && currentAnswer) {
          cards.push({
            question: currentQuestion,
            answer: currentAnswer.trim()
          });
        }
        currentQuestion = line.replace(/^Q:\s*/i, '').trim();
        currentAnswer = '';
        inAnswer = false;
      }
      // Detect answer patterns (lines starting with A: or after a question)
      else if (line.trim().toLowerCase().startsWith('a:') || (currentQuestion && !inAnswer)) {
        inAnswer = true;
        currentAnswer += line.replace(/^A:\s*/i, '').trim() + '\n';
      }
      // Continue answer
      else if (inAnswer) {
        currentAnswer += line.trim() + '\n';
      }
      // Detect cloze deletions (Obsidian format: {{cloze}})
      else if (line.includes('{{') && line.includes('}}')) {
        const clozeMatches = line.match(/{{(.*?)}}/g);
        if (clozeMatches) {
          const clozeText = line.replace(/{{.*?}}/g, '_____');
          const answer = clozeMatches.map(m => m.slice(2, -2)).join(', ');
          cards.push({
            question: clozeText,
            answer: answer
          });
        }
      }
    }

    // Don't forget the last card
    if (currentQuestion && currentAnswer) {
      cards.push({
        question: currentQuestion,
        answer: currentAnswer.trim()
      });
    }

    return cards;
  }

  async importMarkdownFile(file: File): Promise<ObsidianFile> {
    const content = await file.text();
    return this.parseMarkdown(content);
  }

  async convertMarkdownToFlashcards(file: File): Promise<{ question: string; answer: string }[]> {
    const content = await file.text();
    return this.extractFlashcardsFromMarkdown(content);
  }

  async importVault(files: File[]): Promise<{ file: ObsidianFile; cards: Array<{ question: string; answer: string }> }[]> {
    const results = [];

    for (const file of files) {
      const obsidianFile = await this.importMarkdownFile(file);
      const cards = this.extractFlashcardsFromMarkdown(obsidianFile.content);
      results.push({
        file: obsidianFile,
        cards
      });
    }

    return results;
  }

  detectObsidianFormat(content: string): boolean {
    // Check for common Obsidian patterns
    const hasWikiLinks = /\[\[([^\]]+)\]\]/.test(content);
    const hasTags = /#\w+/.test(content);
    const hasCloze = /{{.*?}}/.test(content);
    const hasFrontMatter = /^---\n/.test(content);

    return hasWikiLinks || hasTags || hasCloze || hasFrontMatter;
  }
}

export const obsidianService = new ObsidianService();


