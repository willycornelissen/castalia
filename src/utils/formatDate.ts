/**
 * Formats a post publication date in Brazilian Portuguese editorial style.
 */
export function formatDate(date: Date | null | undefined): string {
  if (!date) {
    return 'Rascunho';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Formats the newspaper masthead dateline including weekday.
 */
export function formatMastheadDate(date: Date = new Date()): string {
  const formatted = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}
