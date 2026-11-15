import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AdminMenuPage } from '@/pages/AdminMenuPage';
import { NavigationProvider } from '@/context/NavigationContext';
import * as navigationService from '@/services/navigation.service';
import { useAuth } from '@/context/AuthContext';
import { siteConfig } from '@/config/site.config';

vi.mock('@/services/navigation.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/navigation.service')>();
  return {
    ...actual,
    getNavigationMenu: vi.fn(),
    saveNavigationMenu: vi.fn(),
  };
});

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('AdminMenuPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: 'admin-1', email: 'admin@castalia.dev' } as never,
      loading: false,
      logout: vi.fn().mockResolvedValue(undefined),
    });
  });

  it('renders sidebar link, loads menu items, and supports editing, reordering, adding, removing, and saving', async () => {
    vi.mocked(navigationService.getNavigationMenu).mockResolvedValue([
      { label: 'Capa', path: '/' },
      { label: 'Editorial', path: '/tag/editorial' },
    ]);
    vi.mocked(navigationService.saveNavigationMenu).mockImplementation(async (items) => items);

    render(
      <MemoryRouter initialEntries={['/admin/menu']}>
        <NavigationProvider>
          <AdminMenuPage />
        </NavigationProvider>
      </MemoryRouter>
    );

    // Sidebar link present
    expect(screen.getByRole('link', { name: /^menu$/i })).toHaveAttribute('href', '/admin/menu');

    await waitFor(() => {
      expect(screen.getByDisplayValue('Capa')).toBeInTheDocument();
      expect(screen.getByDisplayValue('/tag/editorial')).toBeInTheDocument();
    });

    // Move second item up
    const moveUpButtons = screen.getAllByRole('button', { name: /mover para cima/i });
    fireEvent.click(moveUpButtons[1]);

    // Add a new item
    fireEvent.click(screen.getByRole('button', { name: /adicionar opção/i }));
    const labelInputs = screen.getAllByLabelText(/rótulo/i);
    const pathInputs = screen.getAllByLabelText(/caminho ou url/i);
    expect(labelInputs).toHaveLength(3);

    fireEvent.change(labelInputs[2], { target: { value: 'Sobre' } });
    fireEvent.change(pathInputs[2], { target: { value: '/post/sobre' } });

    // Remove second item ("Capa", which moved to index 1)
    const removeButtons = screen.getAllByRole('button', { name: /remover opção/i });
    fireEvent.click(removeButtons[1]);

    // Save
    fireEvent.click(screen.getByRole('button', { name: /salvar menu/i }));

    await waitFor(() => {
      expect(navigationService.saveNavigationMenu).toHaveBeenCalledWith([
        { label: 'Editorial', path: '/tag/editorial' },
        { label: 'Sobre', path: '/post/sobre' },
      ]);
      expect(screen.getByText(/menu salvo com sucesso/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid fields and allows restoring default menu', async () => {
    vi.mocked(navigationService.getNavigationMenu).mockResolvedValue([
      { label: 'Único', path: '/tag/unico' },
    ]);

    render(
      <MemoryRouter initialEntries={['/admin/menu']}>
        <NavigationProvider>
          <AdminMenuPage />
        </NavigationProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Único')).toBeInTheDocument();
    });

    // Clear label and try to save
    fireEvent.change(screen.getByLabelText(/rótulo/i), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: /salvar menu/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
    expect(navigationService.saveNavigationMenu).not.toHaveBeenCalled();

    // Restore defaults
    fireEvent.click(screen.getByRole('button', { name: /restaurar padrão/i }));
    expect(screen.getByDisplayValue(siteConfig.navigation[0].label)).toBeInTheDocument();
  });
});
