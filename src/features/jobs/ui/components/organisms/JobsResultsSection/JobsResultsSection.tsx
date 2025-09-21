'use client'

import { Alert, Box, Button, Text } from '@chakra-ui/react'

import type { JobFilters, JobItem, JobsResult } from '@/features/jobs/types/types'
import { FilterIcon, StarIcon } from '@/shared/ui/components/atoms/Icons/Icons'
import LoadingOverlay from '@/shared/ui/components/atoms/LoadingOverlay/LoadingOverlay'
import AppliedFiltersChips from '@/shared/ui/components/molecules/AppliedFiltersChips/AppliedFiltersChips'
import Pagination from '@/shared/ui/components/molecules/Pagination/Pagination'
import ResultsToolbar from '@/shared/ui/components/molecules/ResultsToolbar/ResultsToolbar'
import Section from '@/shared/ui/components/molecules/Section/Section'
import ResultsSkeleton from '@/shared/ui/components/organisms/ResultsSkeleton/ResultsSkeleton'
import ResultsListMobile from '@/shared/ui/components/organisms/ResultsTable/ResultsListMobile'
import ResultsTable from '@/shared/ui/components/organisms/ResultsTable/ResultsTable'
import SavedSearches from '@/shared/ui/components/organisms/SavedSearches/SavedSearches'

type SortKey = 'title' | 'company' | 'city' | 'experience' | 'tjm' | 'date'

interface Props {
  jobs: JobsResult | null
  isLoading: boolean
  isError: boolean
  error?: unknown
  isFetching: boolean
  filters: JobFilters
  onFiltersChange: (next: JobFilters) => void
  onClearAllFilters: () => void
  activeFiltersCount: number
  onOpenFilters: () => void
  showSaved: boolean
  onToggleSaved: () => void
  sortKey?: SortKey
  sortOrder?: 'asc' | 'desc'
  onSortChange: (key: SortKey, order: 'asc' | 'desc') => void
  onSelectJob: (job: JobItem) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  exporting: boolean
  onExportCurrentPage: () => void
  onExportAllFiltered: () => void
}

export default function JobsResultsSection(props: Props) {
  const {
    jobs,
    isLoading,
    isError,
    error,
    isFetching,
    filters,
    onFiltersChange,
    onClearAllFilters,
    activeFiltersCount,
    onOpenFilters,
    showSaved,
    onToggleSaved,
    sortKey,
    sortOrder = 'asc',
    onSortChange,
    onSelectJob,
    onPageChange,
    onPageSizeChange,
    exporting,
    onExportCurrentPage,
    onExportAllFiltered,
  } = props

  if (isLoading && !jobs) return <ResultsSkeleton />

  if (isError) {
    return (
      <Alert.Root status="error" mb="md">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Erreur résultats</Alert.Title>
          <Alert.Description>{String((error as Error)?.message ?? error)}</Alert.Description>
          <Box mt="sm">
            <Button
              size="sm"
              onClick={() => window.location.reload()}
              variant="outline"
              colorPalette="brand"
            >
              Recharger
            </Button>
          </Box>
        </Alert.Content>
      </Alert.Root>
    )
  }

  if (!jobs) return null

  if (jobs.total === 0) {
    return (
      <Section
        actions={
          <Button size="sm" variant="outline" colorPalette="brand" onClick={onOpenFilters}>
            {activeFiltersCount > 0 ? `Filtrer (${activeFiltersCount})` : 'Filtrer'}
          </Button>
        }
      >
        <Box textAlign="center" color="gray.700" py="lg">
          <Text fontWeight="medium" mb="xs">
            Aucun résultat
          </Text>
          <Text fontSize="sm" color="gray.600" mb="sm">
            Essayez d’assouplir ou de réinitialiser vos filtres.
          </Text>
          <Button size="sm" onClick={onClearAllFilters} variant="outline" colorPalette="brand">
            Réinitialiser les filtres
          </Button>
        </Box>
      </Section>
    )
  }

  return (
    <Section>
      {isFetching && <LoadingOverlay text="Mise à jour des résultats…" />}
      <Box id="results-section" />
      <AppliedFiltersChips
        value={filters}
        onChange={onFiltersChange}
        onClearAll={onClearAllFilters}
      />
      <Box
        position="sticky"
        top="0"
        zIndex={5}
        bg="surface"
        borderBottomWidth="1px"
        borderColor="border"
        py="xs"
      >
        <ResultsToolbar
          total={jobs.total}
          exporting={exporting}
          onExportCurrentPage={onExportCurrentPage}
          onExportAllFiltered={onExportAllFiltered}
          rightActionLabel={
            showSaved ? 'Masquer les recherches enregistrées' : 'Recherches enregistrées'
          }
          onRightAction={onToggleSaved}
          leftSlot={
            <Button
              size={{ base: 'sm', md: 'md' }}
              variant="outline"
              colorPalette="brand"
              onClick={onOpenFilters}
              aria-label={activeFiltersCount > 0 ? `Filtrer (${activeFiltersCount})` : 'Filtrer'}
              title={activeFiltersCount > 0 ? `Filtrer (${activeFiltersCount})` : 'Filtrer'}
            >
              <FilterIcon boxSize="1.25em" />
              <Text as="span" display={{ base: 'none', md: 'inline' }}>
                {activeFiltersCount > 0 ? `Filtrer (${activeFiltersCount})` : 'Filtrer'}
              </Text>
            </Button>
          }
          rightSlot={
            <Button
              size={{ base: 'sm', md: 'md' }}
              variant="outline"
              onClick={onToggleSaved}
              aria-label={
                showSaved ? 'Masquer les recherches enregistrées' : 'Recherches enregistrées'
              }
              title={showSaved ? 'Masquer les recherches enregistrées' : 'Recherches enregistrées'}
            >
              <StarIcon boxSize="1.25em" />
              <Text as="span" display={{ base: 'inline', md: 'inline' }}>
                {showSaved ? 'Masquer les recherches enregistrées' : 'Recherches enregistrées'}
              </Text>
            </Button>
          }
        />
      </Box>
      {showSaved && (
        <Box mt="sm">
          <SavedSearches currentFilters={filters} onApply={(f) => onFiltersChange(f)} />
        </Box>
      )}
      {/* Mobile cards */}
      <Box display={{ base: 'block', md: 'none' }}>
        <ResultsListMobile items={jobs.items} onSelect={onSelectJob} />
      </Box>
      {/* Desktop table */}
      <Box display={{ base: 'none', md: 'block' }}>
        <ResultsTable
          items={jobs.items}
          {...(sortKey ? { sortKey } : {})}
          sortOrder={sortOrder}
          onSortChange={onSortChange}
          onSelect={onSelectJob}
        />
      </Box>
      <Pagination
        page={jobs.page}
        pageSize={jobs.pageSize}
        pageCount={jobs.pageCount}
        total={jobs.total}
        onPageChange={onPageChange}
        pageSizeOptions={[10, 20, 50]}
        onPageSizeChange={onPageSizeChange}
      />
    </Section>
  )
}
