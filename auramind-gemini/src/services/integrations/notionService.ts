// Notion API Service for AuraMind
// Handles OAuth 2.0 flow and content extraction from Notion

interface NotionPage {
  id: string;
  title: string;
  content: string;
  url: string;
  last_edited_time: string;
}

interface NotionDatabase {
  id: string;
  title: string;
  url: string;
}

interface NotionBlock {
  id: string;
  type: string;
  content: string;
  children?: NotionBlock[];
}

/**
 * Shape of a single value in a Notion page's `properties` bag.
 *
 * The Notion API returns a discriminated union keyed by property type
 * ("rich_text", "select", …). We only read a handful of those types, so
 * this models them structurally rather than enumerating all ~20. Every
 * field is optional because which one is present depends on the
 * property's configured type in the source database.
 */
interface NotionPropertyValue {
  title?: Array<{ plain_text?: string }>;
  rich_text?: Array<{ plain_text?: string }>;
  number?: number | null;
  select?: { name?: string } | null;
  multi_select?: Array<{ name?: string }>;
  date?: { start?: string } | null;
  checkbox?: boolean;
}

type NotionProperties = Record<string, NotionPropertyValue | undefined>;

class NotionService {
  private baseUrl = 'https://api.notion.com/v1';
  private accessToken: string | null = null;

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  clearAccessToken() {
    this.accessToken = null;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    if (!this.accessToken) {
      throw new Error('Notion access token not set');
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Notion API error: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  async searchPages(query: string = ''): Promise<NotionPage[]> {
    const data = await this.request('/search', {
      method: 'POST',
      body: JSON.stringify({
        query: query,
        filter: {
          value: 'page',
          property: 'object'
        },
        sort: {
          direction: 'descending',
          timestamp: 'last_edited_time'
        }
      }),
    });

    return data.results.map((page: any) => ({
      id: page.id,
      title: page.properties.title?.title?.[0]?.plain_text || page.properties.Name?.title?.[0]?.plain_text || 'Untitled',
      content: this.extractPageContent(page),
      url: page.url,
      last_edited_time: page.last_edited_time,
    }));
  }

  async searchDatabases(query: string = ''): Promise<NotionDatabase[]> {
    const data = await this.request('/search', {
      method: 'POST',
      body: JSON.stringify({
        query: query,
        filter: {
          value: 'database',
          property: 'object'
        }
      }),
    });

    return data.results.map((db: any) => ({
      id: db.id,
      title: db.title?.[0]?.plain_text || db.properties.title?.title?.[0]?.plain_text || 'Untitled Database',
      url: db.url,
    }));
  }

  async getPageContent(pageId: string): Promise<string> {
    const data = await this.request(`/blocks/${pageId}/children`);
    return this.extractBlocksContent(data.results);
  }

  async getDatabaseContent(databaseId: string): Promise<string> {
    const data = await this.request(`/databases/${databaseId}/query`, {
      method: 'POST',
      body: JSON.stringify({}),
    });

    let content = '';
    for (const page of data.results) {
      content += await this.getPageContent(page.id);
      content += '\n\n';
    }

    return content;
  }

  private extractPageContent(page: any): string {
    // Extract content from page properties
    let content = '';
    
    // Try different property names for title/content
    const title = page.properties.title?.title?.[0]?.plain_text || 
                  page.properties.Name?.title?.[0]?.plain_text || 
                  page.properties.content?.rich_text?.[0]?.plain_text || '';
    
    if (title) {
      content += `# ${title}\n\n`;
    }

    // Extract other text properties
    for (const [key, value] of Object.entries(page.properties as NotionProperties)) {
      if (key === 'title' || key === 'Name') continue;
      if (!value || typeof value !== 'object') continue;

      // The first key identifies which member of the union this is.
      // Switching on it lets TypeScript narrow to the matching field
      // instead of indexing the object with a dynamic string.
      switch (Object.keys(value)[0]) {
        case 'rich_text': {
          const text = value.rich_text?.[0]?.plain_text;
          if (text) content += `${text}\n\n`;
          break;
        }
        case 'number': {
          if (value.number !== null && value.number !== undefined) {
            content += `${value.number}\n\n`;
          }
          break;
        }
        case 'select': {
          if (value.select?.name) content += `${value.select.name}\n\n`;
          break;
        }
        case 'multi_select': {
          const items = value.multi_select;
          if (items && items.length > 0) {
            content += items.map((item) => item.name).join(', ') + '\n\n';
          }
          break;
        }
        case 'date': {
          if (value.date?.start) content += `${value.date.start}\n\n`;
          break;
        }
        case 'checkbox': {
          content += `${value.checkbox ? '✓' : '✗'}\n\n`;
          break;
        }
      }
    }

    return content;
  }

  private extractBlocksContent(blocks: NotionBlock[]): string {
    let content = '';

    for (const block of blocks) {
      content += this.extractBlockContent(block);
      if (block.children && block.children.length > 0) {
        content += this.extractBlocksContent(block.children);
      }
    }

    return content;
  }

  private extractBlockContent(block: NotionBlock): string {
    switch (block.type) {
      case 'paragraph':
        return block.content + '\n\n';
      case 'heading_1':
        return `# ${block.content}\n\n`;
      case 'heading_2':
        return `## ${block.content}\n\n`;
      case 'heading_3':
        return `### ${block.content}\n\n`;
      case 'bulleted_list_item':
        return `• ${block.content}\n`;
      case 'numbered_list_item':
        return `1. ${block.content}\n`;
      case 'to_do':
        return `- [ ] ${block.content}\n`;
      case 'quote':
        return `> ${block.content}\n\n`;
      case 'code':
        return `\`\`\`\n${block.content}\n\`\`\`\n\n`;
      case 'divider':
        return '---\n\n';
      case 'callout':
        return `> ${block.content}\n\n`;
      default:
        return block.content + '\n\n';
    }
  }

  async convertToFlashcards(content: string, title: string): Promise<{ question: string; answer: string }[]> {
    // Use the existing AI service to convert Notion content to flashcards
    const { generateFlashcards } = await import('../api/groqService');
    
    const cards = await generateFlashcards(content, { userContext: title });
    
    return cards.map(card => ({
      question: card.question,
      answer: card.answer,
    }));
  }

  async getUserInfo(): Promise<{ name: string; avatar?: string }> {
    const data = await this.request('/users/me');
    return {
      name: data.name || 'Notion User',
      avatar: data.avatar_url,
    };
  }
}

export const notionService = new NotionService();


