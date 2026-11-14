import { describe, it, expect, vi, beforeEach } from 'vitest';
import imageCompression from 'browser-image-compression';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import {
  compressAndUploadMedia,
  deleteMediaByUrl,
  extractMediaUrlsFromMarkdown,
} from '@/services/storage.service';

vi.mock('@/services/firebase', () => ({
  storage: { name: 'mock-storage' },
}));

vi.mock('browser-image-compression', () => ({
  default: vi.fn(),
}));

vi.mock('firebase/storage', () => ({
  ref: vi.fn((_storage, path) => ({ fullPath: path })),
  uploadBytesResumable: vi.fn(),
  getDownloadURL: vi.fn(),
  deleteObject: vi.fn(),
}));

describe('storage.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects non-image files', async () => {
    const file = new File(['hello'], 'doc.pdf', { type: 'application/pdf' });
    await expect(compressAndUploadMedia(file)).rejects.toThrow(
      'Formato inválido. Envie apenas imagens JPEG, PNG ou WebP.'
    );
  });

  it('compresses hero image to WebP <400 kB and uploads to /media/ with cacheControl', async () => {
    const file = new File(['raw-bytes'], 'Foto Capa.png', { type: 'image/png' });
    const compressedBlob = new File(['webp'], 'foto-capa.webp', {
      type: 'image/webp',
    });

    vi.mocked(imageCompression).mockResolvedValue(compressedBlob);

    const mockTask = {
      snapshot: { ref: 'uploaded-ref' },
      on: vi.fn((_event, onProgress, _onError, onComplete) => {
        onProgress({ bytesTransferred: 50, totalBytes: 100 });
        onComplete();
      }),
    };
    vi.mocked(uploadBytesResumable).mockReturnValue(mockTask as never);
    vi.mocked(getDownloadURL).mockResolvedValue(
      'https://storage.example.com/media/foto-capa.webp'
    );

    const progressCb = vi.fn();
    const url = await compressAndUploadMedia(file, 'hero', progressCb);

    expect(imageCompression).toHaveBeenCalledWith(file, {
      maxSizeMB: 0.4,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
      fileType: 'image/webp',
      initialQuality: 0.82,
    });

    expect(ref).toHaveBeenCalledWith(
      { name: 'mock-storage' },
      expect.stringMatching(/^media\/\d+-foto-capa\.webp$/)
    );
    expect(uploadBytesResumable).toHaveBeenCalledWith(
      expect.anything(),
      compressedBlob,
      {
        contentType: 'image/webp',
        cacheControl: 'public, max-age=31536000, immutable',
      }
    );
    expect(progressCb).toHaveBeenCalledWith(50);
    expect(url).toBe('https://storage.example.com/media/foto-capa.webp');
  });

  it('compresses card thumbnail to <60 kB', async () => {
    const file = new File(['raw'], 'thumb.jpg', { type: 'image/jpeg' });
    vi.mocked(imageCompression).mockResolvedValue(file);
    const mockTask = {
      snapshot: { ref: 'uploaded-ref' },
      on: vi.fn((_e, _p, _err, onComplete) => onComplete()),
    };
    vi.mocked(uploadBytesResumable).mockReturnValue(mockTask as never);
    vi.mocked(getDownloadURL).mockResolvedValue('https://cdn.test/thumb.webp');

    await compressAndUploadMedia(file, 'card');

    expect(imageCompression).toHaveBeenCalledWith(
      file,
      expect.objectContaining({
        maxSizeMB: 0.06,
        maxWidthOrHeight: 600,
      })
    );
  });

  it('deletes Firebase Storage media safely by URL and ignores external or missing files', async () => {
    vi.mocked(deleteObject).mockResolvedValue(undefined);
    await deleteMediaByUrl(
      'https://firebasestorage.googleapis.com/v0/b/my-bucket/o/media%2F123.webp'
    );
    expect(deleteObject).toHaveBeenCalledTimes(1);

    // External URLs must be ignored without invoking Firebase deleteObject
    await deleteMediaByUrl('https://images.unsplash.com/photo-123.jpg');
    expect(deleteObject).toHaveBeenCalledTimes(1);

    vi.mocked(deleteObject).mockRejectedValue({ code: 'storage/object-not-found' });
    await expect(
      deleteMediaByUrl(
        'https://firebasestorage.googleapis.com/v0/b/my-bucket/o/media%2Fmissing.webp'
      )
    ).resolves.toBeUndefined();
  });

  it('extracts unique image URLs from Markdown content', () => {
    const md = [
      '# Title',
      '![alt 1](https://firebasestorage.googleapis.com/v0/b/app/o/a.webp)',
      'Text ![alt 2](https://firebasestorage.googleapis.com/v0/b/app/o/b.webp "cap")',
      'Duplicate ![dup](https://firebasestorage.googleapis.com/v0/b/app/o/a.webp)',
    ].join('\n');

    expect(extractMediaUrlsFromMarkdown(md)).toEqual([
      'https://firebasestorage.googleapis.com/v0/b/app/o/a.webp',
      'https://firebasestorage.googleapis.com/v0/b/app/o/b.webp',
    ]);
  });
});
