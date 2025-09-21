'use client'

import { Box, Button, HStack } from '@chakra-ui/react'

import CloseableTag from '@/shared/ui/components/atoms/CloseableTag/CloseableTag'

export interface ChipItem {
  id: string
  label: string
  onRemove: () => void
}

interface Props {
  items: ChipItem[]
  onClearAll?: () => void
  clearLabel?: string
}

export default function RemovableChipsBar({
  items,
  onClearAll,
  clearLabel = 'Tout effacer',
}: Props) {
  if (!items || items.length === 0) return null

  return (
    <HStack justify="space-between" align="center" wrap="wrap" gap="sm" py="xs">
      <Box display="flex" flexWrap="wrap" gap="sm">
        {items.map((it) => (
          <CloseableTag key={it.id} onClose={it.onRemove} variant="subtle">
            {it.label}
          </CloseableTag>
        ))}
      </Box>
      {onClearAll && (
        <Button size="xs" variant="ghost" colorPalette="gray" onClick={onClearAll}>
          {clearLabel}
        </Button>
      )}
    </HStack>
  )
}
