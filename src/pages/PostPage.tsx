import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getPostBySlug } from '@/services/posts.service';
import { useAuth } from '@/context/AuthContext';
import { siteConfig } from '@/config/site.config';
import { formatDate } from '@/utils/formatDate';
import type { Post } from '@/types/post';
import { Masthead } from '@/components/reader/Masthead';
import { MediaImage } from '@/components/common/MediaImage';
import { PostContent } from '@/components/reader/PostContent';
import { TagBadge } from '@/components/reader/TagBadge';
import { Footer } from '@/components/reader/Footer';
import { NotFoundPage } from './NotFoundPage';

export function PostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';
  const { user, loading: authLoading } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    if (authLoading) {
      return;
    }

    let active = true;
    async function loadPost() {
      setLoading(true);
      setNotFound(false);
      try {
        const fetched = await getPostBySlug(slug!);
        if (!active) return;
        if (!fetched) {
          setNotFound(true);
        } else if (fetched.status === 'draft' && !user) {
          setNotFound(true);
        } else {
          setPost(fetched);
        }
      } catch {
        if (active) setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadPost();
    return () => {
      active = false;
    };
  }, [slug, isPreview, authLoading, user]);

  if (notFound) {
    return <NotFoundPage />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <Masthead />

      {post?.status === 'draft' && user && (
        <div className="bg-amber-100 border-b border-amber-400 text-amber-900 py-2 text-center font-condensed text-xs uppercase tracking-widest font-bold">
          Modo de Pré-Visualização — Este artigo ainda é um rascunho privado
        </div>
      )}

      <main className="flex-1 py-10">
        {loading || !post ? (
          <div className="newspaper-container py-16 text-center">
            <p className="font-condensed text-sm uppercase tracking-widest text-muted">
              Carregando artigo...
            </p>
          </div>
        ) : (
          <article className="max-w-3xl mx-auto px-6">
            <div className="mb-6">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 font-condensed text-xs uppercase tracking-widest text-muted hover:text-ink"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Voltar à Capa
              </Link>
            </div>

            <header className="border-b border-ink/15 pb-6 mb-8">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {post.tags.map((tag) => (
                  <TagBadge key={tag} tag={tag} />
                ))}
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl font-bold text-ink leading-tight">
                {post.title}
              </h1>

              {post.excerpt && (
                <p className="mt-4 font-serif italic text-xl text-muted leading-relaxed">
                  {post.excerpt}
                </p>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-xs font-condensed uppercase tracking-widest text-muted">
                <span>Por {siteConfig.author.name}</span>
                <span>
                  {formatDate(post.published_at ?? post.created_at)} • {post.reading_time} min de leitura
                </span>
              </div>
            </header>

            {post.feature_image && (
              <figure className="mb-8">
                <MediaImage
                  src={post.feature_image}
                  alt={post.title}
                  className="w-full h-auto max-h-[520px] object-cover border border-ink/15"
                />
              </figure>
            )}

            <PostContent markdown={post.content_markdown} />

            <aside className="mt-12 pt-8 border-t-2 border-ink flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div>
                <p className="font-condensed text-xs uppercase tracking-widest text-muted mb-1">
                  Sobre o Autor
                </p>
                <h3 className="font-serif text-xl font-bold text-ink">
                  {siteConfig.author.name}
                </h3>
                <p className="text-sm text-muted mt-1">{siteConfig.author.bio}</p>
              </div>
              <Link
                to="/"
                className="shrink-0 font-condensed text-xs uppercase tracking-widest font-bold border border-ink px-4 py-2 hover:bg-ink hover:text-paper transition-colors"
              >
                Mais Edições
              </Link>
            </aside>
          </article>
        )}
      </main>

      <Footer />
    </div>
  );
}
