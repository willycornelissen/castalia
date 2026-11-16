import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  limit,
  Timestamp,
} from 'firebase/firestore';
import {
  getPublishedPosts,
  getPostBySlug,
  getPostsByTag,
  createPost,
  updatePost,
  deletePost,
  getAllPostsAdmin,
} from '@/services/posts.service';

vi.mock('@/services/firebase', () => ({
  db: { name: 'mock-db' },
}));

vi.mock('firebase/firestore', () => {
  class MockTimestamp {
    private date: Date;
    constructor(date: Date) {
      this.date = date;
    }
    toDate() {
      return this.date;
    }
    static fromDate(d: Date) {
      return new MockTimestamp(d);
    }
    static now() {
      return new MockTimestamp(new Date('2026-11-14T12:00:00Z'));
    }
  }
  return {
    collection: vi.fn(() => 'posts-collection-ref'),
    doc: vi.fn((_db, _col, id) => `doc-ref-${id}`),
    query: vi.fn((...args) => ({ queryArgs: args })),
    where: vi.fn((field, op, val) => ({ where: [field, op, val] })),
    orderBy: vi.fn((field, dir) => ({ orderBy: [field, dir] })),
    limit: vi.fn((n) => ({ limit: n })),
    startAfter: vi.fn((cursor) => ({ startAfter: cursor })),
    getDoc: vi.fn(),
    getDocs: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    writeBatch: vi.fn(),
    Timestamp: MockTimestamp,
  };
});

function makeDocSnap(slug: string, overrides: Record<string, unknown> = {}) {
  const now = Timestamp.fromDate(new Date('2026-11-14T12:00:00Z'));
  return {
    id: slug,
    exists: () => true,
    data: () => ({
      title: 'Título Teste',
      slug,
      content_markdown: 'Conteúdo do artigo em markdown.',
      excerpt: 'Resumo',
      feature_image: 'https://example.com/img.webp',
      status: 'published',
      tags: ['editorial'],
      reading_time: 1,
      published_at: now,
      created_at: now,
      updated_at: now,
      ...overrides,
    }),
  };
}

describe('posts.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches published posts with limit clamped to <= 20', async () => {
    const snap = makeDocSnap('artigo-1');
    vi.mocked(getDocs).mockResolvedValue({
      docs: [snap],
    } as never);

    const result = await getPublishedPosts(50);
    expect(limit).toHaveBeenCalledWith(20);
    expect(result.posts).toHaveLength(1);
    expect(result.posts[0].slug).toBe('artigo-1');
    expect(result.hasMore).toBe(false);
  });

  it('fetches published posts by tag', async () => {
    const snap = makeDocSnap('artigo-tag', { tags: ['tecnologia'] });
    vi.mocked(getDocs).mockResolvedValue({
      docs: [snap],
    } as never);

    const result = await getPostsByTag('tecnologia', 10);
    expect(limit).toHaveBeenCalledWith(10);
    expect(result.posts[0].tags).toContain('tecnologia');
  });

  it('returns null when post slug does not exist', async () => {
    vi.mocked(getDoc).mockResolvedValue({
      exists: () => false,
    } as never);

    const post = await getPostBySlug('inexistente');
    expect(post).toBeNull();
  });

  it('returns parsed post when slug exists', async () => {
    vi.mocked(getDoc).mockResolvedValue(makeDocSnap('artigo-existente') as never);

    const post = await getPostBySlug('artigo-existente');
    expect(post).not.toBeNull();
    expect(post?.slug).toBe('artigo-existente');
    expect(post?.created_at).toBeInstanceOf(Date);
  });

  it('creates a new post atomically after verifying slug availability', async () => {
    vi.mocked(getDoc).mockResolvedValue({ exists: () => false } as never);
    vi.mocked(setDoc).mockResolvedValue(undefined);

    const created = await createPost({
      title: 'Meu Novo Artigo!',
      slug: '',
      content_markdown: 'Texto de teste para o artigo.',
      status: 'draft',
      tags: ['Ensaios'],
    });

    expect(setDoc).toHaveBeenCalledTimes(1);
    expect(created.slug).toBe('meu-novo-artigo');
    expect(created.status).toBe('draft');
    expect(created.template).toBe('article');
    expect(created.published_at).toBeNull();
  });

  it('creates and reads posts with template resenha', async () => {
    vi.mocked(getDoc).mockResolvedValue({ exists: () => false } as never);
    vi.mocked(setDoc).mockResolvedValue(undefined);

    const created = await createPost({
      title: 'Resenha de O Jogo das Contas de Vidro',
      slug: '',
      content_markdown: '## Informações Bibliográficas',
      status: 'draft',
      template: 'resenha',
      tags: ['resenha'],
    });

    expect(setDoc).toHaveBeenCalledWith(
      'doc-ref-resenha-de-o-jogo-das-contas-de-vidro',
      expect.objectContaining({ template: 'resenha' })
    );
    expect(created.template).toBe('resenha');

    vi.mocked(getDoc).mockResolvedValue(
      makeDocSnap('resenha-salva', { template: 'resenha' }) as never
    );
    const loaded = await getPostBySlug('resenha-salva');
    expect(loaded?.template).toBe('resenha');
  });

  it('rejects post creation if slug already exists', async () => {
    vi.mocked(getDoc).mockResolvedValue({ exists: () => true } as never);

    await expect(
      createPost({
        title: 'Duplicado',
        slug: 'duplicado',
        content_markdown: 'Texto',
        status: 'draft',
      })
    ).rejects.toThrow('Já existe uma publicação com este slug.');
  });

  it('rejects slug mutation when updating an already published post', async () => {
    vi.mocked(getDoc).mockResolvedValue(
      makeDocSnap('slug-original', { status: 'published' }) as never
    );

    await expect(
      updatePost('slug-original', { slug: 'slug-alterado' })
    ).rejects.toThrow('O slug de uma publicação já publicada é imutável.');
  });

  it('updates a draft post and sets published_at when publishing', async () => {
    vi.mocked(getDoc)
      .mockResolvedValueOnce(
        makeDocSnap('rascunho', { status: 'draft', published_at: null }) as never
      )
      .mockResolvedValueOnce(
        makeDocSnap('rascunho', { status: 'published' }) as never
      );
    vi.mocked(updateDoc).mockResolvedValue(undefined);

    const updated = await updatePost('rascunho', {
      status: 'published',
      content_markdown: 'Novo texto publicado.',
    });

    expect(updateDoc).toHaveBeenCalledTimes(1);
    expect(updated.status).toBe('published');
  });

  it('migrates document ID via batch when editing the slug of an unpublished draft', async () => {
    const mockBatch = {
      set: vi.fn(),
      delete: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(writeBatch).mockReturnValue(mockBatch as never);
    vi.mocked(getDoc)
      .mockResolvedValueOnce(
        makeDocSnap('rascunho-antigo', { status: 'draft', published_at: null }) as never
      )
      .mockResolvedValueOnce({ exists: () => false } as never);

    const updated = await updatePost('rascunho-antigo', {
      slug: 'Rascunho Novo',
      title: 'Título Atualizado',
    });

    expect(mockBatch.set).toHaveBeenCalledWith(
      'doc-ref-rascunho-novo',
      expect.objectContaining({
        slug: 'rascunho-novo',
        title: 'Título Atualizado',
      })
    );
    expect(mockBatch.delete).toHaveBeenCalledWith('doc-ref-rascunho-antigo');
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
    expect(updated.slug).toBe('rascunho-novo');
  });

  it('deletes a post by slug', async () => {
    vi.mocked(deleteDoc).mockResolvedValue(undefined);
    await deletePost('para-deletar');
    expect(deleteDoc).toHaveBeenCalledWith('doc-ref-para-deletar');
  });

  it('fetches all posts for admin dashboard', async () => {
    vi.mocked(getDocs).mockResolvedValue({
      docs: [makeDocSnap('a'), makeDocSnap('b', { status: 'draft' })],
    } as never);

    const all = await getAllPostsAdmin();
    expect(all).toHaveLength(2);
  });
});
