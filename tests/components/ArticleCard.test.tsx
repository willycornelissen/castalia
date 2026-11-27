import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ArticleCard } from '@/components/reader/ArticleCard';
import type { Post } from '@/types/post';

const mockPost: Post = {
  slug: 'arquitetura-distribuida',
  title: 'Arquitetura Distribuída sem Servidores',
  content_markdown: 'Texto completo',
  excerpt: 'Um ensaio sobre sistemas estáticos conectados ao Firebase.',
  feature_image: 'https://cdn.test/hero.webp',
  status: 'published',
  tags: ['tecnologia', 'editorial'],
  reading_time: 4,
  published_at: new Date(2026, 10, 14),
  created_at: new Date(2026, 10, 14),
  updated_at: new Date(2026, 10, 14),
};

describe('ArticleCard', () => {
  it('renders big lead story variant with image, excerpt, body, and tags', () => {
    render(
      <MemoryRouter>
        <ArticleCard post={mockPost} variant="big" />
      </MemoryRouter>
    );

    expect(screen.getByText(mockPost.title)).toBeInTheDocument();
    expect(screen.getByText(mockPost.excerpt)).toBeInTheDocument();
    expect(screen.getByText(mockPost.content_markdown)).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', mockPost.feature_image);
    expect(screen.getByText(/4 min/i)).toBeInTheDocument();
  });

  it('renders horizontal variant with lazy-loaded thumbnail', () => {
    render(
      <MemoryRouter>
        <ArticleCard post={mockPost} variant="horizontal" />
      </MemoryRouter>
    );

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(screen.getByText(mockPost.title)).toBeInTheDocument();
    expect(screen.queryByText(mockPost.content_markdown)).not.toBeInTheDocument();
  });

  it('renders compact small variant without requiring feature image', () => {
    render(
      <MemoryRouter>
        <ArticleCard post={{ ...mockPost, feature_image: '' }} variant="small" />
      </MemoryRouter>
    );

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText(mockPost.title)).toBeInTheDocument();
    expect(screen.queryByText(mockPost.content_markdown)).not.toBeInTheDocument();
  });

  it('renders all tags when a post belongs to many tags/sections', () => {
    const multiTagPost: Post = {
      ...mockPost,
      tags: ['editorial', 'tecnologia', 'cronicas', 'ensaios'],
    };

    render(
      <MemoryRouter>
        <ArticleCard post={multiTagPost} variant="horizontal" />
      </MemoryRouter>
    );

    for (const tag of multiTagPost.tags) {
      expect(screen.getByRole('link', { name: tag })).toHaveAttribute('href', `/tag/${tag}`);
    }
  });
});
