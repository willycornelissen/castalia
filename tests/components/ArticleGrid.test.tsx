import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ArticleGrid } from '@/components/reader/ArticleGrid';
import type { Post } from '@/types/post';

const makePost = (i: number): Post => ({
  slug: `post-${i}`,
  title: `Matéria Número ${i}`,
  content_markdown: 'Conteúdo',
  excerpt: `Resumo da matéria ${i}`,
  feature_image: i === 1 ? 'https://cdn.test/1.webp' : '',
  status: 'published',
  tags: ['editorial'],
  reading_time: 2,
  published_at: new Date(2026, 10, 14),
  created_at: new Date(2026, 10, 14),
  updated_at: new Date(2026, 10, 14),
});

describe('ArticleGrid', () => {
  it('renders empty state when no posts exist', () => {
    render(
      <MemoryRouter>
        <ArticleGrid posts={[]} hasMore={false} loadingMore={false} onLoadMore={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText(/nenhuma publicação encontrada/i)).toBeInTheDocument();
  });

  it('renders newspaper columns and triggers onLoadMore when clicked', () => {
    const onLoadMore = vi.fn();
    const posts = Array.from({ length: 6 }, (_, idx) => makePost(idx + 1));

    render(
      <MemoryRouter>
        <ArticleGrid posts={posts} hasMore={true} loadingMore={false} onLoadMore={onLoadMore} />
      </MemoryRouter>
    );

    expect(screen.getByText('Matéria Número 1')).toBeInTheDocument();
    expect(screen.getByText('Matéria Número 6')).toBeInTheDocument();

    const btn = screen.getByRole('button', { name: /carregar mais/i });
    fireEvent.click(btn);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('renders quick archive tag links in the Arquivo Rápido section', () => {
    render(
      <MemoryRouter>
        <ArticleGrid
          posts={[makePost(1)]}
          hasMore={false}
          loadingMore={false}
          onLoadMore={vi.fn()}
        />
      </MemoryRouter>
    );

    const novaAcropoleLink = screen.getByRole('link', { name: /nova acrópole/i });
    expect(novaAcropoleLink).toHaveAttribute('href', 'http://www.acropolis.org');
    expect(novaAcropoleLink).toHaveAttribute('target', '_blank');
    expect(novaAcropoleLink).toHaveAttribute('rel', 'noopener noreferrer');

    const expectedLinks = [
      { label: 'Grupo Fermata', href: '/grupo-fermata' },
      { label: 'Clube Dom Quixote', href: '/clube-dom-quixote' },
      { label: 'Clube Athena', href: '/clube-athena' },
      { label: 'Dáblio Labs', href: '/dablio-labs' },
    ];

    for (const item of expectedLinks) {
      const link = screen.getByRole('link', { name: item.label });
      expect(link).toHaveAttribute('href', item.href);
      expect(link).not.toHaveAttribute('target');
    }

    expect(screen.queryByText(/arquivo rápido/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/mais edições em breve/i)).not.toBeInTheDocument();
  });

  it('displays the three latest posts in the center column and distributes remaining posts to side columns', () => {
    const posts = Array.from({ length: 9 }, (_, idx) => makePost(idx + 1));

    render(
      <MemoryRouter>
        <ArticleGrid posts={posts} hasMore={false} loadingMore={false} onLoadMore={vi.fn()} />
      </MemoryRouter>
    );

    const centerColumn = screen.getByTestId('center-column');
    const leftColumn = screen.getByTestId('left-column');
    const rightColumn = screen.getByTestId('right-column');

    expect(within(centerColumn).getByText('Matéria Número 1')).toBeInTheDocument();
    expect(within(centerColumn).getByText('Matéria Número 2')).toBeInTheDocument();
    expect(within(centerColumn).getByText('Matéria Número 3')).toBeInTheDocument();
    expect(within(centerColumn).queryByText('Matéria Número 4')).not.toBeInTheDocument();

    expect(within(leftColumn).getByText('Matéria Número 4')).toBeInTheDocument();
    expect(within(leftColumn).getByText('Matéria Número 5')).toBeInTheDocument();
    expect(within(leftColumn).getByText('Matéria Número 6')).toBeInTheDocument();
    expect(within(leftColumn).queryByText('Matéria Número 2')).not.toBeInTheDocument();

    expect(within(rightColumn).getByText('Matéria Número 7')).toBeInTheDocument();
    expect(within(rightColumn).getByText('Matéria Número 8')).toBeInTheDocument();
    expect(within(rightColumn).getByText('Matéria Número 9')).toBeInTheDocument();
  });

  it('shows all three latest posts in the center column even when only three posts exist', () => {
    const posts = Array.from({ length: 3 }, (_, idx) => makePost(idx + 1));

    render(
      <MemoryRouter>
        <ArticleGrid posts={posts} hasMore={false} loadingMore={false} onLoadMore={vi.fn()} />
      </MemoryRouter>
    );

    const centerColumn = screen.getByTestId('center-column');
    const leftColumn = screen.getByTestId('left-column');

    expect(within(centerColumn).getByText('Matéria Número 1')).toBeInTheDocument();
    expect(within(centerColumn).getByText('Matéria Número 2')).toBeInTheDocument();
    expect(within(centerColumn).getByText('Matéria Número 3')).toBeInTheDocument();
    expect(within(leftColumn).getByText(/sem matérias secundárias/i)).toBeInTheDocument();
  });

  it('appends posts loaded beyond the initial 9 into the center column', () => {
    const posts = Array.from({ length: 11 }, (_, idx) => makePost(idx + 1));

    render(
      <MemoryRouter>
        <ArticleGrid posts={posts} hasMore={false} loadingMore={false} onLoadMore={vi.fn()} />
      </MemoryRouter>
    );

    const centerColumn = screen.getByTestId('center-column');

    expect(within(centerColumn).getByText('Matéria Número 1')).toBeInTheDocument();
    expect(within(centerColumn).getByText('Matéria Número 2')).toBeInTheDocument();
    expect(within(centerColumn).getByText('Matéria Número 3')).toBeInTheDocument();
    expect(within(centerColumn).getByText('Matéria Número 10')).toBeInTheDocument();
    expect(within(centerColumn).getByText('Matéria Número 11')).toBeInTheDocument();
  });
});
