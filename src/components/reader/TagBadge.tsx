import { Link } from 'react-router-dom';

interface TagBadgeProps {
  tag: string;
}

export function TagBadge({ tag }: TagBadgeProps) {
  return (
    <Link
      to={`/tag/${tag}`}
      className="inline-block font-condensed text-xs uppercase tracking-widest border border-ink/25 px-2 py-0.5 text-ink hover:bg-ink hover:text-paper transition-colors"
    >
      {tag}
    </Link>
  );
}
