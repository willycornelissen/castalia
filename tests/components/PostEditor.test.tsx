import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PostEditor } from '@/components/admin/PostEditor';
import type { Post } from '@/types/post';

vi.mock('@/services/storage.service', () => ({
  compressAndUploadMedia: vi.fn().mockResolvedValue('https://cdn.test/inline.webp'),
}));

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
});
