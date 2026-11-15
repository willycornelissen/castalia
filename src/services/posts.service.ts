import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  Timestamp,
  type QueryDocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';
import { slugify } from '@/utils/slugify';
import { normalizeTagList } from '@/utils/tags';
import { calculateReadingTime } from '@/utils/readingTime';
import type { CreatePostDTO, Post, UpdatePostDTO } from '@/types/post';

const POSTS_COLLECTION = 'posts';
const MAX_PUBLIC_QUERY_LIMIT = 20;

export interface PaginatedPostsResult {
  posts: Post[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

function toDate(value: unknown): Date {
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate() as Date;
  }
  if (value instanceof Date) {
    return value;
  }
  return new Date();
}

function mapDocToPost(docSnap: QueryDocumentSnapshot<DocumentData>): Post {
  const data = docSnap.data();
  return {
    slug: docSnap.id,
    title: data.title ?? '',
    content_markdown: data.content_markdown ?? '',
    excerpt: data.excerpt ?? '',
    feature_image: data.feature_image ?? '',
    status: data.status ?? 'draft',
    tags: Array.isArray(data.tags) ? data.tags : [],
    reading_time: typeof data.reading_time === 'number' ? data.reading_time : 1,
    published_at: data.published_at ? toDate(data.published_at) : null,
    created_at: toDate(data.created_at),
    updated_at: toDate(data.updated_at),
  };
}

function clampLimit(requested: number): number {
  return Math.min(Math.max(1, requested), MAX_PUBLIC_QUERY_LIMIT);
}

/**
 * Fetches published articles ordered by publication date descending.
 */
export async function getPublishedPosts(
  limitCount = 10,
  cursor?: QueryDocumentSnapshot<DocumentData> | null
): Promise<PaginatedPostsResult> {
  const safeLimit = clampLimit(limitCount);
  const postsRef = collection(db, POSTS_COLLECTION);
  const constraints = [
    where('status', '==', 'published'),
    orderBy('published_at', 'desc'),
    ...(cursor ? [startAfter(cursor)] : []),
    limit(safeLimit),
  ];

  const snapshot = await getDocs(query(postsRef, ...constraints));
  const posts = snapshot.docs.map(mapDocToPost);
  const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

  return {
    posts,
    lastDoc,
    hasMore: snapshot.docs.length === safeLimit,
  };
}

/**
 * Fetches published articles filtered by tag slug.
 */
export async function getPostsByTag(
  tag: string,
  limitCount = 10,
  cursor?: QueryDocumentSnapshot<DocumentData> | null
): Promise<PaginatedPostsResult> {
  const safeLimit = clampLimit(limitCount);
  const normalizedTag = slugify(tag);
  const postsRef = collection(db, POSTS_COLLECTION);
  const constraints = [
    where('status', '==', 'published'),
    where('tags', 'array-contains', normalizedTag),
    orderBy('published_at', 'desc'),
    ...(cursor ? [startAfter(cursor)] : []),
    limit(safeLimit),
  ];

  const snapshot = await getDocs(query(postsRef, ...constraints));
  const posts = snapshot.docs.map(mapDocToPost);
  const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;

  return {
    posts,
    lastDoc,
    hasMore: snapshot.docs.length === safeLimit,
  };
}

/**
 * Validates and normalizes a post slug parameter for Firestore document lookups.
 */
function requireValidSlug(slug: string): string {
  const clean = slugify(slug);
  if (!clean) {
    throw new Error('Slug inválido.');
  }
  return clean;
}

/**
 * Fetches a single post by its unique slug document ID.
 */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const cleanSlug = requireValidSlug(slug);
  const docRef = doc(db, POSTS_COLLECTION, cleanSlug);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) {
    return null;
  }
  return mapDocToPost(snapshot as QueryDocumentSnapshot<DocumentData>);
}

/**
 * Fetches posts (drafts and published) for the admin dashboard, ordered by last update.
 */
export async function getAllPostsAdmin(pageLimit = 50): Promise<Post[]> {
  const postsRef = collection(db, POSTS_COLLECTION);
  const q = query(postsRef, orderBy('updated_at', 'desc'), limit(pageLimit));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(mapDocToPost);
}

/**
 * Creates a new post atomically using the sanitized slug as the Firestore Document ID.
 */
export async function createPost(dto: CreatePostDTO): Promise<Post> {
  const cleanSlug = slugify(dto.slug || dto.title);
  if (!cleanSlug) {
    throw new Error('O título ou slug deve conter caracteres alfanuméricos válidos.');
  }

  const docRef = doc(db, POSTS_COLLECTION, cleanSlug);
  const existing = await getDoc(docRef);
  if (existing.exists()) {
    throw new Error('Já existe uma publicação com este slug.');
  }

  const now = Timestamp.now();
  const isPublished = dto.status === 'published';
  const normalizedTags = normalizeTagList(dto.tags ?? []);
  const readingTime = calculateReadingTime(dto.content_markdown);

  const payload = {
    title: dto.title.trim(),
    slug: cleanSlug,
    content_markdown: dto.content_markdown,
    excerpt: (dto.excerpt ?? '').trim(),
    feature_image: dto.feature_image ?? '',
    status: dto.status,
    tags: normalizedTags,
    reading_time: readingTime,
    published_at: isPublished ? now : null,
    created_at: now,
    updated_at: now,
  };

  await setDoc(docRef, payload);

  return {
    ...payload,
    published_at: isPublished ? toDate(now) : null,
    created_at: toDate(now),
    updated_at: toDate(now),
  };
}

/**
 * Updates an existing post. Migrates document ID when editing a draft's slug,
 * and enforces slug immutability once published.
 */
export async function updatePost(slug: string, dto: UpdatePostDTO): Promise<Post> {
  const currentSlug = requireValidSlug(slug);
  const docRef = doc(db, POSTS_COLLECTION, currentSlug);
  const existingSnap = await getDoc(docRef);

  if (!existingSnap.exists()) {
    throw new Error('Publicação não encontrada.');
  }

  const existing = mapDocToPost(existingSnap as QueryDocumentSnapshot<DocumentData>);
  const requestedSlug = dto.slug !== undefined ? slugify(dto.slug) : existing.slug;

  if (dto.slug !== undefined && !requestedSlug) {
    throw new Error('O slug deve conter caracteres alfanuméricos válidos.');
  }

  if (existing.status === 'published' && requestedSlug !== existing.slug) {
    throw new Error('O slug de uma publicação já publicada é imutável.');
  }

  const now = Timestamp.now();
  const nextStatus = dto.status ?? existing.status;
  const shouldSetPublishedAt = existing.status === 'draft' && nextStatus === 'published';

  // Draft slug migration: copy to new document ID and delete old document atomically
  if (existing.status === 'draft' && requestedSlug !== existing.slug) {
    const targetRef = doc(db, POSTS_COLLECTION, requestedSlug);
    const targetSnap = await getDoc(targetRef);
    if (targetSnap.exists()) {
      throw new Error('Já existe uma publicação com este slug.');
    }

    const nextMarkdown = dto.content_markdown ?? existing.content_markdown;
    const nextTags =
      dto.tags !== undefined
        ? normalizeTagList(dto.tags)
        : existing.tags;
    const publishedAt = shouldSetPublishedAt
      ? now
      : existing.published_at
        ? Timestamp.fromDate(existing.published_at)
        : null;

    const migratedPayload = {
      title: dto.title !== undefined ? dto.title.trim() : existing.title,
      slug: requestedSlug,
      content_markdown: nextMarkdown,
      excerpt: dto.excerpt !== undefined ? dto.excerpt.trim() : existing.excerpt,
      feature_image: dto.feature_image ?? existing.feature_image,
      status: nextStatus,
      tags: nextTags,
      reading_time: calculateReadingTime(nextMarkdown),
      published_at: publishedAt,
      created_at: Timestamp.fromDate(existing.created_at),
      updated_at: now,
    };

    const batch = writeBatch(db);
    batch.set(targetRef, migratedPayload);
    batch.delete(docRef);
    await batch.commit();

    return {
      ...migratedPayload,
      published_at: publishedAt ? toDate(publishedAt) : null,
      created_at: existing.created_at,
      updated_at: toDate(now),
    };
  }

  const updates: Record<string, unknown> = {
    updated_at: now,
  };

  if (dto.title !== undefined) updates.title = dto.title.trim();
  if (dto.content_markdown !== undefined) {
    updates.content_markdown = dto.content_markdown;
    updates.reading_time = calculateReadingTime(dto.content_markdown);
  }
  if (dto.excerpt !== undefined) updates.excerpt = dto.excerpt.trim();
  if (dto.feature_image !== undefined) updates.feature_image = dto.feature_image;
  if (dto.status !== undefined) updates.status = dto.status;
  if (dto.tags !== undefined) {
    updates.tags = normalizeTagList(dto.tags);
  }
  if (shouldSetPublishedAt) {
    updates.published_at = now;
  }

  await updateDoc(docRef, updates);

  const refreshed = await getDoc(docRef);
  return mapDocToPost(refreshed as QueryDocumentSnapshot<DocumentData>);
}

/**
 * Deletes a post document from Firestore.
 */
export async function deletePost(slug: string): Promise<void> {
  const cleanSlug = requireValidSlug(slug);
  const docRef = doc(db, POSTS_COLLECTION, cleanSlug);
  await deleteDoc(docRef);
}
