import { useEffect, useState } from 'react';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { getPublishedPosts } from '@/services/posts.service';
import type { Post } from '@/types/post';
import { Masthead } from '@/components/reader/Masthead';
import { AnnouncementBar } from '@/components/reader/AnnouncementBar';
import { ArticleGrid } from '@/components/reader/ArticleGrid';
import { Footer } from '@/components/reader/Footer';

const PAGE_SIZE = 10;

export function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadInitial() {
      try {
        const res = await getPublishedPosts(PAGE_SIZE);
        if (!active) return;
        setPosts(res.posts);
        setLastDoc(res.lastDoc);
        setHasMore(res.hasMore);
      } catch {
        if (!active) return;
        setError('Não foi possível carregar as publicações desta edição.');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadInitial();
    return () => {
      active = false;
    };
  }, []);

  const handleLoadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await getPublishedPosts(PAGE_SIZE, lastDoc);
      setPosts((prev) => [...prev, ...res.posts]);
      setLastDoc(res.lastDoc);
      setHasMore(res.hasMore);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <Masthead />
      <AnnouncementBar posts={posts} />
      <main className="flex-1">
        {loading ? (
          <div className="newspaper-container py-16 text-center">
            <p className="font-condensed text-sm uppercase tracking-widest text-muted">
              Carregando edição...
            </p>
          </div>
        ) : error ? (
          <div className="newspaper-container py-16 text-center">
            <p className="font-serif text-xl text-red-700">{error}</p>
          </div>
        ) : (
          <ArticleGrid
            posts={posts}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={handleLoadMore}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}
