import { Link } from 'react-router-dom';
import type { Post } from '@/types/post';

interface AnnouncementBarProps {
  posts: Post[];
}

export function AnnouncementBar({ posts }: AnnouncementBarProps) {
  if (posts.length === 0) {
    return null;
  }

  const headlines = posts.slice(0, 5);

  return (
    <div className="bg-ink text-paper border-b border-ink overflow-hidden py-2">
      <div className="newspaper-container flex items-center gap-4">
        <span className="shrink-0 font-condensed text-xs uppercase tracking-widest font-bold bg-paper text-ink px-2 py-0.5">
          Últimas
        </span>
        <div className="overflow-hidden flex-1">
          <div className="ticker-track font-condensed text-xs uppercase tracking-wider gap-8">
            {[...headlines, ...headlines].map((post, idx) => (
              <Link
                key={`${post.slug}-${idx}`}
                to={`/post/${post.slug}`}
                className="whitespace-nowrap hover:underline flex items-center gap-3"
              >
                <span>{post.title}</span>
                <span aria-hidden="true" className="opacity-40">
                  •
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
