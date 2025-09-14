export const queryKeys = {
  meta: () => ['meta'] as const,
  jobs: (params: Record<string, unknown>) => ['jobs', params] as const,
  metrics: (params: Record<string, unknown>) => ['metrics', params] as const,
  topSkills: (params: Record<string, unknown>) => ['topSkills', params] as const,
  emerging: (params: Record<string, unknown>) => ['emerging', params] as const,
};

