import type { NavItem } from '@/types/site';
import { slugify } from './slugify';

export interface MenuTagOption {
  label: string;
  tag: string;
}

/**
 * Normalizes and deduplicates an array of tags while preserving order.
 */
export function normalizeTagList(tags: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const raw of tags) {
    const normalized = slugify(raw);
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
  }

  return result;
}

/**
 * Parses a comma-separated tags input string into unique normalized tag slugs.
 */
export function parseTagsInput(input: string): string[] {
  if (!input.trim()) return [];
  return normalizeTagList(input.split(','));
}

/**
 * Toggles a tag slug inside a comma-separated tags input string.
 */
export function toggleTagInInput(input: string, tag: string): string {
  const target = slugify(tag);
  if (!target) return input;

  const current = parseTagsInput(input);
  const exists = current.includes(target);
  const next = exists
    ? current.filter((item) => item !== target)
    : [...current, target];

  return next.join(', ');
}

/**
 * Extracts the normalized tag slug from an internal `/tag/<slug>` menu path.
 */
export function extractTagFromNavPath(path: string): string | null {
  const trimmed = path.trim();
  const match = trimmed.match(/^\/tag\/([^/?#]+)\/?$/i);
  if (!match) return null;

  const normalized = slugify(decodeURIComponent(match[1]));
  return normalized || null;
}

/**
 * Collects unique tag-backed sections defined in the navigation menu.
 */
export function extractMenuTagOptions(items: NavItem[]): MenuTagOption[] {
  const seen = new Set<string>();
  const options: MenuTagOption[] = [];

  for (const item of items) {
    const tag = extractTagFromNavPath(item.path);
    if (tag && !seen.has(tag)) {
      seen.add(tag);
      options.push({ label: item.label, tag });
    }
  }

  return options;
}
