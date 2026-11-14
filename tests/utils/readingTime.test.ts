import { describe, it, expect } from 'vitest';
import { calculateReadingTime } from '@/utils/readingTime';

describe('calculateReadingTime', () => {
  it('returns 1 minute minimum for empty or very short text', () => {
    expect(calculateReadingTime('')).toBe(1);
    expect(calculateReadingTime('   ')).toBe(1);
    expect(calculateReadingTime('Uma frase curta.')).toBe(1);
  });

  it('calculates reading time at ~200 words per minute', () => {
    const words400 = Array.from({ length: 400 }, () => 'palavra').join(' ');
    expect(calculateReadingTime(words400)).toBe(2);

    const words450 = Array.from({ length: 450 }, () => 'palavra').join(' ');
    expect(calculateReadingTime(words450)).toBe(3);
  });

  it('ignores markdown formatting characters when counting words', () => {
    const markdown = '# Heading\n\n**Bold text** with [a link](https://example.com) and `code`';
    expect(calculateReadingTime(markdown)).toBe(1);
  });
});
