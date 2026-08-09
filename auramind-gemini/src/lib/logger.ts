const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

export const logger = {
  debug: (...args: unknown[]): void => {
if (isDev) {
      // eslint-disable-next-line no-console -- logging utility
      console.debug('[AuraMind]', ...args);
    }
  },
  log: (...args: unknown[]): void => {
    // eslint-disable-next-line no-console -- logging utility
    console.log('[AuraMind]', ...args);
  },
  info: (...args: unknown[]): void => {
    // eslint-disable-next-line no-console -- logging utility
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


