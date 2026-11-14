import imageCompression from 'browser-image-compression';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from './firebase';
import { slugify } from '@/utils/slugify';

export type MediaVariant = 'hero' | 'card' | 'inline';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const VARIANT_CONFIG: Record<MediaVariant, { maxSizeMB: number; maxWidthOrHeight: number }> = {
  hero: { maxSizeMB: 0.4, maxWidthOrHeight: 1600 },
  inline: { maxSizeMB: 0.4, maxWidthOrHeight: 1600 },
  card: { maxSizeMB: 0.06, maxWidthOrHeight: 600 },
};

/**
 * Compresses an image file client-side to WebP and uploads it to Firebase Storage
 * under `/media/{timestamp}-{filename}.webp` with immutable caching headers.
 */
export async function compressAndUploadMedia(
  file: File,
  variant: MediaVariant = 'hero',
  onProgress?: (progressPercent: number) => void
): Promise<string> {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error('Formato inválido. Envie apenas imagens JPEG, PNG ou WebP.');
  }

  const { maxSizeMB, maxWidthOrHeight } = VARIANT_CONFIG[variant];

  const compressedFile = await imageCompression(file, {
    maxSizeMB,
    maxWidthOrHeight,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.82,
  });

  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const safeName = slugify(baseName) || 'image';
  const storagePath = `media/${Date.now()}-${safeName}.webp`;
  const storageRef = ref(storage, storagePath);

  const uploadTask = uploadBytesResumable(storageRef, compressedFile, {
    contentType: 'image/webp',
    cacheControl: 'public, max-age=31536000, immutable',
  });

  await new Promise<void>((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (onProgress && snapshot.totalBytes > 0) {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress(pct);
        }
      },
      (error) => reject(error),
      () => resolve()
    );
  });

  return getDownloadURL(uploadTask.snapshot.ref);
}

function isFirebaseStorageUrl(url: string): boolean {
  if (url.startsWith('gs://')) return true;
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === 'firebasestorage.googleapis.com' ||
      parsed.hostname.endsWith('.firebasestorage.app')
    );
  } catch {
    return false;
  }
}

/**
 * Extracts unique image URLs referenced inside Markdown image tags `![alt](url)`.
 */
export function extractMediaUrlsFromMarkdown(markdown: string): string[] {
  if (!markdown) return [];
  const matches = new Set<string>();
  const regex = /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(markdown)) !== null) {
    if (match[1]) matches.add(match[1]);
  }
  return Array.from(matches);
}

/**
 * Deletes an uploaded Firebase Storage asset by its download URL, ignoring
 * external URLs and already-deleted objects.
 */
export async function deleteMediaByUrl(url: string): Promise<void> {
  if (!url || !isFirebaseStorageUrl(url)) return;
  try {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      ['storage/object-not-found', 'storage/invalid-argument'].includes(
        (error as { code: string }).code
      )
    ) {
      return;
    }
    throw error;
  }
}
