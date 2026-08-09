/**
 * Environment Variable Validation
 * 
 * Validates required and optional environment variables at startup.
 * Fails fast with clear error messages if required variables are missing.
 */

interface EnvVarConfig {
  name: string;
  required: boolean;
  description: string;
  defaultValue?: string;
  validate?: (value: string) => boolean;
}

const ENV_CONFIG: EnvVarConfig[] = [
  {
    name: 'VITE_SUPABASE_URL',
    required: true,
    description: 'Supabase project URL',
    validate: (v) => v.startsWith('https://'),
  },
  {
    name: 'VITE_SUPABASE_ANON_KEY',
    required: true,
    description: 'Supabase anonymous key',
    validate: (v) => v.length > 20,
  },
  {
    name: 'VITE_GROQ_API_KEY',
    required: false,
    description: 'Groq AI API key (optional, for faster AI responses)',
  },
  {
    name: 'VITE_USE_PUTER',
    required: false,
    description: 'Puter.js toggle for the user-pays fallback AI provider (default true)',
    defaultValue: 'true',
  },
  {
    name: 'VITE_STRIPE_PUBLISHABLE_KEY',
    required: false,
    description: 'Stripe publishable key (optional, for payments)',
  },
  {
    name: 'VITE_POSTHOG_KEY',
    required: false,
    description: 'PostHog analytics key (optional)',
  },
];

export interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missingRequired: string[];
}

/**
 * Validate environment variables
 * Returns validation result with errors and warnings
 */
export function validateEnv(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingRequired: string[] = [];

  for (const config of ENV_CONFIG) {
    const value = import.meta.env[config.name];

    if (!value) {
      if (config.required) {
        errors.push(`Missing required: ${config.name} - ${config.description}`);
        missingRequired.push(config.name);
      } else {
        warnings.push(`Optional: ${config.name} not set - ${config.description}`);
      }
      continue;
    }

    // Check for placeholder values
    if (value.includes('your_') || value.includes('PLACEHOLDER') || value === 'xxx') {
      if (config.required) {
        errors.push(`Placeholder value for: ${config.name} - Replace with actual ${config.description.toLowerCase()}`);
        missingRequired.push(config.name);
      } else {
        warnings.push(`Placeholder value for: ${config.name} - Replace with actual ${config.description.toLowerCase()}`);
      }
      continue;
    }

    // Run custom validation
    if (config.validate && !config.validate(value)) {
      errors.push(`Invalid value: ${config.name} - ${config.description}`);
      missingRequired.push(config.name);
    }
  }

  // Check for AI provider configuration
  const hasGroq = !!import.meta.env.VITE_GROQ_API_KEY && !import.meta.env.VITE_GROQ_API_KEY.includes('your_');
  const hasLocalAI = import.meta.env.VITE_USE_LOCAL_AI === 'true';
  const puterEnabled = (import.meta.env.VITE_USE_PUTER ?? 'true') !== 'false';

  // Puter.js being enabled counts as "an AI provider configured" for the
  // purposes of the boot-time warning because it lets the user sign in
  // themselves. Don't trigger a "no AI provider configured" warning
  // when Puter is available, even if no Groq key is set.
  if (!hasGroq && !hasLocalAI && !puterEnabled) {
    warnings.push('No AI provider configured - AI features will use demo mode');
  } else if (!hasGroq && !hasLocalAI && puterEnabled) {
    warnings.push('No developer AI key set; users can sign in with Puter for free AI in-browser.');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    missingRequired,
  };
}

/**
 * Log validation results to console
 */
export function logEnvValidation(result: EnvValidationResult): void {
  if (result.valid && result.warnings.length === 0) {
    console.warn('[AuraMind] Environment validation passed');
    return;
  }

  if (result.errors.length > 0) {
    console.error('[AuraMind] Environment validation FAILED:');
    result.errors.forEach((err) => console.error(`  - ${err}`));
  }

  if (result.warnings.length > 0) {
    console.warn('[AuraMind] Environment warnings:');
    result.warnings.forEach((warn) => console.warn(`  - ${warn}`));
  }
}

/**
 * Get a typed environment variable with fallback
 */
export function getEnvVar(name: string, defaultValue?: string): string {
  const value = import.meta.env[name];
  if (!value && defaultValue !== undefined) {
    return defaultValue;
  }
  return value;
}

/**
 * Get a boolean environment variable
 */
export function getEnvBool(name: string, defaultValue = false): boolean {
  const value = import.meta.env[name];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1' || value === 'yes';
}

/**
 * Get a number environment variable
 */
export function getEnvNumber(name: string, defaultValue?: number): number | undefined {
  const value = import.meta.env[name];
  if (!value) return defaultValue;
  const num = parseInt(value, 10);
  return isNaN(num) ? defaultValue : num;
}

/**
 * hasValidGroqKey — single-source-of-truth the free-AI router uses to
 * decide whether to count `VITE_GROQ_API_KEY` as a usable BYOK fallback
 * (so users without their own key still get AI through the env-level
 * Groq key the app ships with in some deployments).
 *
 * Treats undefined, empty strings, and obvious placeholders (`xxx`,
 * strings containing "your_") as "not valid".
 */
export function hasValidGroqKey(): boolean {
  const value = import.meta.env.VITE_GROQ_API_KEY;
  if (!value) return false;
  if (value.length < 20) return false;
  if (
    value.includes("your_") ||
    value.includes("PLACEHOLDER") ||
    value === "xxx"
  ) {
    return false;
  }
  return true;
}



