import { useEffect, useState } from 'react';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { siteConfig } from '@/config/site.config';
import { getPublishedPosts } from '@/services/posts.service';
import type { Post } from '@/types/post';
import type { StaticHtmlPage } from '@/utils/staticPages';
import { Masthead } from '@/components/reader/Masthead';
import { AnnouncementBar } from '@/components/reader/AnnouncementBar';
import { ArticleGrid } from '@/components/reader/ArticleGrid';
import { Footer } from '@/components/reader/Footer';

const PAGE_SIZE = 10;

interface HomePageProps {
  staticPage?: StaticHtmlPage;
}

export function HomePage({ staticPage }: HomePageProps = {}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = staticPage
      ? `${staticPage.title} — ${siteConfig.title}`
      : `${siteConfig.title} — ${siteConfig.subtitle}`;
  }, [staticPage]);

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
        {!staticPage && loading ? (
          <div className="newspaper-container py-16 text-center">
            <p className="font-condensed text-sm uppercase tracking-widest text-muted">
              Carregando edição...
            </p>
          </div>
        ) : !staticPage && error ? (
          <div className="newspaper-container py-16 text-center">
            <p className="font-serif text-xl text-red-700">{error}</p>
          </div>
        ) : (
          <ArticleGrid
            posts={posts}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={handleLoadMore}
            staticPage={staticPage}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}
