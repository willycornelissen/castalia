import imageCompression from 'browser-image-compression';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db, storage } from './firebase';
import { slugify } from '@/utils/slugify';

export type MediaVariant = 'hero' | 'card' | 'inline';

export const FIRESTORE_MEDIA_PREFIX = 'castalia-media://';
const MEDIA_COLLECTION = 'media';
const STORAGE_UPLOAD_TIMEOUT_MS = 5000;
const FIRESTORE_SAFE_BINARY_LIMIT_BYTES = 650 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/bmp',
]);
const ALLOWED_EXTENSION_REGEX = /\.(jpe?g|png|webp|gif|avif|bmp)$/i;

const VARIANT_CONFIG: Record<MediaVariant, { maxSizeMB: number; maxWidthOrHeight: number }> = {
  hero: { maxSizeMB: 0.4, maxWidthOrHeight: 1600 },
  inline: { maxSizeMB: 0.4, maxWidthOrHeight: 1600 },
  card: { maxSizeMB: 0.06, maxWidthOrHeight: 600 },
};

const mediaUrlCache = new Map<string, string>();
const pendingMediaReads = new Map<string, Promise<string | null>>();
let storageUnavailable = false;

export function isFirestoreMediaUrl(url: string): boolean {
  return Boolean(url && url.startsWith(FIRESTORE_MEDIA_PREFIX));
}

export function getCachedMediaUrl(url: string): string | null {
  return mediaUrlCache.get(url) ?? null;
}

/**
 * Resolves a `castalia-media://<id>` reference to its stored data URL from Firestore,
 * using an in-memory cache to avoid redundant reads.
 */
export async function resolveMediaUrl(url: string): Promise<string | null> {
  if (!url) return null;
  if (!isFirestoreMediaUrl(url)) return url;

  const cached = mediaUrlCache.get(url);
  if (cached) return cached;

  const existingPromise = pendingMediaReads.get(url);
  if (existingPromise) return existingPromise;

  const mediaId = url.slice(FIRESTORE_MEDIA_PREFIX.length).trim();
  if (!mediaId || !db) return null;

  const fetchPromise = (async () => {
    try {
      const snap = await getDoc(doc(db, MEDIA_COLLECTION, mediaId));
      if (!snap.exists()) return null;
      const dataUrl = snap.data()?.data_url;
      if (typeof dataUrl === 'string' && dataUrl.startsWith('data:image/')) {
        mediaUrlCache.set(url, dataUrl);
        return dataUrl;
      }
      return null;
    } catch {
      return null;
    } finally {
      pendingMediaReads.delete(url);
    }
  })();

  pendingMediaReads.set(url, fetchPromise);
  return fetchPromise;
}

function isSupportedImageFile(file: File): boolean {
  if (file.type) {
    return ALLOWED_MIME_TYPES.has(file.type.toLowerCase());
  }
  return ALLOWED_EXTENSION_REGEX.test(file.name);
}

async function compressImageFile(
  file: File,
  maxSizeMB: number,
  maxWidthOrHeight: number
): Promise<File> {
  const options = {
    maxSizeMB,
    maxWidthOrHeight,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.82,
  };

  try {
    return await imageCompression(file, options);
  } catch {
    return imageCompression(file, { ...options, useWebWorker: false });
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Não foi possível ler a imagem selecionada.'));
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler o arquivo de imagem.'));
    reader.readAsDataURL(blob);
  });
}

async function saveMediaToFirestore(
  compressedFile: File,
  mediaId: string,
  onProgress?: (progressPercent: number) => void
): Promise<string> {
  if (!db) {
    throw new Error('Serviço de armazenamento indisponível.');
  }

  let payloadFile = compressedFile;
  if (payloadFile.size > FIRESTORE_SAFE_BINARY_LIMIT_BYTES) {
    payloadFile = await compressImageFile(payloadFile, 0.25, 1200);
  }

  onProgress?.(60);
  const dataUrl = await blobToDataUrl(payloadFile);
  if (dataUrl.length > 900000) {
    throw new Error('A imagem excedeu o tamanho máximo permitido mesmo após compressão.');
  }

  onProgress?.(85);
  await setDoc(doc(db, MEDIA_COLLECTION, mediaId), {
    data_url: dataUrl,
    content_type: payloadFile.type || 'image/webp',
    created_at: Timestamp.now(),
  });

  const mediaUri = `${FIRESTORE_MEDIA_PREFIX}${mediaId}`;
  mediaUrlCache.set(mediaUri, dataUrl);
  onProgress?.(100);
  return mediaUri;
}

async function uploadToFirebaseStorage(
  compressedFile: File,
  storagePath: string,
  onProgress?: (progressPercent: number) => void
): Promise<string> {
  if (storage && typeof storage === 'object' && 'maxUploadRetryTime' in storage) {
    (storage as { maxUploadRetryTime: number }).maxUploadRetryTime = STORAGE_UPLOAD_TIMEOUT_MS;
  }

  const storageRef = ref(storage, storagePath);
  const uploadTask = uploadBytesResumable(storageRef, compressedFile, {
    contentType: 'image/webp',
    cacheControl: 'public, max-age=31536000, immutable',
  });

  await new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      if ('cancel' in uploadTask && typeof uploadTask.cancel === 'function') {
        uploadTask.cancel();
      }
      reject(new Error('Tempo limite excedido ao enviar para o Firebase Storage.'));
    }, STORAGE_UPLOAD_TIMEOUT_MS + 1000);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (onProgress && snapshot.totalBytes > 0) {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress(pct);
        }
      },
      (error) => {
        clearTimeout(timeoutId);
        reject(error);
      },
      () => {
        clearTimeout(timeoutId);
        resolve();
      }
    );
  });

  return getDownloadURL(uploadTask.snapshot.ref);
}

/**
 * Compresses an image file client-side to WebP and uploads it to Firebase Storage,
 * falling back to Firestore media documents when Firebase Storage is unavailable.
 */
export async function compressAndUploadMedia(
  file: File,
  variant: MediaVariant = 'hero',
  onProgress?: (progressPercent: number) => void
): Promise<string> {
  if (!isSupportedImageFile(file)) {
    throw new Error('Formato inválido. Envie apenas imagens JPEG, PNG ou WebP.');
  }

  const { maxSizeMB, maxWidthOrHeight } = VARIANT_CONFIG[variant];
  onProgress?.(10);
  const compressedFile = await compressImageFile(file, maxSizeMB, maxWidthOrHeight);
  onProgress?.(35);

  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const safeName = slugify(baseName) || 'image';
  const mediaId = `${Date.now()}-${safeName}`;
  const storagePath = `media/${mediaId}.webp`;

  if (!storageUnavailable) {
    try {
      return await uploadToFirebaseStorage(compressedFile, storagePath, onProgress);
    } catch (err) {
      if (!db) {
        throw err;
      }
      storageUnavailable = true;
    }
  }

  return saveMediaToFirestore(compressedFile, mediaId, onProgress);
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
 * Deletes an uploaded Firebase Storage or Firestore media asset by its URL/URI,
 * ignoring external URLs and already-deleted objects.
 */
export async function deleteMediaByUrl(url: string): Promise<void> {
  if (!url) return;

  if (isFirestoreMediaUrl(url)) {
    const mediaId = url.slice(FIRESTORE_MEDIA_PREFIX.length).trim();
    mediaUrlCache.delete(url);
    if (!mediaId || !db) return;
    await deleteDoc(doc(db, MEDIA_COLLECTION, mediaId));
    return;
  }

  if (!isFirebaseStorageUrl(url)) return;
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
