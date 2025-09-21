export function norm(s?: string | null): string {
  return (s ?? '').toString().toLowerCase().trim()
}

export function normCity(s?: string | null): string {
  // Lowercase, remove parenthetical segments like " (33)", collapse spaces
  let v = norm(s)

  v = v.replace(/\([^)]*\)/g, ' ')
  v = v.replace(/\s+/g, ' ').trim()

  return v
}
