'use client'

import { Box, HStack, Tag, Text } from '@chakra-ui/react'

import type { JobItem } from '@/features/jobs/types/types'
import TagsList from '@/shared/ui/components/atoms/TagsList/TagsList'

interface Props {
  items: JobItem[]
  onSelect?: (item: JobItem) => void
}

function formatDate(input?: string | null): string {
  if (!input) return '—'
  const d = new Date(input)

  if (isNaN(d.getTime())) return '—'

  try {
    return new Intl.DateTimeFormat('fr-FR').format(d)
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

export default function ResultsListMobile({ items, onSelect }: Props) {
  if (!items || items.length === 0) return null

  return (
    <Box display="grid" gridTemplateColumns="1fr" gap="sm">
      {items.map((it, idx) => {
        const title = (it.title ?? it.slug ?? it.job_slug ?? '—').toString()
        const company = (it.company_name ?? '—').toString()
        const city = (it.city ?? '—').toString()
        const exp = formatExperience(it.experience)
        const date = formatDate(it.created_at)
        const tjmText = (() => {
          const fmt = new Intl.NumberFormat('fr-FR')
          const has = it.min_tjm || it.max_tjm

          if (!has) return '—'
          const left = fmt.format(it.min_tjm ?? it.max_tjm ?? 0)
          const right = it.max_tjm ? `–${fmt.format(it.max_tjm)}` : ''

          return `${left}${right} €`
        })()

        return (
          <Box
            key={`${it.id}-${it.created_at ?? ''}-${idx}`}
            role="button"
            tabIndex={0}
            onClick={() => onSelect?.(it)}
            onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect?.(it)
              }
            }}
            cursor="pointer"
            rounded="lg"
            borderWidth="1px"
            borderColor="border"
            bg="surface"
            shadow="sm"
            px="md"
            py="sm"
            _hover={{ bg: 'neutral.50', transform: 'translateY(-1px)' }}
            _active={{ transform: 'translateY(0)' }}
            transition="background 120ms ease, transform 120ms ease"
            _focusVisible={{
              outline: '2px solid',
              outlineColor: 'brand.500',
              outlineOffset: '2px',
            }}
          >
            <Text fontWeight="semibold" mb="1" lineClamp={2} title={title}>
              {title}
            </Text>
            <HStack gap="sm" wrap="wrap" mb="xs">
              <Tag.Root size="sm">
                <Tag.Label>{company}</Tag.Label>
              </Tag.Root>
              <Tag.Root size="sm">
                <Tag.Label>{city}</Tag.Label>
              </Tag.Root>
              {exp && exp !== '—' && (
                <Tag.Root size="sm">
                  <Tag.Label>{exp}</Tag.Label>
                </Tag.Root>
              )}
              <Tag.Root size="sm">
                <Tag.Label>{tjmText}</Tag.Label>
              </Tag.Root>
              <Tag.Root size="sm">
                <Tag.Label>{date}</Tag.Label>
              </Tag.Root>
            </HStack>
            <Box maxW="100%" overflow="hidden">
              <TagsList items={(it.skills ?? []).slice(0, 3)} size="sm" colorPalette="brand" />
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}
