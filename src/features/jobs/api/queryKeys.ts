import { normalizeKeyParams, paramsKey } from '@/shared/react-query/keys'

export const queryKeys = {
  meta: () => ['meta'] as const,
  jobs: (params: Record<string, unknown>) =>
    ['jobs', paramsKey(normalizeKeyParams(params))] as const,
  metrics: (params: Record<string, unknown>) =>
    ['metrics', paramsKey(normalizeKeyParams(params))] as const,
  topSkills: (params: Record<string, unknown>) =>
    ['topSkills', paramsKey(normalizeKeyParams(params))] as const,
  emerging: (params: Record<string, unknown>) =>
    ['emerging', paramsKey(normalizeKeyParams(params))] as const,
}
