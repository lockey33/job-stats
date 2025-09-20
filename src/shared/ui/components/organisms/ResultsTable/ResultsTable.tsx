'use client'

import { Box, Table, Text } from '@chakra-ui/react'
import { format } from 'date-fns'
import { useMemo } from 'react'

import type { JobItem } from '@/features/jobs/types/types'
import TagsList from '@/shared/ui/components/atoms/TagsList/TagsList'

type SortKey = 'title' | 'company' | 'city' | 'experience' | 'tjm' | 'date'

interface Props {
  items: JobItem[]
  sortKey?: SortKey
  sortOrder?: 'asc' | 'desc'
  onSortChange?: (key: SortKey, order: 'asc' | 'desc') => void
  onSelect?: (item: JobItem) => void
}

function getComparable(it: JobItem, key: SortKey): string | number {
  switch (key) {
    case 'title':
      return (it.title ?? it.slug ?? it.job_slug ?? '').toLowerCase()
    case 'company':
      return (it.company_name ?? '').toLowerCase()
    case 'city':
      return (it.city ?? '').toLowerCase()
    case 'experience':
      return (it.experience ?? '').toLowerCase()
    case 'tjm':
      return (it.min_tjm ?? it.max_tjm ?? 0) as number
    case 'date':
      return it.created_at ?? ''
    default:
      return ''
  }
}

function sortItems(items: JobItem[], key?: SortKey, order: 'asc' | 'desc' = 'asc'): JobItem[] {
  if (!key) return items
  const copy = [...items]
  copy.sort((a, b) => {
    const va = getComparable(a, key)
    const vb = getComparable(b, key)
    if (typeof va === 'number' && typeof vb === 'number') {
      return order === 'asc' ? va - vb : vb - va
    }
    const sa = String(va)
    const sb = String(vb)
    const cmp = sa.localeCompare(sb)
    return order === 'asc' ? cmp : -cmp
  })
  return copy
}

function formatDate(input?: string | null): string {
  if (!input) return '—'
  const d = new Date(input)
  if (isNaN(d.getTime())) return '—'
  try {
    return format(d, 'dd/MM/yyyy')
  } catch {
    return '—'
  }
}

function formatExperience(exp?: string | null): string {
  const v = (exp || '').toString().toLowerCase()
  switch (v) {
    case 'junior':
      return 'Junior'
    case 'intermediate':
      return 'Confirmé'
    case 'senior':
      return 'Senior'
    default:
      return exp || '—'
  }
}

function SortHeader({
  label,
  active,
  order,
  onClick,
}: {
  label: string
  active: boolean
  order: 'asc' | 'desc'
  onClick: () => void
}) {
  return (
    <Box
      as="button"
      onClick={onClick}
      display="inline-flex"
      alignItems="center"
      gap="1"
      fontWeight="semibold"
    >
      <Text as="span">{label}</Text>
      {active && (
        <Text as="span" aria-hidden>
          {order === 'asc' ? '▲' : '▼'}
        </Text>
      )}
    </Box>
  )
}

export default function ResultsTable({
  items,
  sortKey,
  sortOrder = 'asc',
  onSortChange,
  onSelect,
}: Props) {
  const data = useMemo(() => sortItems(items, sortKey, sortOrder), [items, sortKey, sortOrder])
  const ariaSort = (key: SortKey | undefined): 'ascending' | 'descending' | 'none' | 'other' => {
    if (!key || sortKey !== key) return 'none'
    return sortOrder === 'asc' ? 'ascending' : 'descending'
  }

  return (
    <Box w="full">
      <Box
        overflowX="auto"
        rounded="lg"
        borderWidth="0px"
        bg="transparent"
        shadow="none"
        borderTopWidth="1px"
        borderColor="neutral.200"
      >
        <Table.Root size="sm" tableLayout="fixed">
          <Table.Header bg="neutral.50" position="sticky" top={0} zIndex={1}>
            <Table.Row>
              <Table.ColumnHeader aria-sort={ariaSort('title')} w="34%">
                <SortHeader
                  label="Titre"
                  active={sortKey === 'title'}
                  order={sortOrder}
                  onClick={() =>
                    onSortChange?.(
                      'title',
                      sortKey === 'title' && sortOrder === 'asc' ? 'desc' : 'asc',
                    )
                  }
                />
              </Table.ColumnHeader>
              <Table.ColumnHeader aria-sort={ariaSort('company')} w="18%">
                <SortHeader
                  label="Entreprise"
                  active={sortKey === 'company'}
                  order={sortOrder}
                  onClick={() =>
                    onSortChange?.(
                      'company',
                      sortKey === 'company' && sortOrder === 'asc' ? 'desc' : 'asc',
                    )
                  }
                />
              </Table.ColumnHeader>
              <Table.ColumnHeader aria-sort={ariaSort('city')} w="10%">
                <SortHeader
                  label="Ville"
                  active={sortKey === 'city'}
                  order={sortOrder}
                  onClick={() =>
                    onSortChange?.(
                      'city',
                      sortKey === 'city' && sortOrder === 'asc' ? 'desc' : 'asc',
                    )
                  }
                />
              </Table.ColumnHeader>
              <Table.ColumnHeader aria-sort={ariaSort('experience')} w="8%">
                <SortHeader
                  label="Exp."
                  active={sortKey === 'experience'}
                  order={sortOrder}
                  onClick={() =>
                    onSortChange?.(
                      'experience',
                      sortKey === 'experience' && sortOrder === 'asc' ? 'desc' : 'asc',
                    )
                  }
                />
              </Table.ColumnHeader>
              <Table.ColumnHeader aria-sort={ariaSort('tjm')} w="12%">
                <SortHeader
                  label="TJM"
                  active={sortKey === 'tjm'}
                  order={sortOrder}
                  onClick={() =>
                    onSortChange?.('tjm', sortKey === 'tjm' && sortOrder === 'asc' ? 'desc' : 'asc')
                  }
                />
              </Table.ColumnHeader>
              <Table.ColumnHeader w="10%">Skills</Table.ColumnHeader>
              <Table.ColumnHeader aria-sort={ariaSort('date')} w="8%" minW="8rem">
                <SortHeader
                  label="Date"
                  active={sortKey === 'date'}
                  order={sortOrder}
                  onClick={() =>
                    onSortChange?.(
                      'date',
                      sortKey === 'date' && sortOrder === 'asc' ? 'desc' : 'asc',
                    )
                  }
                />
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {data.map((it, idx) => (
              <Table.Row
                key={`${it.id}-${it.created_at ?? ''}-${idx}`}
                cursor="pointer"
                onClick={() => onSelect?.(it)}
                onKeyDown={(e: React.KeyboardEvent<HTMLTableRowElement>) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelect?.(it)
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Voir le détail: ${(it.title ?? it.slug ?? it.job_slug ?? 'offre').toString()}`}
                title="Afficher le détail"
                _hover={{ bg: 'neutral.50' }}
                _focusVisible={{
                  outline: '2px solid',
                  outlineColor: 'brand.500',
                  outlineOffset: '2px',
                }}
              >
                <Table.Cell>
                  <Text
                    as="span"
                    fontWeight="medium"
                    display="block"
                    maxW="100%"
                    whiteSpace="nowrap"
                    overflow="hidden"
                    textOverflow="ellipsis"
                  >
                    {it.title ?? it.slug ?? it.job_slug ?? '—'}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Text
                    as="span"
                    display="block"
                    maxW="100%"
                    whiteSpace="nowrap"
                    overflow="hidden"
                    textOverflow="ellipsis"
                  >
                    {it.company_name ?? '—'}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Text
                    as="span"
                    display="block"
                    maxW="100%"
                    whiteSpace="nowrap"
                    overflow="hidden"
                    textOverflow="ellipsis"
                  >
                    {it.city ?? '—'}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Text
                    as="span"
                    display="block"
                    maxW="100%"
                    whiteSpace="nowrap"
                    overflow="hidden"
                    textOverflow="ellipsis"
                  >
                    {formatExperience(it.experience)}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  {it.min_tjm || it.max_tjm ? (
                    <Text
                      as="span"
                      display="block"
                      maxW="100%"
                      whiteSpace="nowrap"
                      overflow="hidden"
                      textOverflow="ellipsis"
                    >
                      {new Intl.NumberFormat('fr-FR').format(it.min_tjm ?? it.max_tjm ?? 0)}
                      {it.max_tjm ? `–${new Intl.NumberFormat('fr-FR').format(it.max_tjm)}` : ''} €
                    </Text>
                  ) : (
                    '—'
                  )}
                </Table.Cell>
                <Table.Cell>
                  <Box maxW="100%" overflow="hidden">
                    <TagsList items={(it.skills ?? []).slice(0, 4)} colorPalette="brand" />
                  </Box>
                </Table.Cell>
                <Table.Cell whiteSpace="nowrap" minW="8rem">
                  <Text
                    as="span"
                    display="block"
                    maxW="100%"
                    whiteSpace="nowrap"
                    overflow="hidden"
                    textOverflow="ellipsis"
                  >
                    {formatDate(it.created_at)}
                  </Text>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>
    </Box>
  )
}
