import { Link, useLocation } from 'react-router-dom';
import { siteConfig } from '@/config/site.config';
import { isExternalNavUrl } from '@/utils/url';
import type { Post } from '@/types/post';
import type { StaticHtmlPage } from '@/utils/staticPages';
import { ArticleCard } from './ArticleCard';
import { StaticHtmlContent } from './StaticHtmlContent';

interface ArticleGridProps {
  posts: Post[];
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  staticPage?: StaticHtmlPage;
}

export function ArticleGrid({
  posts,
  hasMore,
  loadingMore,
  onLoadMore,
  staticPage,
}: ArticleGridProps) {
  const location = useLocation();

  if (!staticPage && posts.length === 0) {
    return (
      <div className="newspaper-container py-16 text-center">
        <p className="font-serif text-2xl text-muted italic">
          Nenhuma publicação encontrada nesta edição.
        </p>
      </div>
    );
  }

  const leadPost = posts[0];
  const centerListPosts = [...posts.slice(1, 3), ...posts.slice(9)];
  const leftColumnPosts = posts.slice(3, 6);
  const rightColumnPosts = posts.slice(6, 9);

  return (
    <section className="newspaper-container py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Small editorial headlines */}
        <div
          data-testid="left-column"
          className="lg:col-span-3 lg:border-r lg:border-ink/15 lg:pr-6 order-2 lg:order-1"
        >
          <h2 className="font-condensed text-xs uppercase tracking-widest font-bold border-b-2 border-ink pb-2 mb-4">
            Destaques Recentes
          </h2>
          {leftColumnPosts.length > 0 ? (
            leftColumnPosts.map((post) => (
              <ArticleCard key={post.slug} post={post} variant="small" />
            ))
          ) : (
            <p className="text-xs text-muted italic">Sem matérias secundárias.</p>
          )}
        </div>

        {/* Center Column: Lead story + horizontal feed, or active static page */}
        <div data-testid="center-column" className="lg:col-span-6 order-1 lg:order-2">
          {staticPage ? (
            <article aria-label={staticPage.title}>
              <StaticHtmlContent html={staticPage.bodyHtml} />
            </article>
          ) : (
            <>
              <ArticleCard post={leadPost} variant="big" />

              {centerListPosts.length > 0 && (
                <div className="mt-4">
                  {centerListPosts.map((post) => (
                    <ArticleCard key={post.slug} post={post} variant="horizontal" />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Column: Compact digest */}
        <div
          data-testid="right-column"
          className="lg:col-span-3 lg:border-l lg:border-ink/15 lg:pl-6 order-3"
        >
          <nav
            aria-label="Seções em destaque"
            className={
              rightColumnPosts.length > 0 ? 'mb-6 pb-5 border-b border-ink/15' : ''
            }
          >
            <ul className="space-y-2">
              {siteConfig.quickArchive.map((item) => {
                const isExternal = isExternalNavUrl(item.path);
                const isActive = !isExternal && location.pathname === item.path;
                const className = `font-condensed text-sm uppercase tracking-wider font-bold text-ink hover:underline flex items-center justify-between py-0.5${
                  isActive ? ' underline' : ''
                }`;
                const content = (
                  <>
                    <span>{item.label}</span>
                    <span aria-hidden="true" className="text-muted text-xs">
                      →
                    </span>
                  </>
                );

                return (
                  <li key={item.path}>
                    {isExternal ? (
                      <a
                        href={item.path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={className}
                      >
                        {content}
                      </a>
                    ) : (
                      <Link
                        to={item.path}
                        aria-current={isActive ? 'page' : undefined}
                        className={className}
                      >
                        {content}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
          {rightColumnPosts.map((post) => (
            <ArticleCard key={`right-${post.slug}`} post={post} variant="small" />
          ))}
        </div>
      </div>

      {!staticPage && hasMore && (
        <div className="mt-10 text-center border-t border-ink/15 pt-8">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="font-condensed uppercase tracking-widest text-sm font-bold border-2 border-ink px-8 py-2.5 text-ink hover:bg-ink hover:text-paper transition-colors disabled:opacity-50"
          >
            {loadingMore ? 'Carregando...' : 'Carregar Mais'}
          </button>
        </div>
      )}
    </section>
  );
}
