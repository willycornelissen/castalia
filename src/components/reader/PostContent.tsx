import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

interface PostContentProps {
  markdown: string;
}

/**
 * Renders article Markdown safely using rehype-sanitize to prevent XSS attacks.
 */
export function PostContent({ markdown }: PostContentProps) {
  return (
    <div className="newspaper-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          img: ({ src, alt }) => (
            <img
              src={src ?? ''}
              alt={alt ?? ''}
              loading="lazy"
              className="w-full h-auto my-6 border border-ink/15"
            />
          ),
          a: ({ href, children }) => {
            const isProtocolRelative = Boolean(href && href.startsWith('//'));
            const safeHref = isProtocolRelative ? undefined : href;
            const isExternal = Boolean(safeHref && /^https?:\/\//i.test(safeHref));
            return (
              <a
                href={safeHref}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className="underline decoration-ink/40 hover:decoration-ink"
              >
                {children}
              </a>
            );
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
