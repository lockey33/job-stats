export function stableStringify(input: unknown): string {
  if (Array.isArray(input)) {
    const arr = [...input]
    try {
      arr.sort()
    } catch {}
    return '[' + arr.map(stableStringify).join(',') + ']'
  }
  if (input && typeof input === 'object') {
    const obj = input as Record<string, unknown>
    const keys = Object.keys(obj).sort()
    return '{' + keys.map((k) => JSON.stringify(k) + ':' + stableStringify(obj[k])).join(',') + '}'
  }
  return JSON.stringify(input)
}
