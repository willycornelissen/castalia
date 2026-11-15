import { describe, it, expect } from 'vitest';
import {
  parseTagsInput,
  normalizeTagList,
  toggleTagInInput,
  extractMenuTagOptions,
  extractTagFromNavPath,
} from '@/utils/tags';

describe('tags utilities', () => {
  it('parses, slugifies, and deduplicates arbitrarily many comma-separated tags', () => {
    const input =
      'Editorial, tecnologia, Crônicas, editorial, Ficção Científica, política, arte, cultura, ensaios';
    expect(parseTagsInput(input)).toEqual([
      'editorial',
      'tecnologia',
      'cronicas',
      'ficcao-cientifica',
      'politica',
      'arte',
      'cultura',
      'ensaios',
    ]);
  });

  it('normalizes and deduplicates an array of tags', () => {
    expect(normalizeTagList(['Crônicas', 'cronicas', '  ', 'Ensaios'])).toEqual([
      'cronicas',
      'ensaios',
    ]);
  });

  it('toggles a tag in and out of a comma-separated tags input without losing custom tags', () => {
    const added = toggleTagInInput('custom-tag', 'editorial');
    expect(parseTagsInput(added)).toEqual(['custom-tag', 'editorial']);

    const removed = toggleTagInInput(added, 'custom-tag');
    expect(parseTagsInput(removed)).toEqual(['editorial']);
  });

  it('extracts tag slug from /tag/... navigation paths and ignores non-tag routes', () => {
    expect(extractTagFromNavPath('/tag/editorial')).toBe('editorial');
    expect(extractTagFromNavPath('/tag/Crônicas')).toBe('cronicas');
    expect(extractTagFromNavPath('/')).toBeNull();
    expect(extractTagFromNavPath('/post/sobre')).toBeNull();
    expect(extractTagFromNavPath('https://example.com/tag/algo')).toBeNull();
  });

  it('extracts unique menu tag options preserving labels', () => {
    expect(
      extractMenuTagOptions([
        { label: 'Capa', path: '/' },
        { label: 'Editorial', path: '/tag/editorial' },
        { label: 'Crônicas & Contos', path: '/tag/cronicas-e-contos' },
        { label: 'Duplicado', path: '/tag/editorial' },
        { label: 'Sobre', path: '/post/sobre' },
      ])
    ).toEqual([
      { label: 'Editorial', tag: 'editorial' },
      { label: 'Crônicas & Contos', tag: 'cronicas-e-contos' },
    ]);
  });
});
