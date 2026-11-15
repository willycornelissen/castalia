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

    const expectedLinks = [
      { label: 'Nova Acrópole', href: '/tag/nova-acropole' },
      { label: 'Grupo Fermata', href: '/tag/grupo-fermata' },
      { label: 'Clube Dom Quixote', href: '/tag/clube-dom-quixote' },
      { label: 'Clube Athena', href: '/tag/clube-athena' },
      { label: 'Dáblio Labs', href: '/tag/dablio-labs' },
    ];

    for (const item of expectedLinks) {
      expect(screen.getByRole('link', { name: item.label })).toHaveAttribute(
        'href',
        item.href
      );
    }
  });
});
