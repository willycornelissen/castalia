import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import * as authService from '@/services/auth.service';

vi.mock('@/services/auth.service', () => ({
  subscribeToAuthChanges: vi.fn(),
  signOutUser: vi.fn(),
}));

function Consumer() {
  const { user, loading, logout } = useAuth();
  if (loading) return <div>Loading Auth</div>;
  return (
    <div>
      <span>{user ? `User:${user.email}` : 'Anonymous'}</span>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws if useAuth is used outside AuthProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Consumer />)).toThrow(
      'useAuth must be used within an AuthProvider'
    );
    spy.mockRestore();
  });

  it('starts in loading state and resolves user on auth state change', () => {
    let authCallback: ((user: unknown) => void) | undefined;
    vi.mocked(authService.subscribeToAuthChanges).mockImplementation((cb) => {
      authCallback = cb as (user: unknown) => void;
      return vi.fn();
    });

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    expect(screen.getByText('Loading Auth')).toBeInTheDocument();

    act(() => {
      authCallback?.({ uid: '123', email: 'willy@castalia.dev' });
    });

    expect(screen.getByText('User:willy@castalia.dev')).toBeInTheDocument();
  });

  it('calls signOutUser on logout', async () => {
    vi.mocked(authService.subscribeToAuthChanges).mockImplementation((cb) => {
      cb({ uid: '123', email: 'willy@castalia.dev' } as never);
      return vi.fn();
    });
    vi.mocked(authService.signOutUser).mockResolvedValue(undefined);

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText('Logout').click();
    });

    expect(authService.signOutUser).toHaveBeenCalledTimes(1);
  });
});
