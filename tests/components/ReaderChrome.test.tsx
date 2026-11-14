import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Masthead } from '@/components/reader/Masthead';
import { AnnouncementBar } from '@/components/reader/AnnouncementBar';
import { Footer } from '@/components/reader/Footer';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { PostContent } from '@/components/reader/PostContent';
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

    expect(screen.getByRole('heading', { name: /castalia chronicle/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Capa' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tecnologia' })).toBeInTheDocument();
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

    expect(screen.getByText(/willy garabini cornelissen/i)).toBeInTheDocument();
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
