interface StaticHtmlContentProps {
  html: string;
}

/**
 * Renders sanitized HTML content for static archive pages inside the editorial prose style.
 */
export function StaticHtmlContent({ html }: StaticHtmlContentProps) {
  return (
    <div
      className="newspaper-prose"
      // HTML is pre-sanitized by parseStaticHtmlPage allowlist before rendering
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
