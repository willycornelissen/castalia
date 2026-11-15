import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { siteConfig } from '@/config/site.config';
import { slugify } from '@/utils/slugify';
import type { NavItem } from '@/types/site';

const SETTINGS_COLLECTION = 'settings';
const NAVIGATION_DOC_ID = 'navigation';
const MAX_NAV_ITEMS = 20;

export function isExternalNavUrl(path: string): boolean {
  return /^https?:\/\//i.test(path.trim());
}

/**
 * Normalizes and validates a menu path (internal `/...` route or external `http(s)://` URL).
 */
export function normalizeNavPath(rawPath: string): string {
  const trimmed = rawPath.trim();
  if (!trimmed) {
    throw new Error('Informe um caminho ou URL para cada opção do menu.');
  }

  if (isExternalNavUrl(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('Protocolo inválido');
      }
      return trimmed;
    } catch {
      throw new Error(
        'Caminho ou URL inválido. Use rotas internas (/...) ou URLs http(s)://.'
      );
    }
  }

  if (trimmed.startsWith('//') || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    throw new Error(
      'Caminho ou URL inválido. Use rotas internas (/...) ou URLs http(s)://.'
    );
  }

  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  if (/^\/tag(?:\/|$)/i.test(normalizedPath)) {
    const rawTag = normalizedPath.replace(/^\/tag\/?/i, '').replace(/\/+$/, '');
    const tagSlug = slugify(rawTag);
    if (!tagSlug) {
      throw new Error('Informe uma tag válida após /tag/.');
    }
    return `/tag/${tagSlug}`;
  }

  return normalizedPath;
}

/**
 * Validates and normalizes the full navigation menu list before persisting.
 */
export function validateAndNormalizeNavItems(items: NavItem[]): NavItem[] {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('O menu deve ter pelo menos uma opção.');
  }
  if (items.length > MAX_NAV_ITEMS) {
    throw new Error(`O menu pode ter no máximo ${MAX_NAV_ITEMS} opções.`);
  }

  return items.map((item) => {
    const label = typeof item.label === 'string' ? item.label.trim() : '';
    if (!label) {
      throw new Error('Informe um rótulo para cada opção do menu.');
    }
    const path = normalizeNavPath(typeof item.path === 'string' ? item.path : '');
    return { label, path };
  });
}

function sanitizeStoredItems(rawItems: unknown): NavItem[] {
  if (!Array.isArray(rawItems)) return [];

  const sanitized: NavItem[] = [];
  for (const entry of rawItems) {
    if (!entry || typeof entry !== 'object') continue;
    const candidate = entry as { label?: unknown; path?: unknown };
    const label = typeof candidate.label === 'string' ? candidate.label.trim() : '';
    const rawPath = typeof candidate.path === 'string' ? candidate.path : '';
    if (!label) continue;
    try {
      const path = normalizeNavPath(rawPath);
      sanitized.push({ label, path });
    } catch {
      // Skip malformed or unsafe stored entries
    }
  }
  return sanitized.slice(0, MAX_NAV_ITEMS);
}

/**
 * Fetches the custom navigation menu from Firestore, falling back to static siteConfig defaults.
 */
export async function getNavigationMenu(): Promise<NavItem[]> {
  try {
    const snap = await getDoc(doc(db, SETTINGS_COLLECTION, NAVIGATION_DOC_ID));
    if (!snap.exists()) {
      return siteConfig.navigation.map((item) => ({ ...item }));
    }

    const sanitized = sanitizeStoredItems(snap.data()?.items);
    if (sanitized.length === 0) {
      return siteConfig.navigation.map((item) => ({ ...item }));
    }
    return sanitized;
  } catch {
    return siteConfig.navigation.map((item) => ({ ...item }));
  }
}

/**
 * Validates and saves the navigation menu in Firestore (`settings/navigation`).
 */
export async function saveNavigationMenu(items: NavItem[]): Promise<NavItem[]> {
  const normalized = validateAndNormalizeNavItems(items);
  await setDoc(doc(db, SETTINGS_COLLECTION, NAVIGATION_DOC_ID), {
    items: normalized,
    updated_at: Timestamp.now(),
  });
  return normalized;
}
