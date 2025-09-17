export function decodeHtmlEntities(input: string): string {
  if (!input) return ''
  // Prefer DOM-based decoding when available (client-side)
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const el = document.createElement('textarea')
    el.innerHTML = input
    return el.value
  }
  // Fallback: handle common named + numeric entities
  return input
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;|&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num: string) => String.fromCharCode(parseInt(num, 10)))
}

// Convert basic HTML to readable plain text with line breaks
export function htmlToPlainText(html?: string | null): string {
  if (!html) return ''
  let s = html
  // Convert meaningful breaks to newlines before stripping
  s = s.replace(/<\s*br\s*\/?\s*>/gi, '\n')
  s = s.replace(/<\/(p|div|li|h[1-6]|ul|ol)\s*>/gi, '\n')
  // Optional: prefix list items with a dash
  s = s.replace(/<\s*li[^>]*>/gi, '- ')
  // Strip remaining tags
  s = s.replace(/<[^>]*>/g, ' ')
  // Decode entities
  s = decodeHtmlEntities(s)
  // Normalize whitespace
  s = s.replace(/\u00A0/g, ' ')
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return s
}

