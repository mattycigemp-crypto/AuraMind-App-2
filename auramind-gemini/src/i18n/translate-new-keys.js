import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the English translation file
const enTranslationPath = path.join(__dirname, 'locales', 'en', 'translation.json');
const enTranslation = JSON.parse(fs.readFileSync(enTranslationPath, 'utf8'));

// Translation API endpoint (using the local backend proxy)
const TRANSLATE_API_URL = process.env.VITE_TRANSLATION_API_URL || 'http://localhost:3001';

// Function to translate text using the backend proxy
async function translateText(text, targetLang) {
  try {
    const response = await fetch(`${TRANSLATE_API_URL}/api/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        source: 'en',
        target: targetLang,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Translation API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.translatedText || text;
  } catch (error) {
    console.error(`Translation error for "${text}" to ${targetLang}:`, error.message);
    return text; // Return original text if translation fails
  }
}

// Function to recursively translate all values in an object
async function translateObject(obj, targetLang) {
  const result = {};

  for (const key in obj) {
    const value = obj[key];

    if (typeof value === 'object' && !Array.isArray(value)) {
      result[key] = await translateObject(value, targetLang);
    } else if (typeof value === 'string') {
      // Skip translation if it's a variable placeholder like {{variable}}
      if (value.includes('{{') && value.includes('}}')) {
        result[key] = value;
      } else {
        // Translate the text
        const translated = await translateText(value, targetLang);
        result[key] = translated;
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } else {
      result[key] = value;
    }
  }

  return result;
}

// List of all supported languages (excluding English)
const languages = [
  'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'he',
  'hi', 'tr', 'vi', 'th', 'id', 'pl', 'nl', 'sv', 'uk', 'da', 'fi',
  'no', 'el', 'cs', 'ro', 'hu', 'bn'
];

// Translate for each language
for (const lang of languages) {
  console.log(`Translating to ${lang}...`);
  
  try {
    const translated = await translateObject(enTranslation, lang);
    
    const langPath = path.join(__dirname, 'locales', lang, 'translation.json');
    fs.writeFileSync(langPath, JSON.stringify(translated, null, 2), 'utf8');
    
    console.log(`Completed ${lang} translation`);
  } catch (error) {
    console.error(`Error translating to ${lang}:`, error.message);
  }
}

console.log('All translations completed!');
