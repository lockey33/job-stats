export function itemTjmApprox(min_tjm?: number | null, max_tjm?: number | null): number | null {
  const min = typeof min_tjm === 'number' ? min_tjm : null
  const max = typeof max_tjm === 'number' ? max_tjm : null
  if (min != null && max != null) return (min + max) / 2
  if (min != null) return min
  if (max != null) return max
  return null
}
