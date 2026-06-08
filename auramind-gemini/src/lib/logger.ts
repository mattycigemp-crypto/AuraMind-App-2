const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

export const logger = {
  debug: (...args: unknown[]): void => {
    if (isDev) {
      console.debug('[AuraMind]', ...args);
    }
  },
  log: (...args: unknown[]): void => {
    console.log('[AuraMind]', ...args);
  },
  info: (...args: unknown[]): void => {
    console.info('[AuraMind]', ...args);
  },
  warn: (...args: unknown[]): void => {
    console.warn('[AuraMind]', ...args);
  },
  error: (...args: unknown[]): void => {
    console.error('[AuraMind]', ...args);
  }
};

export default logger;


