const WORDS_PER_MINUTE = 200;

/**
 * Estimates reading time in minutes from raw Markdown content.
 * Strips markdown punctuation before counting words and enforces a 1-minute floor.
 */
export function calculateReadingTime(markdown: string): number {
  const plainText = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#*_`~>\[\]()!]/g, ' ')
    .trim();

  if (!plainText) {
    return 1;
  }

  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
}
