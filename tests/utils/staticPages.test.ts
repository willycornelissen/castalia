import { describe, it, expect } from 'vitest';
import {
  parseStaticHtmlPage,
  loadQuickArchiveStaticPages,
  quickArchiveStaticPages,
} from '@/utils/staticPages';

describe('staticPages utilities', () => {
  it('loads all internal quickArchive HTML pages while excluding Nova Acrópole', () => {
    expect(quickArchiveStaticPages.map((page) => page.path)).toEqual([
      '/grupo-fermata',
      '/clube-dom-quixote',
      '/clube-athena',
      '/dablio-labs',
    ]);

    const grupoFermata = quickArchiveStaticPages.find((page) => page.slug === 'grupo-fermata');
    expect(grupoFermata?.title).toBe('Grupo Fermata');
    expect(grupoFermata?.bodyHtml).toContain('<h1>Grupo Fermata</h1>');
    expect(grupoFermata?.bodyHtml).toContain('src="/fermata-logo.png"');
    expect(grupoFermata?.bodyHtml).toContain('Propósito');

    expect(
      quickArchiveStaticPages
        .filter((page) => page.slug !== 'grupo-fermata')
        .map((page) => ({
          title: page.title,
          bodyHtml: page.bodyHtml,
        }))
    ).toEqual([
      { title: 'Clube Dom Quixote', bodyHtml: '<h1>Clube Dom Quixote</h1>' },
      { title: 'Clube Athena', bodyHtml: '<h1>Clube Athena</h1>' },
      { title: 'Dáblio Labs', bodyHtml: '<h1>Dáblio Labs</h1>' },
    ]);
  });

  it('sanitizes dangerous tags, event handlers, and unsafe URLs from HTML pages', () => {
    const dirtyHtml = `<!doctype html>
      <html>
        <head><title>Página Teste</title></head>
        <body>
          <h1 onclick="alert(1)">Título Seguro</h1>
          <script>alert('xss')</script>
          <iframe src="https://evil.test"></iframe>
          <svg onload="alert(2)"></svg>
          <p>Texto com <a href="javascript:alert(3)">link ruim</a> e <a href="https://example.com" target="_blank">link externo</a>.</p>
          <img src="//evil.test/a.png" alt="protocol-relative" />
          <img src="/castalia.webp" alt="Logo" onerror="alert(4)" />
          <custom-widget>Conteúdo mantido</custom-widget>
        </body>
      </html>`;

    const parsed = parseStaticHtmlPage(dirtyHtml, 'Fallback');
    expect(parsed.title).toBe('Página Teste');
    expect(parsed.bodyHtml).not.toContain('<script');
    expect(parsed.bodyHtml).not.toContain('<iframe');
    expect(parsed.bodyHtml).not.toContain('<svg');
    expect(parsed.bodyHtml).not.toContain('onclick');
    expect(parsed.bodyHtml).not.toContain('onerror');
    expect(parsed.bodyHtml).not.toContain('javascript:');
    expect(parsed.bodyHtml).not.toContain('//evil.test');
    expect(parsed.bodyHtml).not.toContain('<custom-widget');
    expect(parsed.bodyHtml).toContain('<h1>Título Seguro</h1>');
    expect(parsed.bodyHtml).toContain('rel="noopener noreferrer"');
    expect(parsed.bodyHtml).toContain('<img src="/castalia.webp" alt="Logo">');
    expect(parsed.bodyHtml).toContain('Conteúdo mantido');
  });

  it('falls back safely when no matching HTML file exists in modules', () => {
    const pages = loadQuickArchiveStaticPages(
      [
        { label: 'Externo', path: 'https://example.com' },
        { label: 'Aninhado', path: '/a/b' },
        { label: 'Nova Seção & <Teste>', path: '/nova-secao' },
      ],
      {}
    );

    expect(pages).toEqual([
      {
        slug: 'nova-secao',
        path: '/nova-secao',
        label: 'Nova Seção & <Teste>',
        title: 'Nova Seção & <Teste>',
        bodyHtml: '<h1>Nova Seção &amp; &lt;Teste&gt;</h1>',
      },
    ]);
  });
});
