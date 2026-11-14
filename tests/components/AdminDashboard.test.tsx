import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AdminDashboardPage } from '@/pages/AdminDashboardPage';
import { AdminEditorPage } from '@/pages/AdminEditorPage';
import * as postsService from '@/services/posts.service';
import * as storageService from '@/services/storage.service';
import { useAuth } from '@/context/AuthContext';
import type { Post } from '@/types/post';

vi.mock('@/services/posts.service', () => ({
  getAllPostsAdmin: vi.fn(),
  getPostBySlug: vi.fn(),
  createPost: vi.fn(),
  updatePost: vi.fn(),
  deletePost: vi.fn(),
}));

vi.mock('@/services/storage.service', () => ({
  compressAndUploadMedia: vi.fn(),
  deleteMediaByUrl: vi.fn(),
  extractMediaUrlsFromMarkdown: vi.fn(() => []),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const samplePosts: Post[] = [
  {
    slug: 'post-publicado',
    title: 'Artigo Publicado',
    content_markdown: 'Texto 1',
    excerpt: 'Resumo 1',
    feature_image: 'https://cdn.test/p1.webp',
    status: 'published',
    tags: ['tech'],
    reading_time: 2,
    published_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    slug: 'post-rascunho',
    title: 'Meu Rascunho',
    content_markdown: 'Texto 2',
    excerpt: 'Resumo 2',
    feature_image: '',
    status: 'draft',
    tags: [],
    reading_time: 1,
    published_at: null,
    created_at: new Date(),
    updated_at: new Date(),
  },
];

describe('Admin Dashboard & Editor Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: 'admin-1', email: 'admin@castalia.dev' } as never,
      loading: false,
      logout: vi.fn().mockResolvedValue(undefined),
    });
  });

  it('AdminDashboardPage lists posts, filters by status, and deletes with confirmation', async () => {
    vi.mocked(postsService.getAllPostsAdmin).mockResolvedValue(samplePosts);
    vi.mocked(postsService.deletePost).mockResolvedValue(undefined);
    vi.mocked(storageService.deleteMediaByUrl).mockResolvedValue(undefined);

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Artigo Publicado')).toBeInTheDocument();
      expect(screen.getByText('Meu Rascunho')).toBeInTheDocument();
    });

    // Filter to Drafts
    fireEvent.click(screen.getByRole('button', { name: 'Rascunhos' }));
    expect(screen.queryByText('Artigo Publicado')).not.toBeInTheDocument();
    expect(screen.getByText('Meu Rascunho')).toBeInTheDocument();

    // Filter back to All and delete published post
    fireEvent.click(screen.getByRole('button', { name: 'Todos' }));
    const deleteButtons = screen.getAllByTitle('Excluir');
    fireEvent.click(deleteButtons[0]);

    expect(screen.getByText(/excluir artigo/i)).toBeInTheDocument();
    const excludeButtons = screen.getAllByRole('button', { name: /^excluir$/i });
    fireEvent.click(excludeButtons[excludeButtons.length - 1]);

    await waitFor(() => {
      expect(postsService.deletePost).toHaveBeenCalledWith('post-publicado');
      expect(storageService.deleteMediaByUrl).toHaveBeenCalledWith('https://cdn.test/p1.webp');
    });
  });

  it('AdminLayout handles logout button click', async () => {
    const logoutMock = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: 'admin-1', email: 'admin@castalia.dev' } as never,
      loading: false,
      logout: logoutMock,
    });
    vi.mocked(postsService.getAllPostsAdmin).mockResolvedValue([]);

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/login" element={<div>Login</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/nenhum artigo encontrado/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /sair/i }));
    await waitFor(() => {
      expect(logoutMock).toHaveBeenCalledTimes(1);
    });
  });

  it('AdminEditorPage creates new post and updates existing post', async () => {
    vi.mocked(postsService.createPost).mockResolvedValue({
      ...samplePosts[1],
      slug: 'novo-post',
      title: 'Novo Post',
    });

    render(
      <MemoryRouter initialEntries={['/admin/editor']}>
        <Routes>
          <Route path="/admin/editor" element={<AdminEditorPage />} />
          <Route path="/admin/editor/:slug" element={<AdminEditorPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/título do artigo/i), {
      target: { value: 'Novo Post' },
    });
    fireEvent.click(screen.getByRole('button', { name: /salvar rascunho/i }));

    await waitFor(() => {
      expect(postsService.createPost).toHaveBeenCalledTimes(1);
    });
  });

  it('AdminEditorPage loads existing post by slug and saves updates', async () => {
    vi.mocked(postsService.getPostBySlug).mockResolvedValue(samplePosts[1]);
    vi.mocked(postsService.updatePost).mockResolvedValue({
      ...samplePosts[1],
      status: 'published',
    });

    render(
      <MemoryRouter initialEntries={['/admin/editor/post-rascunho']}>
        <Routes>
          <Route path="/admin/editor/:slug" element={<AdminEditorPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Meu Rascunho')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /publicar/i }));

    await waitFor(() => {
      expect(postsService.updatePost).toHaveBeenCalledWith(
        'post-rascunho',
        expect.objectContaining({ status: 'published' })
      );
    });
  });
});
