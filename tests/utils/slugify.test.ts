import { describe, it, expect } from 'vitest';
import { slugify } from '@/utils/slugify';

describe('slugify', () => {
  it('converts uppercase text to lowercase', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('removes Portuguese diacritics and accents', () => {
    expect(slugify('Crônica de Engenharia e Programação')).toBe(
      'cronica-de-engenharia-e-programacao'
    );
  });

  it('strips special characters and punctuation', () => {
    expect(slugify('React + Vite: O Guia Definitivo! (2026)')).toBe(
      'react-vite-o-guia-definitivo-2026'
    );
  });

  it('collapses multiple consecutive spaces or hyphens', () => {
    expect(slugify('foo   ---   bar')).toBe('foo-bar');
  });

  it('trims leading and trailing hyphens', () => {
    expect(slugify('  --hello world--  ')).toBe('hello-world');
  });

  it('returns empty string for blank or symbol-only input', () => {
    expect(slugify('')).toBe('');
    expect(slugify('   ')).toBe('');
    expect(slugify('!@#$%')).toBe('');
  });
});
