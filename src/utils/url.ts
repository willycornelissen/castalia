/**
 * Returns true when a navigation path targets an external http(s) URL.
 */
export function isExternalNavUrl(path: string): boolean {
  return /^https?:\/\//i.test(path.trim());
}
