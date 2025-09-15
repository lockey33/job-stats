'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { parseAsInteger, parseAsString,useQueryState } from 'nuqs'
import { useDeferredValue, useEffect } from 'react'
import { type Resolver,useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'

import { filtersSchema } from '@/shared/utils/searchParams'

const formSchema = filtersSchema.pick({
  q: true,
  skills: true,
  excludeSkills: true,
  excludeTitle: true,
  cities: true,
  cityMatch: true,
  excludeCities: true,
  regions: true,
  excludeRegions: true,
  remote: true,
  experience: true,
  job_slugs: true,
  minTjm: true,
  maxTjm: true,
  startDate: true,
  endDate: true,
})

export type FiltersFormValues = z.infer<typeof formSchema>
type SortKey = 'title' | 'company' | 'city' | 'experience' | 'tjm' | 'date' | undefined
type SortOrder = 'asc' | 'desc'

export function useExplorerState() {
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1))
  const [pageSize, setPageSize] = useQueryState('pageSize', parseAsInteger.withDefault(20))
  const [sortKeyRaw, setSortKeyRaw] = useQueryState('sortKey', parseAsString)
  const [sortOrderRaw, setSortOrderRaw] = useQueryState(
    'sortOrder',
    parseAsString.withDefault('asc'),
  )

  const form = useForm<FiltersFormValues>({
    resolver: zodResolver(formSchema) as Resolver<FiltersFormValues>,
    defaultValues: {} as FiltersFormValues,
  })
  const filters = useWatch({ control: form.control })
  const deferredFilters = useDeferredValue(filters)

  useEffect(() => {
    setPage(1)
  }, [deferredFilters, setPage])

  return {
    form,
    filters,
    deferredFilters,
    page,
    setPage,
    pageSize,
    setPageSize,
    sortKey: sortKeyRaw as SortKey,
    setSortKey: (v: SortKey) => setSortKeyRaw((v ?? null) as unknown as string | null),
    sortOrder: sortOrderRaw as SortOrder,
    setSortOrder: (v: SortOrder) => setSortOrderRaw(v),
  } as const
}
