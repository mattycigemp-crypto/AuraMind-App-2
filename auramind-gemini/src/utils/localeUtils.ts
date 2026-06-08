/**
 * Locale utilities for formatting dates, numbers, and currencies
 */

/**
 * Format date according to locale
 */
export const formatDate = (date: Date | string, locale: string = 'en', options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  }).format(dateObj);
};

/**
 * Format time according to locale
 */
export const formatTime = (date: Date | string, locale: string = 'en', options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    ...options
  }).format(dateObj);
};

/**
 * Format date and time according to locale
 */
export const formatDateTime = (date: Date | string, locale: string = 'en', options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  }).format(dateObj);
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: Date | string, locale: string = 'en'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (diffSecs < 60) return rtf.format(-diffSecs, 'second');
  if (diffMins < 60) return rtf.format(-diffMins, 'minute');
  if (diffHours < 24) return rtf.format(-diffHours, 'hour');
  if (diffDays < 7) return rtf.format(-diffDays, 'day');
  if (diffDays < 30) return rtf.format(-Math.floor(diffDays / 7), 'week');
  if (diffDays < 365) return rtf.format(-Math.floor(diffDays / 30), 'month');
  return rtf.format(-Math.floor(diffDays / 365), 'year');
};

/**
 * Format number according to locale
 */
export const formatNumber = (num: number, locale: string = 'en', options?: Intl.NumberFormatOptions): string => {
  return new Intl.NumberFormat(locale, options).format(num);
};

/**
 * Format currency according to locale
 */
export const formatCurrency = (amount: number, currency: string = 'USD', locale: string = 'en'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(amount);
};

/**
 * Format percentage according to locale
 */
export const formatPercent = (value: number, locale: string = 'en', options?: Intl.NumberFormatOptions): string => {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options
  }).format(value / 100);
};

/**
 * Format list according to locale (e.g., "A, B, and C")
 */
export const formatList = (items: string[], locale: string = 'en'): string => {
  return new Intl.ListFormat(locale).format(items);
};

/**
 * Get locale-specific plural form
 */
export const getPlural = (count: number, locale: string = 'en'): string => {
  const pr = new Intl.PluralRules(locale);
  return pr.select(count);
};

/**
 * Format file size according to locale
 */
export const formatFileSize = (bytes: number, locale: string = 'en'): string => {
  const units = ['bytes', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${formatNumber(size, locale, { maximumFractionDigits: 1 })} ${units[unitIndex]}`;
};



