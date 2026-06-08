const API_KEY = import.meta.env.VITE_WORDNIK_API_KEY;
const BASE_URL = 'https://api.wordnik.com/v4';

export interface Definition {
  text: string;
  sequence: string;
  attributionText?: string;
  sourceDictionary?: string;
}

export interface Example {
  text: string;
  title?: string;
  url?: string;
}

export interface Pronunciation {
  raw: string;
  rawType?: string;
}

export interface RelatedWord {
  relationshipType: string;
  words: string[];
}

export interface WordOfTheDay {
  word: string;
  definitions: Definition[];
  examples: Example[];
  pronunciations: Pronunciation[];
  relatedWords: RelatedWord[];
}

class WordnikService {
  private apiKey: string;

  constructor() {
    this.apiKey = API_KEY || '';
    if (!this.apiKey) {
      console.warn('Wordnik API key not found. Wordnik features will be disabled.');
    }
  }

  async getDefinitions(word: string, limit: number = 5): Promise<Definition[]> {
    if (!this.apiKey) return [];

    try {
      const response = await fetch(
        `${BASE_URL}/word.json/${encodeURIComponent(word)}/definitions?limit=${limit}&includeRelated=false&useCanonical=false&includeTags=false&api_key=${this.apiKey}`
      );
      
      if (!response.ok) return [];
      
      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Error fetching definitions:', error);
      return [];
    }
  }

  async getExamples(word: string, limit: number = 5): Promise<Example[]> {
    if (!this.apiKey) return [];

    try {
      const response = await fetch(
        `${BASE_URL}/word.json/${encodeURIComponent(word)}/examples?limit=${limit}&includeDuplicates=false&useCanonical=false&api_key=${this.apiKey}`
      );
      
      if (!response.ok) return [];
      
      const data = await response.json();
      return data?.examples || [];
    } catch (error) {
      console.error('Error fetching examples:', error);
      return [];
    }
  }

  async getPronunciations(word: string, limit: number = 5): Promise<Pronunciation[]> {
    if (!this.apiKey) return [];

    try {
      const response = await fetch(
        `${BASE_URL}/word.json/${encodeURIComponent(word)}/pronunciations?limit=${limit}&useCanonical=false&api_key=${this.apiKey}`
      );
      
      if (!response.ok) return [];
      
      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Error fetching pronunciations:', error);
      return [];
    }
  }

  async getRelatedWords(word: string, limit: number = 10): Promise<RelatedWord[]> {
    if (!this.apiKey) return [];

    try {
      const response = await fetch(
        `${BASE_URL}/word.json/${encodeURIComponent(word)}/relatedWords?limit=${limit}&useCanonical=false&api_key=${this.apiKey}`
      );
      
      if (!response.ok) return [];
      
      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Error fetching related words:', error);
      return [];
    }
  }

  async getRandomWord(): Promise<string | null> {
    if (!this.apiKey) return null;

    try {
      const response = await fetch(
        `${BASE_URL}/words.json/randomWord?hasDictionaryDef=true&minCorpusCount=1000&api_key=${this.apiKey}`
      );
      
      if (!response.ok) return null;
      
      const data = await response.json();
      return data?.word || null;
    } catch (error) {
      console.error('Error fetching random word:', error);
      return null;
    }
  }

  async getWordInfo(word: string) {
    const [definitions, examples, pronunciations, relatedWords] = await Promise.all([
      this.getDefinitions(word, 3),
      this.getExamples(word, 2),
      this.getPronunciations(word, 2),
      this.getRelatedWords(word, 5),
    ]);

    return {
      word,
      definitions,
      examples,
      pronunciations,
      relatedWords,
    };
  }

  async getWordOfTheDay(): Promise<WordOfTheDay | null> {
    if (!this.apiKey) return null;

    const today = new Date().toISOString().slice(0, 10);
    const cacheKey = `auramind-wotd-${today}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try { return JSON.parse(cached); } catch { /* fall through */ }
    }

    try {
      const word = await this.getRandomWord();
      if (!word) return null;

      const wordInfo = await this.getWordInfo(word);
      localStorage.setItem(cacheKey, JSON.stringify(wordInfo));
      return wordInfo;
    } catch (error) {
      console.error('Error fetching word of the day:', error);
      return null;
    }
  }
}

export const wordnikService = new WordnikService();



