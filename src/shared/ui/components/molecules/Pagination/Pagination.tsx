'use client'

interface Props {
  page: number
  pageSize: number
  pageCount: number
  total: number
  onPageChange: (page: number) => void
  pageSizeOptions?: number[]
  onPageSizeChange?: (size: number) => void
}

import { Box, Button, HStack, Input, Text } from '@chakra-ui/react'

export default function Pagination({
  page,
  pageSize,
  pageCount,
  total,
  onPageChange,
  pageSizeOptions = [10, 20, 50],
  onPageSizeChange,
}: Props) {
  const start = (page - 1) * pageSize + 1
  const end = Math.min(total, page * pageSize)

  return (
    <Box
      role="navigation"
      aria-label="Pagination"
      display="flex"
      flexDirection={{ base: 'column', md: 'row' }}
      gap={{ base: 'sm', md: 'md' }}
      alignItems={{ base: 'stretch', md: 'center' }}
      justifyContent="space-between"
      mt="sm"
      fontSize="sm"
    >
      <HStack gap="md" align="center" justify="flex-start" wrap="wrap">
        <Text color="gray.600" role="status" aria-live="polite">
          Résultats {start.toLocaleString()}–{end.toLocaleString()} sur {total.toLocaleString()}
        </Text>

        {/* Page size options: visible from md and up */}
        <HStack gap="xs" align="center" display={{ base: 'none', md: 'flex' }}>
          <Text color="gray.600">Par page</Text>
          <HStack gap="xs">
            {pageSizeOptions.map((opt) => {
              const active = pageSize === opt

              return (
                <Button
                  key={opt}
                  size="xs"
                  variant={active ? 'solid' : 'outline'}
                  onClick={() => onPageSizeChange?.(opt)}
                >
                  {opt}
                </Button>
              )
            })}
          </HStack>
        </HStack>

        {/* Jump to page: visible from md and up */}
        <HStack gap="xs" align="center" display={{ base: 'none', md: 'flex' }}>
          <Text color="gray.600">Aller à</Text>
          <Input
            aria-label="Aller à la page"
            size="sm"
            type="number"
            min={1}
            max={pageCount}
            w="4.5rem"
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                const val = Number((e.target as HTMLInputElement).value)

                if (!isNaN(val)) onPageChange(Math.max(1, Math.min(pageCount, val)))
              }
            }}
          />
        </HStack>
      </HStack>

      {/* Prev / Next controls */}
      <HStack gap="sm" align="center" justify="flex-end" wrap="wrap">
        {/* Mobile page indicator */}
        <Text display={{ base: 'inline', md: 'none' }} color="gray.700">
          Page {page} / {pageCount}
        </Text>
        <Button
          size={{ base: 'sm', md: 'sm' }}
          variant="outline"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          aria-label={`Page précédente, aller à ${Math.max(1, page - 1)}`}
        >
          Précédent
        </Button>
        <Button
          size={{ base: 'sm', md: 'sm' }}
          variant="outline"
          onClick={() => onPageChange(Math.min(pageCount, page + 1))}
          disabled={page >= pageCount}
          aria-label={`Page suivante, aller à ${Math.min(pageCount, page + 1)}`}
        >
          Suivant
        </Button>
      </HStack>
    </Box>
  )
}
