import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { compressAndUploadMedia } from '@/services/storage.service';

vi.mock('@/services/storage.service', () => ({
  compressAndUploadMedia: vi.fn(),
}));

describe('ImageUploader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uploads selected image via storage service and triggers onUploaded', async () => {
    vi.mocked(compressAndUploadMedia).mockImplementation(async (_file, _variant, onProgress) => {
      onProgress?.(75);
      return 'https://cdn.test/media/hero.webp';
    });

    const onUploaded = vi.fn();
    render(<ImageUploader onUploaded={onUploaded} variant="hero" />);

    const input = screen.getByLabelText(/selecionar imagem/i) as HTMLInputElement;
    const file = new File(['img'], 'capa.png', { type: 'image/png' });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(compressAndUploadMedia).toHaveBeenCalledWith(file, 'hero', expect.any(Function));
      expect(onUploaded).toHaveBeenCalledWith('https://cdn.test/media/hero.webp');
    });
  });

  it('displays error message when upload fails', async () => {
    vi.mocked(compressAndUploadMedia).mockRejectedValue(new Error('Formato inválido'));

    render(<ImageUploader onUploaded={vi.fn()} />);

    const input = screen.getByLabelText(/selecionar imagem/i) as HTMLInputElement;
    const file = new File(['bad'], 'bad.pdf', { type: 'application/pdf' });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/formato inválido/i)).toBeInTheDocument();
    });
  });
});
