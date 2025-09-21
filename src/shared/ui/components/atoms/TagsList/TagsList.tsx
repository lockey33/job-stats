'use client'

import { Box, Tag } from '@chakra-ui/react'
import type { ComponentProps } from 'react'

type TagRootProps = ComponentProps<typeof Tag.Root>

interface Props {
  items: string[]
  gap?: string | number
  size?: TagRootProps['size']
  variant?: TagRootProps['variant']
  colorPalette?: TagRootProps['colorPalette']
  closable?: boolean
  onRemove?: (item: string) => void
}

export default function TagsList({
  items,
  gap = 'xs',
  size = 'sm',
  variant = 'subtle',
  colorPalette,
  closable = false,
  onRemove,
}: Props) {
  if (!items || items.length === 0) return null

  return (
    <Box display="flex" flexWrap="wrap" gap={gap}>
      {items.map((s, idx) => (
        <Tag.Root key={`${idx}-${s}`} size={size} variant={variant} colorPalette={colorPalette}>
          <Tag.Label>{s}</Tag.Label>
          {closable && onRemove && (
            <Tag.CloseTrigger aria-label={`Retirer ${s}`} onClick={() => onRemove(s)} />
          )}
        </Tag.Root>
      ))}
    </Box>
  )
}
