import { useEffect, useState, type ImgHTMLAttributes } from 'react';
import {
  getCachedMediaUrl,
  isFirestoreMediaUrl,
  resolveMediaUrl,
} from '@/services/storage.service';

/**
 * Renders either standard HTTP/data images immediately or resolves
 * `castalia-media://<id>` references stored in Firestore with in-memory caching.
 */
export function MediaImage({
  src,
  alt,
  className,
  ...rest
}: ImgHTMLAttributes<HTMLImageElement>) {
  const isManaged = Boolean(src && isFirestoreMediaUrl(src));
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(() => {
    if (!src) return null;
    return isManaged ? getCachedMediaUrl(src) : src;
  });

  useEffect(() => {
    if (!src) {
      setResolvedSrc(null);
      return;
    }

    if (!isFirestoreMediaUrl(src)) {
      setResolvedSrc(src);
      return;
    }

    const cached = getCachedMediaUrl(src);
    if (cached) {
      setResolvedSrc(cached);
      return;
    }

    let active = true;
    void resolveMediaUrl(src).then((url) => {
      if (active) {
        setResolvedSrc(url);
      }
    });

    return () => {
      active = false;
    };
  }, [src]);

  if (!src) return null;

  if (isManaged && !resolvedSrc) {
    return (
      <span
        role="img"
        aria-label={alt || 'Carregando imagem'}
        className={`inline-block min-h-32 ${className ?? ''} bg-ink/5 animate-pulse`}
      />
    );
  }

  return (
    <img
      src={resolvedSrc ?? src}
      alt={alt ?? ''}
      className={className}
      {...rest}
    />
  );
}
