import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '@/App';

vi.mock('@/services/firebase', () => ({
  app: {},
  auth: {},
  db: {},
  storage: {},
}));

vi.mock('@/services/auth.service', () => ({
  signInWithEmailPassword: vi.fn(),
  signOutUser: vi.fn(),
  subscribeToAuthChanges: vi.fn(() => () => {}),
}));

vi.mock('@/context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    user: null,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock('@/services/posts.service', () => ({
  getPublishedPosts: vi.fn().mockResolvedValue({ posts: [], lastDoc: null, hasMore: false }),
  getPostsByTag: vi.fn().mockResolvedValue({ posts: [], lastDoc: null, hasMore: false }),
  getPostBySlug: vi.fn().mockResolvedValue(null),
  getAllPostsAdmin: vi.fn().mockResolvedValue([]),
  createPost: vi.fn(),
  updatePost: vi.fn(),
  deletePost: vi.fn(),
}));

vi.mock('@/services/storage.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/storage.service')>();
  return {
    ...actual,
    compressAndUploadMedia: vi.fn(),
    deleteMediaByUrl: vi.fn(),
    extractMediaUrlsFromMarkdown: vi.fn().mockReturnValue([]),
  };
});

vi.mock('@/services/navigation.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/navigation.service')>();
  return {
    ...actual,
    getNavigationMenu: vi.fn().mockResolvedValue([
      { label: 'Capa', path: '/' },
      { label: 'Editorial', path: '/tag/editorial' },
    ]),
    saveNavigationMenu: vi.fn(),
  };
});

describe('App routing shell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders HomePage on root path /', async () => {
    window.history.pushState({}, '', '/');
    render(<App />);

    await waitFor(() => {
      expect(
        screen.getByText(/nenhuma publicação encontrada nesta edição\./i)
      ).toBeInTheDocument();
    });
  });

  it.each([
    { path: '/sobre', title: 'Castália' },
    { path: '/grupo-fermata', title: 'Grupo Fermata' },
    { path: '/clube-dom-quixote', title: 'Clube Dom Quixote' },
    { path: '/dablio-labs', title: 'Dáblio Labs' },
  ])('renders static HTML page for $path in the center column', async ({ path, title }) => {
    window.history.pushState({}, '', path);
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument();
    });
    expect(screen.queryByRole('heading', { name: '404' })).not.toBeInTheDocument();
  });

  it('renders NotFoundPage on unknown paths', async () => {
    window.history.pushState({}, '', '/rota-inexistente');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/404/i)).toBeInTheDocument();
    });
  });

  it('lazy-loads AdminLoginPage on /admin/login', async () => {
    window.history.pushState({}, '', '/admin/login');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
    });
  });

  it('redirects unauthenticated users on /admin to /admin/login', async () => {
    window.history.pushState({}, '', '/admin');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
    });
  });

  it('redirects unauthenticated users on /admin/menu to /admin/login', async () => {
    window.history.pushState({}, '', '/admin/menu');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
    });
  });
});
