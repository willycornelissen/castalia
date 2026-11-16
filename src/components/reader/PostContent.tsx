import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { MediaImage } from '@/components/common/MediaImage';
import { FIRESTORE_MEDIA_PREFIX } from '@/services/storage.service';

interface PostContentProps {
  markdown: string;
}

const sanitizeSchema = {
  ...defaultSchema,
  protocols: {
    ...defaultSchema.protocols,
    src: [...(defaultSchema.protocols?.src ?? ['http', 'https']), 'castalia-media'],
  },
};

function safeMarkdownUrlTransform(url: string): string {
  if (url.startsWith(FIRESTORE_MEDIA_PREFIX)) {
    return url;
  }
  return defaultUrlTransform(url);
}

/**
 * Renders article Markdown safely using rehype-sanitize to prevent XSS attacks.
 */
export function PostContent({ markdown }: PostContentProps) {
  return (
    <div className="newspaper-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
        urlTransform={safeMarkdownUrlTransform}
        components={{
          img: ({ src, alt }) => (
            <MediaImage
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
