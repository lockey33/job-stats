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

import { HStack, Button, Text, Input } from '@chakra-ui/react'

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
    <HStack align="center" justify="space-between" mt="sm" fontSize="sm">
      <HStack gap="md" align="center">
        <Text color="gray.600" role="status" aria-live="polite">
          Résultats {start.toLocaleString()}–{end.toLocaleString()} sur {total.toLocaleString()}
        </Text>
        <HStack gap="xs" align="center">
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
        <HStack gap="xs" align="center">
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
      <HStack gap="sm" align="center">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          aria-label={`Page précédente, aller à ${Math.max(1, page - 1)}`}
        >
          Précédent
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onPageChange(Math.min(pageCount, page + 1))}
          disabled={page >= pageCount}
          aria-label={`Page suivante, aller à ${Math.min(pageCount, page + 1)}`}
        >
          Suivant
        </Button>
      </HStack>
    </HStack>
  )
}
