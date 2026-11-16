import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PostEditor } from '@/components/admin/PostEditor';
import { NavigationProvider } from '@/context/NavigationContext';
import * as navigationService from '@/services/navigation.service';
import type { Post } from '@/types/post';

vi.mock('@/services/storage.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/storage.service')>();
  return {
    ...actual,
    compressAndUploadMedia: vi.fn().mockResolvedValue('https://cdn.test/inline.webp'),
  };
});

vi.mock('@/components/admin/ImageUploader', () => ({
  ImageUploader: ({ onUploaded }: { onUploaded: (url: string) => void }) => (
    <button type="button" onClick={() => onUploaded('https://cdn.test/uploaded.webp')}>
      Mock Upload
    </button>
  ),
}));

describe('PostEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('auto-generates slug from title for new drafts and updates live preview', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <PostEditor onSave={onSave} isSaving={false} />
      </MemoryRouter>
    );

    const titleInput = screen.getByPlaceholderText(/título do artigo/i);
    fireEvent.change(titleInput, { target: { value: 'Nova Crônica Editorial' } });

    const markdownTextarea = screen.getByPlaceholderText(/comece a escrever/i);
    fireEvent.change(markdownTextarea, {
      target: { value: '## Seção Um\n\nParágrafo de exemplo.' },
    });

    // Live preview renders Markdown heading
    expect(screen.getByRole('heading', { name: 'Seção Um' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /salvar rascunho/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Nova Crônica Editorial',
          slug: 'nova-cronica-editorial',
          status: 'draft',
          content_markdown: '## Seção Um\n\nParágrafo de exemplo.',
        })
      );
    });
  });

  it('locks slug input when editing an already published post', () => {
    const publishedPost: Post = {
      slug: 'artigo-publicado',
      title: 'Artigo Publicado',
      content_markdown: 'Texto',
      excerpt: 'Resumo',
      feature_image: '',
      status: 'published',
      tags: ['tech'],
      reading_time: 1,
      published_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    render(
      <MemoryRouter>
        <PostEditor initialPost={publishedPost} onSave={vi.fn()} isSaving={false} />
      </MemoryRouter>
    );

    // Open settings drawer
    fireEvent.click(screen.getByRole('button', { name: /configurações/i }));

    const slugInput = screen.getByLabelText(/url slug/i) as HTMLInputElement;
    expect(slugInput).toBeDisabled();
    expect(screen.getByText(/slug imutável/i)).toBeInTheDocument();
  });

  it('allows selecting multiple menu tags and adding arbitrary custom tags', async () => {
    vi.spyOn(navigationService, 'getNavigationMenu').mockResolvedValueOnce([
      { label: 'Capa', path: '/' },
      { label: 'Editorial', path: '/tag/editorial' },
      { label: 'Tecnologia', path: '/tag/tecnologia' },
      { label: 'Crônicas', path: '/tag/cronicas' },
    ]);
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <NavigationProvider>
          <PostEditor onSave={onSave} isSaving={false} />
        </NavigationProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Editorial' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Crônicas' })).toBeInTheDocument();
    });

    // Toggle two menu tags directly in the editor bar
    fireEvent.click(screen.getByRole('button', { name: 'Editorial' }));
    fireEvent.click(screen.getByRole('button', { name: 'Crônicas' }));

    // Open settings sidebar and add multiple custom tags on top of menu tags
    fireEvent.click(screen.getByRole('button', { name: /configurações/i }));
    const tagsInput = screen.getByLabelText(/tags/i) as HTMLInputElement;
    fireEvent.change(tagsInput, {
      target: { value: `${tagsInput.value}, ia, arquitetura, ficcao, memoria` },
    });

    fireEvent.click(screen.getByRole('button', { name: /^publicar$/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'published',
          tags: ['editorial', 'cronicas', 'ia', 'arquitetura', 'ficcao', 'memoria'],
        })
      );
    });
  });

  it('inserts markdown image and renders preview when selecting a photo from computer', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <PostEditor onSave={onSave} isSaving={false} />
      </MemoryRouter>
    );

    const fileInput = screen.getByLabelText(/inserir imagem do computador/i);
    const file = new File(['raw-photo'], 'paisagem.jpg', { type: 'image/jpeg' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      const textarea = screen.getByPlaceholderText(/comece a escrever/i) as HTMLTextAreaElement;
      expect(textarea.value).toContain('![paisagem.jpg](https://cdn.test/inline.webp)');
      expect(screen.getByRole('img', { name: 'paisagem.jpg' })).toHaveAttribute(
        'src',
        'https://cdn.test/inline.webp'
      );
    });
  });

  it('pre-populates resenha sections, default tag, and renders cover photo before title in preview', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    const { container } = render(
      <MemoryRouter>
        <PostEditor defaultTemplate="resenha" onSave={onSave} isSaving={false} />
      </MemoryRouter>
    );

    // Pre-filled sections in Markdown and live preview
    const textarea = screen.getByPlaceholderText(/comece a escrever/i) as HTMLTextAreaElement;
    expect(textarea.value).toContain('## Informações Bibliográficas');
    expect(textarea.value).toContain('## Leitura Analítica');
    expect(textarea.value).toContain('## Excertos');
    expect(
      screen.getByRole('heading', { name: 'Informações Bibliográficas' })
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Leitura Analítica' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Excertos' })).toBeInTheDocument();

    // Default tag "resenha" pre-selected
    expect(screen.getByRole('button', { name: /#resenha ×/i })).toBeInTheDocument();

    // Upload cover photo from the top resenha block
    fireEvent.click(screen.getByRole('button', { name: /mock upload/i }));

    // Fill title
    fireEvent.change(screen.getByPlaceholderText(/título da resenha/i), {
      target: { value: 'O Lobo da Estepe' },
    });

    // In preview, the cover image must appear BEFORE the review title heading
    const previewHeading = screen.getByRole('heading', { name: 'O Lobo da Estepe' });
    const previewImg = screen.getByRole('img', { name: 'O Lobo da Estepe' });
    expect(
      previewImg.compareDocumentPosition(previewHeading) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /salvar rascunho/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'O Lobo da Estepe',
          template: 'resenha',
          feature_image: 'https://cdn.test/uploaded.webp',
          tags: ['resenha'],
        })
      );
    });
    expect(container).toBeTruthy();
  });
});
