import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { getPostsByTag } from '@/services/posts.service';
import type { Post } from '@/types/post';
import { Masthead } from '@/components/reader/Masthead';
import { ArticleCard } from '@/components/reader/ArticleCard';
import { Footer } from '@/components/reader/Footer';

const PAGE_SIZE = 10;

interface TagPageProps {
  tag?: string;
}

export function TagPage({ tag: propTag }: TagPageProps = {}) {
  const { tag: routeTag } = useParams<{ tag: string }>();
  const tag = propTag ?? routeTag;
  const [posts, setPosts] = useState<Post[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tag) return;
    let active = true;
    async function loadByTag() {
      setLoading(true);
      setError(null);
      try {
        const res = await getPostsByTag(tag!, PAGE_SIZE);
        if (!active) return;
        setPosts(res.posts);
        setLastDoc(res.lastDoc);
        setHasMore(res.hasMore);
      } catch {
        if (active) setError('Não foi possível carregar os artigos desta seção.');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadByTag();
    return () => {
      active = false;
    };
  }, [tag]);

  const handleLoadMore = async () => {
    if (!tag || !lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await getPostsByTag(tag, PAGE_SIZE, lastDoc);
      setPosts((prev) => [...prev, ...res.posts]);
      setLastDoc(res.lastDoc);
      setHasMore(res.hasMore);
    } catch {
      setError('Não foi possível carregar mais artigos.');
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <Masthead />

      <main className="flex-1 newspaper-container py-10">
        {loading ? (
          <p className="font-condensed text-sm uppercase tracking-widest text-muted py-12 text-center">
            Buscando publicações...
          </p>
        ) : error ? (
          <p className="font-serif text-lg text-red-700 py-12 text-center">
            {error}
          </p>
        ) : posts.length === 0 ? (
          <p className="font-serif text-xl text-muted italic py-12 text-center">
            Nenhum artigo publicado sob a tag "{tag}".
          </p>
        ) : (
          <div className="max-w-3xl">
            {posts.map((post) => (
              <ArticleCard key={post.slug} post={post} variant="horizontal" />
            ))}

            {hasMore && (
              <div className="mt-8">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="font-condensed uppercase tracking-widest text-sm font-bold border-2 border-ink px-6 py-2 hover:bg-ink hover:text-paper transition-colors disabled:opacity-50"
                >
                  {loadingMore ? 'Carregando...' : 'Carregar Mais'}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
