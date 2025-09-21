import 'server-only'

/**
 * Compute the slope of the best-fit line (least squares) for a 1D series.
 * Returns 0 for series of length <= 1.
 */
export function linearSlope(y: number[]): number {
  const n = y.length

  if (n <= 1) return 0
  const xMean = (n - 1) / 2
  const yMean = y.reduce((a, b) => a + b, 0) / n
  let num = 0
  let den = 0

  for (let i = 0; i < n; i++) {
    const dx = i - xMean
    const yi = y[i] ?? yMean

    num += dx * (yi - yMean)
    den += dx * dx
  }

  return den === 0 ? 0 : num / den
}
