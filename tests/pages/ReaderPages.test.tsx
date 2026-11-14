import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { HomePage } from '@/pages/HomePage';
import { PostPage } from '@/pages/PostPage';
import { TagPage } from '@/pages/TagPage';
import * as postsService from '@/services/posts.service';
import { useAuth } from '@/context/AuthContext';
import type { Post } from '@/types/post';

vi.mock('@/services/posts.service', () => ({
  getPublishedPosts: vi.fn(),
  getPostBySlug: vi.fn(),
  getPostsByTag: vi.fn(),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const publishedPost: Post = {
  slug: 'artigo-capa',
  title: 'Manchete Principal do Dia',
  content_markdown: 'Conteúdo detalhado do artigo.',
  excerpt: 'Resumo da manchete',
  feature_image: 'https://cdn.test/capa.webp',
  status: 'published',
  tags: ['editorial'],
  reading_time: 3,
  published_at: new Date(2026, 10, 14),
  created_at: new Date(2026, 10, 14),
  updated_at: new Date(2026, 10, 14),
};

describe('Reader Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: false,
      logout: vi.fn(),
    });
  });

  it('HomePage loads published posts and supports Load More pagination', async () => {
    vi.mocked(postsService.getPublishedPosts)
      .mockResolvedValueOnce({
        posts: [publishedPost],
        lastDoc: { id: 'cursor-1' } as never,
        hasMore: true,
      })
      .mockResolvedValueOnce({
        posts: [{ ...publishedPost, slug: 'artigo-2', title: 'Segundo Artigo' }],
        lastDoc: null,
        hasMore: false,
      });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Manchete Principal do Dia').length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole('button', { name: /carregar mais/i }));

    await waitFor(() => {
      expect(screen.getAllByText('Segundo Artigo').length).toBeGreaterThan(0);
    });
  });

  it('HomePage displays error message when query fails', async () => {
    vi.mocked(postsService.getPublishedPosts).mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/não foi possível carregar/i)).toBeInTheDocument();
    });
  });

  it('PostPage renders published article and hides drafts from anonymous readers', async () => {
    vi.mocked(postsService.getPostBySlug).mockResolvedValue(publishedPost);

    render(
      <MemoryRouter initialEntries={['/post/artigo-capa']}>
        <Routes>
          <Route path="/post/:slug" element={<PostPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Manchete Principal do Dia' })).toBeInTheDocument();
      expect(screen.getByText('Conteúdo detalhado do artigo.')).toBeInTheDocument();
    });

    // Draft hidden from anonymous user
    vi.mocked(postsService.getPostBySlug).mockResolvedValue({
      ...publishedPost,
      status: 'draft',
    });

    render(
      <MemoryRouter initialEntries={['/post/rascunho']}>
        <Routes>
          <Route path="/post/:slug" element={<PostPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument();
    });
  });

  it('PostPage shows draft preview banner to authenticated admin', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: 'admin-1', email: 'admin@castalia.dev' } as never,
      loading: false,
      logout: vi.fn(),
    });
    vi.mocked(postsService.getPostBySlug).mockResolvedValue({
      ...publishedPost,
      status: 'draft',
      title: 'Rascunho Privado',
    });

    render(
      <MemoryRouter initialEntries={['/post/rascunho?preview=true']}>
        <Routes>
          <Route path="/post/:slug" element={<PostPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/modo de pré-visualização/i)).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Rascunho Privado' })).toBeInTheDocument();
    });
  });

  it('TagPage renders articles matching the requested tag', async () => {
    vi.mocked(postsService.getPostsByTag).mockResolvedValue({
      posts: [publishedPost],
      lastDoc: null,
      hasMore: false,
    });

    render(
      <MemoryRouter initialEntries={['/tag/editorial']}>
        <Routes>
          <Route path="/tag/:tag" element={<TagPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'editorial' })).toBeInTheDocument();
      expect(screen.getByText('Manchete Principal do Dia')).toBeInTheDocument();
    });
  });
});
