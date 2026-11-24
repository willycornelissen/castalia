import { siteConfig } from '@/config/site.config';
import { isExternalNavUrl } from '@/utils/url';
import type { NavItem } from '@/types/site';

export interface StaticHtmlPage {
  slug: string;
  path: string;
  label: string;
  title: string;
  bodyHtml: string;
}

const ALLOWED_TAGS = new Set([
  'a',
  'abbr',
  'address',
  'article',
  'aside',
  'b',
  'blockquote',
  'br',
  'caption',
  'cite',
  'code',
  'col',
  'colgroup',
  'dd',
  'details',
  'div',
  'dl',
  'dt',
  'em',
  'figcaption',
  'figure',
  'footer',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hr',
  'i',
  'img',
  'li',
  'main',
  'mark',
  'nav',
  'ol',
  'p',
  'picture',
  'pre',
  'q',
  's',
  'section',
  'small',
  'source',
  'span',
  'strong',
  'sub',
  'summary',
  'sup',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'time',
  'tr',
  'u',
  'ul',
]);

const STRIP_WITH_CONTENT_TAGS = new Set([
  'base',
  'embed',
  'form',
  'iframe',
  'link',
  'meta',
  'noscript',
  'object',
  'script',
  'style',
  'svg',
  'template',
]);

const ALLOWED_GLOBAL_ATTRS = new Set([
  'aria-hidden',
  'aria-label',
  'class',
  'dir',
  'id',
  'lang',
  'role',
  'title',
]);

const ALLOWED_TAG_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'rel', 'target']),
  col: new Set(['span']),
  colgroup: new Set(['span']),
  details: new Set(['open']),
  img: new Set(['alt', 'height', 'loading', 'src', 'srcset', 'width']),
  ol: new Set(['reversed', 'start', 'type']),
  source: new Set(['media', 'sizes', 'src', 'srcset', 'type']),
  td: new Set(['colspan', 'headers', 'rowspan']),
  th: new Set(['colspan', 'headers', 'rowspan', 'scope']),
  time: new Set(['datetime']),
};

const URL_ATTRS = new Set(['href', 'src']);

function isSafeUrl(rawUrl: string): boolean {
  const trimmed = rawUrl.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('//')) return false;
  if (trimmed.startsWith('#') || trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
    return true;
  }
  const schemeMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  if (!schemeMatch) {
    return true;
  }
  const protocol = schemeMatch[1].toLowerCase();
  return protocol === 'http' || protocol === 'https' || protocol === 'mailto' || protocol === 'tel';
}

function isSafeSrcset(rawSrcset: string): boolean {
  const candidates = rawSrcset
    .split(',')
    .map((part) => part.trim().split(/\s+/)[0])
    .filter(Boolean);
  return candidates.length > 0 && candidates.every(isSafeUrl);
}

function sanitizeElement(element: Element): void {
  const children = Array.from(element.children);
  for (const child of children) {
    const tagName = child.tagName.toLowerCase();
    if (STRIP_WITH_CONTENT_TAGS.has(tagName)) {
      child.remove();
      continue;
    }

    sanitizeElement(child);

    if (!ALLOWED_TAGS.has(tagName)) {
      const parent = child.parentNode;
      if (parent) {
        while (child.firstChild) {
          parent.insertBefore(child.firstChild, child);
        }
        parent.removeChild(child);
      }
      continue;
    }

    const allowedForTag = ALLOWED_TAG_ATTRS[tagName];
    for (const attr of Array.from(child.attributes)) {
      const attrName = attr.name.toLowerCase();
      if (attrName.startsWith('on')) {
        child.removeAttribute(attr.name);
        continue;
      }

      const isAllowed =
        ALLOWED_GLOBAL_ATTRS.has(attrName) || Boolean(allowedForTag?.has(attrName));
      if (!isAllowed) {
        child.removeAttribute(attr.name);
        continue;
      }

      if (URL_ATTRS.has(attrName) && !isSafeUrl(attr.value)) {
        child.removeAttribute(attr.name);
        continue;
      }

      if (attrName === 'srcset' && !isSafeSrcset(attr.value)) {
        child.removeAttribute(attr.name);
      }
    }

    if (tagName === 'a' && child.getAttribute('target') === '_blank') {
      child.setAttribute('rel', 'noopener noreferrer');
    }
  }
}

/**
 * Parses and sanitizes an HTML document or fragment for safe rendering inside the site layout.
 */
export function parseStaticHtmlPage(
  rawHtml: string,
  fallbackTitle: string
): { title: string; bodyHtml: string } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  sanitizeElement(doc.body);

  const headingTitle = doc.body.querySelector('h1')?.textContent?.trim();
  const headTitle = doc.title.trim();
  const title = headTitle || headingTitle || fallbackTitle;
  const bodyHtml = doc.body.innerHTML.trim();

  return { title, bodyHtml };
}

const rawStaticHtmlModules = import.meta.glob('../pages/static/*.html', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/**
 * Resolves editable static HTML pages corresponding to internal `quickArchive` links.
 * External links (such as Nova Acrópole) are intentionally excluded.
 */
export function loadQuickArchiveStaticPages(
  items: NavItem[] = siteConfig.quickArchive,
  modules: Record<string, string> = rawStaticHtmlModules
): StaticHtmlPage[] {
  const pages: StaticHtmlPage[] = [];

  for (const item of items) {
    if (isExternalNavUrl(item.path)) {
      continue;
    }

    const cleanPath = item.path.trim().replace(/\/+$/, '');
    const slug = cleanPath.replace(/^\/+/, '');
    if (!slug || slug.includes('/')) {
      continue;
    }

    const moduleEntry = Object.entries(modules).find(([filePath]) =>
      filePath.endsWith(`/${slug}.html`)
    );
    const { title, bodyHtml } = moduleEntry
      ? parseStaticHtmlPage(moduleEntry[1], item.label)
      : (() => {
          const fallbackEl = document.createElement('h1');
          fallbackEl.textContent = item.label;
          return { title: item.label, bodyHtml: fallbackEl.outerHTML };
        })();

    pages.push({
      slug,
      path: `/${slug}`,
      label: item.label,
      title,
      bodyHtml,
    });
  }

  return pages;
}

export const quickArchiveStaticPages = loadQuickArchiveStaticPages();
