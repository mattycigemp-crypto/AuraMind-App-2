// Translation service for machine translation using local backend proxy
// Backend proxies requests to Google Translate unofficial API (free, no API key)

class TranslationService {
  private cache: Map<string, string> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 3600000; // 1 hour in milliseconds
  private apiUrl: string;

  constructor() {
    // Empty string makes requests relative (e.g. /api/translate), which the
    // production server rewrites to the translation backend. The old
    // 'http://localhost:3001' default silently hit the visitor's own machine.
    this.apiUrl = import.meta.env.VITE_TRANSLATION_API_URL || '';
  }

  /**
   * Translate text using backend proxy to Google Translate
   */
  async translate(text: string, targetLang: string, sourceLang: string = 'en'): Promise<string> {
    // Return original text if same language
    if (sourceLang === targetLang) {
      return text;
    }

    // Check cache
    const cacheKey = `${sourceLang}-${targetLang}-${text}`;
    const cached = this.cache.get(cacheKey);
    const expiry = this.cacheExpiry.get(cacheKey);

    if (cached && expiry && Date.now() < expiry) {
      return cached;
    }

    try {
      const response = await fetch(`${this.apiUrl}/api/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          source: sourceLang,
          target: targetLang
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Translation API error:', errorData);
        throw new Error(errorData.error || 'Translation failed');
      }

      const data = await response.json();
      const translatedText = data.translatedText;

      if (!translatedText) {
        throw new Error('No translation returned');
      }

      // Cache the result
      this.cache.set(cacheKey, translatedText);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION);

      return translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Return original text on error
    }
  }

  /**
   * Get available languages
   * Google Translate supports most languages. Return a comprehensive list.
   */
  async getLanguages(): Promise<Array<{ code: string; name: string }>> {
    // Google Translate supports most languages. Return a comprehensive list.
    return [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'it', name: 'Italian' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'ru', name: 'Russian' },
      { code: 'zh', name: 'Chinese' },
      { code: 'ja', name: 'Japanese' },
      { code: 'ko', name: 'Korean' },
      { code: 'ar', name: 'Arabic' },
      { code: 'hi', name: 'Hindi' },
      { code: 'nl', name: 'Dutch' },
      { code: 'pl', name: 'Polish' },
      { code: 'tr', name: 'Turkish' },
      { code: 'vi', name: 'Vietnamese' },
      { code: 'th', name: 'Thai' },
      { code: 'id', name: 'Indonesian' },
      { code: 'sv', name: 'Swedish' },
      { code: 'uk', name: 'Ukrainian' },
      { code: 'el', name: 'Greek' },
      { code: 'he', name: 'Hebrew' },
      { code: 'cs', name: 'Czech' },
      { code: 'ro', name: 'Romanian' },
      { code: 'da', name: 'Danish' },
      { code: 'fi', name: 'Finnish' },
      { code: 'no', name: 'Norwegian' },
      { code: 'hu', name: 'Hungarian' },
      { code: 'bn', name: 'Bengali' },
      { code: 'ta', name: 'Tamil' },
      { code: 'te', name: 'Telugu' },
      { code: 'mr', name: 'Marathi' },
      { code: 'ur', name: 'Urdu' },
      { code: 'fa', name: 'Persian' },
      { code: 'ms', name: 'Malay' },
      { code: 'fil', name: 'Filipino' },
      { code: 'sw', name: 'Swahili' },
    ];
  }

  /**
   * Check if translation service is available
   */
  async checkService(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/api/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: 'hello',
          source: 'en',
          target: 'es'
        })
      });
      return response.ok;
    } catch (error) {
      console.error('Translation service unavailable:', error);
      return false;
    }
  }

  /**
   * Translate multiple texts in batch
   */
  async translateBatch(texts: string[], targetLang: string, sourceLang: string = 'en'): Promise<string[]> {
    return Promise.all(
      texts.map(text => this.translate(text, targetLang, sourceLang))
    );
  }

  /**
   * Clear translation cache
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}

export const translationService = new TranslationService();



