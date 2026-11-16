import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Masthead } from '@/components/reader/Masthead';
import { AnnouncementBar } from '@/components/reader/AnnouncementBar';
import { Footer } from '@/components/reader/Footer';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { PostContent } from '@/components/reader/PostContent';
import { NavigationProvider } from '@/context/NavigationContext';
import * as navigationService from '@/services/navigation.service';
import type { Post } from '@/types/post';

const samplePost: Post = {
  slug: 'noticia-urgente',
  title: 'Nova Edição do Jornal Digital',
  content_markdown: 'Corpo',
  excerpt: 'Resumo',
  feature_image: '',
  status: 'published',
  tags: ['editorial'],
  reading_time: 2,
  published_at: new Date(2026, 10, 14),
  created_at: new Date(2026, 10, 14),
  updated_at: new Date(2026, 10, 14),
};

describe('Reader Chrome & Pages', () => {
  it('renders Masthead with title and navigation links', () => {
    render(
      <MemoryRouter>
        <Masthead />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /diário de castália/i })).toBeInTheDocument();
    expect(screen.getByText(/notícias da capital do imaginário/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Capa' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tecnologia' })).toBeInTheDocument();
  });

  it('renders custom navigation items including external links from NavigationProvider', async () => {
    vi.spyOn(navigationService, 'getNavigationMenu').mockResolvedValueOnce([
      { label: 'Primeira Página', path: '/' },
      { label: 'Arquivo', path: 'https://arquivo.willy.dev.br' },
    ]);

    render(
      <MemoryRouter>
        <NavigationProvider>
          <Masthead />
        </NavigationProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Primeira Página' })).toHaveAttribute('href', '/');
      const externalLink = screen.getByRole('link', { name: 'Arquivo' });
      expect(externalLink).toHaveAttribute('href', 'https://arquivo.willy.dev.br');
      expect(externalLink).toHaveAttribute('target', '_blank');
    });
  });

  it('renders AnnouncementBar ticker with headlines and returns null when empty', () => {
    const { container, rerender } = render(
      <MemoryRouter>
        <AnnouncementBar posts={[]} />
      </MemoryRouter>
    );
    expect(container.firstChild).toBeNull();

    rerender(
      <MemoryRouter>
        <AnnouncementBar posts={[samplePost]} />
      </MemoryRouter>
    );
    expect(screen.getByText('Últimas')).toBeInTheDocument();
    expect(screen.getAllByText(samplePost.title).length).toBeGreaterThan(0);
  });

  it('renders Footer with author bio and admin link', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    expect(
      screen.getByText(
        /castália é uma província pedagógica e utópica imaginada por hermann hesse/i
      )
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /seções/i })).not.toBeInTheDocument();
    expect(screen.getByText(/magister ludi/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /a verdadeira maestria não é o domínio tirânico sobre o saber, mas a submissão impessoal à verdade e à ordem espiritual/i
      )
    ).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /github/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /twitter/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /linkedin/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /redação \/ admin/i })).toHaveAttribute(
      'href',
      '/admin'
    );
  });

  it('renders NotFoundPage with 404 heading and home link', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /voltar à primeira página/i })).toHaveAttribute(
      'href',
      '/'
    );
  });

  it('renders markdown images and external links cleanly in PostContent', () => {
    render(
      <PostContent markdown="Veja [este site](https://example.com) e ![Foto](https://cdn.test/a.webp)" />
    );

    const link = screen.getByRole('link', { name: 'este site' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('img', { name: 'Foto' })).toHaveAttribute(
      'src',
      'https://cdn.test/a.webp'
    );
  });
});
