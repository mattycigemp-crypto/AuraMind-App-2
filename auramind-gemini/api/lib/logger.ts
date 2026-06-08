const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;
type LogLevel = keyof typeof LOG_LEVELS;

const currentLevel: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) ||
  (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatTimestamp(): string {
  return new Date().toISOString();
}

export const logger = {
  debug(msg: string, ctx?: Record<string, unknown>) {
    if (!shouldLog('debug')) return;
    const entry = { level: 'debug', time: formatTimestamp(), msg, ...ctx };
    console.log(JSON.stringify(entry));
  },

  info(msg: string, ctx?: Record<string, unknown>) {
    if (!shouldLog('info')) return;
    const entry = { level: 'info', time: formatTimestamp(), msg, ...ctx };
    console.log(JSON.stringify(entry));
  },

  warn(msg: string, ctx?: Record<string, unknown>) {
    if (!shouldLog('warn')) return;
    const entry = { level: 'warn', time: formatTimestamp(), msg, ...ctx };
    console.warn(JSON.stringify(entry));
  },

  error(msg: string, ctx?: Record<string, unknown>) {
    if (!shouldLog('error')) return;
    const entry = { level: 'error', time: formatTimestamp(), msg, ...ctx };
    console.error(JSON.stringify(entry));
  },
};

let _requestId = 0;

export function generateRequestId(): string {
  _requestId++;
  const ts = Date.now().toString(36);
  const seq = _requestId.toString(36);
  return `req_${ts}_${seq}`;
}
