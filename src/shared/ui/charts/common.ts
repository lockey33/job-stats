import type { Margin } from 'recharts/types/util/types'

export const CHART_MARGIN: Margin = { top: 10, right: 16, bottom: 0, left: 0 }
export const CITY_CHART_MARGIN: Margin = { top: 10, right: 20, bottom: 0, left: 0 }

export function xAxisProps(isMobile: boolean) {
  const interval: 'preserveStartEnd' | 'preserveEnd' = isMobile ? 'preserveStartEnd' : 'preserveEnd'
  const tick: boolean = !isMobile

  return {
    type: 'category' as const,
    scale: 'point' as const,
    interval,
    tick,
  }
}
