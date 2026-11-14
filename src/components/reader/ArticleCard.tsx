import { Link } from 'react-router-dom';
import type { Post } from '@/types/post';
import { formatDate } from '@/utils/formatDate';
import { TagBadge } from './TagBadge';

export type ArticleCardVariant = 'big' | 'horizontal' | 'small';

interface ArticleCardProps {
  post: Post;
  variant?: ArticleCardVariant;
}

export function ArticleCard({ post, variant = 'horizontal' }: ArticleCardProps) {
  const dateLabel = formatDate(post.published_at ?? post.created_at);

  if (variant === 'big') {
    return (
      <article className="border-b border-ink/15 pb-6">
        {post.feature_image && (
          <Link to={`/post/${post.slug}`} className="block mb-4 overflow-hidden">
            <img
              src={post.feature_image}
              alt={post.title}
              loading="eager"
              className="w-full h-72 sm:h-96 object-cover border border-ink/10 hover:opacity-95 transition-opacity"
            />
          </Link>
        )}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {post.tags.slice(0, 2).map((tag) => (
            <TagBadge key={tag} tag={tag} />
          ))}
          <span className="font-condensed text-xs uppercase tracking-widest text-muted">
            {dateLabel} • {post.reading_time} min de leitura
          </span>
        </div>
        <Link to={`/post/${post.slug}`} className="group block">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink leading-tight group-hover:underline">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="mt-3 font-serif text-lg text-muted leading-relaxed">
              {post.excerpt}
            </p>
          )}
        </Link>
      </article>
    );
  }

  if (variant === 'small') {
    return (
      <article className="border-b border-ink/15 pb-4 pt-3 first:pt-0">
        <div className="flex items-center gap-2 mb-1">
          {post.tags[0] && <TagBadge tag={post.tags[0]} />}
          <span className="font-condensed text-[11px] uppercase tracking-wider text-muted">
            {dateLabel}
          </span>
        </div>
        <Link to={`/post/${post.slug}`} className="group block">
          <h3 className="font-serif text-xl font-bold text-ink leading-snug group-hover:underline">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="mt-1 text-sm text-muted line-clamp-2">{post.excerpt}</p>
          )}
        </Link>
      </article>
    );
  }

  return (
    <article className="border-b border-ink/15 py-5 flex flex-col sm:flex-row gap-4 items-start">
      {post.feature_image && (
        <Link to={`/post/${post.slug}`} className="shrink-0 w-full sm:w-44 overflow-hidden">
          <img
            src={post.feature_image}
            alt={post.title}
            loading="lazy"
            className="w-full h-32 sm:h-28 object-cover border border-ink/10 hover:opacity-95 transition-opacity"
          />
        </Link>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          {post.tags.slice(0, 2).map((tag) => (
            <TagBadge key={tag} tag={tag} />
          ))}
          <span className="font-condensed text-xs uppercase tracking-wider text-muted">
            {dateLabel} • {post.reading_time} min
          </span>
        </div>
        <Link to={`/post/${post.slug}`} className="group block">
          <h3 className="font-serif text-2xl font-bold text-ink leading-snug group-hover:underline">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="mt-1.5 text-sm text-muted line-clamp-2 leading-relaxed">
              {post.excerpt}
            </p>
          )}
        </Link>
      </div>
    </article>
  );
}
