import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDoc, setDoc, doc } from 'firebase/firestore';
import {
  getNavigationMenu,
  saveNavigationMenu,
  isExternalNavUrl,
} from '@/services/navigation.service';
import { siteConfig } from '@/config/site.config';

vi.mock('@/services/firebase', () => ({
  db: { name: 'mock-db' },
}));

vi.mock('firebase/firestore', () => {
  class MockTimestamp {
    static now() {
      return new MockTimestamp();
    }
  }
  return {
    doc: vi.fn((_db, col, id) => `${col}/${id}`),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    Timestamp: MockTimestamp,
  };
});

describe('navigation.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('detects external http/https URLs accurately', () => {
    expect(isExternalNavUrl('https://castalia.web.app')).toBe(true);
    expect(isExternalNavUrl('http://example.com')).toBe(true);
    expect(isExternalNavUrl('/tag/editorial')).toBe(false);
    expect(isExternalNavUrl('/')).toBe(false);
  });

  it('returns default siteConfig navigation when Firestore document does not exist', async () => {
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => false,
    } as never);

    const items = await getNavigationMenu();
    expect(doc).toHaveBeenCalledWith({ name: 'mock-db' }, 'settings', 'navigation');
    expect(items).toEqual(siteConfig.navigation);
  });

  it('returns sanitized items from Firestore when document exists', async () => {
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => true,
      data: () => ({
        items: [
          { label: '  Início ', path: '/' },
          { label: 'Crônicas', path: 'tag/cronicas' },
          { label: 'Malicioso', path: 'javascript:alert(1)' },
          { label: 'Externo', path: 'https://willy.dev.br' },
          { label: '', path: '/vazio' },
        ],
      }),
    } as never);

    const items = await getNavigationMenu();
    expect(items).toEqual([
      { label: 'Início', path: '/' },
      { label: 'Crônicas', path: '/tag/cronicas' },
      { label: 'Externo', path: 'https://willy.dev.br' },
    ]);
  });

  it('falls back to default navigation when Firestore read throws', async () => {
    vi.mocked(getDoc).mockRejectedValue(new Error('offline'));

    const items = await getNavigationMenu();
    expect(items).toEqual(siteConfig.navigation);
  });

  it('validates, normalizes, and saves navigation items to settings/navigation', async () => {
    vi.mocked(setDoc).mockResolvedValue(undefined);

    const saved = await saveNavigationMenu([
      { label: ' Capa ', path: ' / ' },
      { label: 'Crônicas & Contos', path: 'tag/Crônicas & Contos' },
      { label: 'Sobre', path: 'https://willy.dev.br/sobre' },
    ]);

    expect(saved).toEqual([
      { label: 'Capa', path: '/' },
      { label: 'Crônicas & Contos', path: '/tag/cronicas-contos' },
      { label: 'Sobre', path: 'https://willy.dev.br/sobre' },
    ]);
    expect(setDoc).toHaveBeenCalledWith(
      'settings/navigation',
      expect.objectContaining({
        items: saved,
      })
    );
  });

  it('rejects empty list, blank fields, or unsafe protocols on save', async () => {
    await expect(saveNavigationMenu([])).rejects.toThrow(/pelo menos uma opção/i);
    await expect(
      saveNavigationMenu([{ label: '   ', path: '/tag/tech' }])
    ).rejects.toThrow(/rótulo/i);
    await expect(
      saveNavigationMenu([{ label: 'Tech', path: '   ' }])
    ).rejects.toThrow(/caminho/i);
    await expect(
      saveNavigationMenu([{ label: 'XSS', path: 'javascript:alert(1)' }])
    ).rejects.toThrow(/inválido/i);
    expect(setDoc).not.toHaveBeenCalled();
  });
});
