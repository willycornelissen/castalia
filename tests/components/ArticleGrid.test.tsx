import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
});
