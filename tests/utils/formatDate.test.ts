import { describe, it, expect } from 'vitest';
import { formatDate, formatMastheadDate } from '@/utils/formatDate';

describe('formatDate', () => {
  it('formats a Date object in Brazilian Portuguese editorial style', () => {
    const date = new Date(2026, 10, 14, 12, 0, 0); // Nov 14, 2026
    const result = formatDate(date);
    expect(result.toLowerCase()).toContain('2026');
    expect(result.toLowerCase()).toContain('novembro');
    expect(result).toContain('14');
  });

  it('returns fallback when date is null or undefined', () => {
    expect(formatDate(null)).toBe('Rascunho');
    expect(formatDate(undefined)).toBe('Rascunho');
  });

  it('formats masthead dateline with weekday', () => {
    const date = new Date(2026, 10, 14, 12, 0, 0); // Saturday, Nov 14, 2026
    const result = formatMastheadDate(date);
    expect(result.toLowerCase()).toContain('sábado');
    expect(result.toLowerCase()).toContain('novembro');
    expect(result).toContain('2026');
  });
});
