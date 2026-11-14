import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AdminLoginPage } from '@/pages/AdminLoginPage';
import { signInWithEmailPassword } from '@/services/auth.service';
import { useAuth } from '@/context/AuthContext';

vi.mock('@/services/auth.service', () => ({
  signInWithEmailPassword: vi.fn(),
}));

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('AdminLoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: false,
      logout: vi.fn(),
    });
  });

  it('adds noindex meta tag and submits login credentials', async () => {
    vi.mocked(signInWithEmailPassword).mockResolvedValue({ uid: 'admin-1' } as never);

    render(
      <MemoryRouter initialEntries={['/admin/login']}>
        <Routes>
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<div>Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    const robotsMeta = document.querySelector('meta[name="robots"]');
    expect(robotsMeta?.getAttribute('content')).toContain('noindex');

    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: 'willy@castalia.dev' },
    });
    fireEvent.change(screen.getByLabelText(/senha/i), {
      target: { value: 'supersecret' },
    });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(signInWithEmailPassword).toHaveBeenCalledWith('willy@castalia.dev', 'supersecret');
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  it('displays error feedback on failed login', async () => {
    vi.mocked(signInWithEmailPassword).mockRejectedValue(new Error('Invalid credentials'));

    render(
      <MemoryRouter>
        <AdminLoginPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: 'wrong@castalia.dev' },
    });
    fireEvent.change(screen.getByLabelText(/senha/i), {
      target: { value: 'badpass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await waitFor(() => {
      expect(screen.getByText(/credenciais inválidas/i)).toBeInTheDocument();
    });
  });
});
