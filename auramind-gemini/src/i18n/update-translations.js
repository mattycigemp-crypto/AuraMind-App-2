import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the English translation file
const enTranslationPath = path.join(__dirname, 'locales', 'en', 'translation.json');
const enTranslation = JSON.parse(fs.readFileSync(enTranslationPath, 'utf8'));

// List of all supported languages
const languages = [
  'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'he',
  'hi', 'tr', 'vi', 'th', 'id', 'pl', 'nl', 'sv', 'uk', 'da', 'fi',
  'no', 'el', 'cs', 'ro', 'hu', 'bn'
];

// Function to merge new keys into existing translation
function mergeTranslations(existing, newKeys) {
  const result = { ...existing };
  
  for (const key in newKeys) {
    if (typeof newKeys[key] === 'object' && !Array.isArray(newKeys[key])) {
      if (!result[key] || typeof result[key] !== 'object') {
        result[key] = {};
      }
      result[key] = mergeTranslations(result[key] || {}, newKeys[key]);
    } else {
      // Only add if key doesn't exist in existing translation
      if (!(key in result)) {
        result[key] = newKeys[key];
      }
    }
  }
  
  return result;
}

// Update each language file
languages.forEach(lang => {
  const langPath = path.join(__dirname, 'locales', lang, 'translation.json');
  
  try {
    let existingTranslation = {};
    
    if (fs.existsSync(langPath)) {
      existingTranslation = JSON.parse(fs.readFileSync(langPath, 'utf8'));
    }
    
    // Merge new English keys into existing translation
    const updatedTranslation = mergeTranslations(existingTranslation, enTranslation);
    
    // Write back to file
    fs.writeFileSync(langPath, JSON.stringify(updatedTranslation, null, 2), 'utf8');
    console.log(`Updated ${lang} translation file`);
  } catch (error) {
    console.error(`Error updating ${lang}:`, error.message);
  }
});

console.log('Translation files updated successfully!');
