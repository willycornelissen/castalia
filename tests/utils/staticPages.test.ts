import { describe, it, expect } from 'vitest';
import {
  parseStaticHtmlPage,
  loadQuickArchiveStaticPages,
  quickArchiveStaticPages,
  sobreStaticPage,
} from '@/utils/staticPages';

describe('staticPages utilities', () => {
  it('loads all internal quickArchive HTML pages while excluding Nova Acrópole', () => {
    expect(quickArchiveStaticPages.map((page) => page.path)).toEqual([
      '/grupo-fermata',
      '/clube-dom-quixote',
      '/dablio-labs',
    ]);

    const grupoFermata = quickArchiveStaticPages.find((page) => page.slug === 'grupo-fermata');
    expect(grupoFermata?.title).toBe('Grupo Fermata');
    expect(grupoFermata?.bodyHtml).toContain('<h1>Grupo Fermata</h1>');
    expect(grupoFermata?.bodyHtml).toContain('src="/fermata-logo.png"');
    expect(grupoFermata?.bodyHtml).toContain('Propósito');

    const clubeDomQuixote = quickArchiveStaticPages.find((page) => page.slug === 'clube-dom-quixote');
    expect(clubeDomQuixote?.title).toBe('Clube Dom Quixote');
    expect(clubeDomQuixote?.bodyHtml).toContain('<h1>Clube Dom Quixote</h1>');
    expect(clubeDomQuixote?.bodyHtml).toContain('src="/quixote-logo.jpg"');
    expect(clubeDomQuixote?.bodyHtml).toContain('Miguel de Cervantes nos legou mais do que um personagem');

    const dablioLabs = quickArchiveStaticPages.find((page) => page.slug === 'dablio-labs');
    expect(dablioLabs?.title).toBe('Dáblio Labs');
    expect(dablioLabs?.bodyHtml).toContain('<h1>Dáblio Labs</h1>');
    expect(dablioLabs?.bodyHtml).toContain('src="/dablio-logo.webp"');
    expect(dablioLabs?.bodyHtml).toContain('Willy Garabini Cornelissen');
    expect(dablioLabs?.bodyHtml).toContain('Dablio Labs.');
    expect(dablioLabs?.bodyHtml).toContain('Spec Driven Development (SDD)');

    expect(
      quickArchiveStaticPages
        .filter(
          (page) =>
            page.slug !== 'grupo-fermata' &&
            page.slug !== 'clube-dom-quixote' &&
            page.slug !== 'dablio-labs'
        )
        .map((page) => ({
          title: page.title,
          bodyHtml: page.bodyHtml,
        }))
    ).toEqual([]);
  });

  it('loads the standalone Sobre Castália page with artwork and editorial copy', () => {
    expect(sobreStaticPage.path).toBe('/sobre');
    expect(sobreStaticPage.title).toBe('Sobre');
    expect(sobreStaticPage.bodyHtml).toContain('<h1>Castália</h1>');
    expect(sobreStaticPage.bodyHtml).toContain('src="/castalia-sobre.jpg"');
    expect(sobreStaticPage.bodyHtml).toContain('Fonte de Castália');
    expect(sobreStaticPage.bodyHtml).toContain('Hermann Hesse');
    expect(sobreStaticPage.bodyHtml).toContain('Bem-vindo(a) a Castália, a capital do imaginário.');
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
