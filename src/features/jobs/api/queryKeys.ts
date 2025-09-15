import { paramsKey } from '@/shared/react-query/keys'

export const queryKeys = {
  meta: () => ['meta'] as const,
  jobs: (params: Record<string, unknown>) => ['jobs', paramsKey(params)] as const,
  metrics: (params: Record<string, unknown>) => ['metrics', paramsKey(params)] as const,
  topSkills: (params: Record<string, unknown>) => ['topSkills', paramsKey(params)] as const,
  emerging: (params: Record<string, unknown>) => ['emerging', paramsKey(params)] as const,
}
