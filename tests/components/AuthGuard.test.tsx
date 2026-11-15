import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthGuard } from '@/components/admin/AuthGuard';
import { useAuth } from '@/context/AuthContext';

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('AuthGuard', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('renders loading indicator while auth state is resolving', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: true,
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AuthGuard>
          <div>Admin Secret Area</div>
        </AuthGuard>
      </MemoryRouter>
    );

    expect(screen.getByText(/verificando sessão/i)).toBeInTheDocument();
    expect(screen.queryByText('Admin Secret Area')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated users to /admin/login', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: false,
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <AuthGuard>
                <div>Admin Secret Area</div>
              </AuthGuard>
            }
          />
          <Route path="/admin/login" element={<div>Login Screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Screen')).toBeInTheDocument();
    expect(screen.queryByText('Admin Secret Area')).not.toBeInTheDocument();
  });

  it('renders protected children when authenticated as configured admin', () => {
    vi.stubEnv('VITE_FIREBASE_ADMIN_UID', 'admin-1');
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: 'admin-1', email: 'admin@castalia.dev' } as never,
      loading: false,
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <AuthGuard>
          <div>Admin Secret Area</div>
        </AuthGuard>
      </MemoryRouter>
    );

    expect(screen.getByText('Admin Secret Area')).toBeInTheDocument();
  });

  it('redirects non-admin UID when VITE_FIREBASE_ADMIN_UID is configured', () => {
    vi.stubEnv('VITE_FIREBASE_ADMIN_UID', 'admin-only-uid');
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: 'other-user-uid', email: 'other@castalia.dev' } as never,
      loading: false,
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <AuthGuard>
                <div>Admin Secret Area</div>
              </AuthGuard>
            }
          />
          <Route path="/admin/login" element={<div>Login Screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Screen')).toBeInTheDocument();
    expect(screen.queryByText('Admin Secret Area')).not.toBeInTheDocument();
  });
});
