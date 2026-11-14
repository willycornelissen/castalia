import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  signInWithEmailPassword,
  signOutUser,
  subscribeToAuthChanges,
} from '@/services/auth.service';

vi.mock('@/services/firebase', () => ({
  auth: { name: 'mock-auth' },
}));

vi.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

describe('auth.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('signs in with email and password and returns user', async () => {
    const mockUser = { uid: 'admin-123', email: 'admin@castalia.dev' };
    vi.mocked(signInWithEmailAndPassword).mockResolvedValue({
      user: mockUser,
    } as never);

    const user = await signInWithEmailPassword('admin@castalia.dev', 'secret123');
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
      { name: 'mock-auth' },
      'admin@castalia.dev',
      'secret123'
    );
    expect(user).toEqual(mockUser);
  });

  it('signs out the current user', async () => {
    vi.mocked(signOut).mockResolvedValue(undefined);
    await signOutUser();
    expect(signOut).toHaveBeenCalledWith({ name: 'mock-auth' });
  });

  it('subscribes to auth state changes and returns unsubscribe handle', () => {
    const mockUnsubscribe = vi.fn();
    vi.mocked(onAuthStateChanged).mockReturnValue(mockUnsubscribe);

    const callback = vi.fn();
    const unsub = subscribeToAuthChanges(callback);

    expect(onAuthStateChanged).toHaveBeenCalledWith({ name: 'mock-auth' }, callback);
    expect(unsub).toBe(mockUnsubscribe);
  });
});
