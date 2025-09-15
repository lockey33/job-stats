import { stableStringify } from '@/shared/utils/stableStringify'

// Build a stable string key for React Query based on params
export function paramsKey(params: Record<string, unknown>): string {
  return stableStringify(params)
}
