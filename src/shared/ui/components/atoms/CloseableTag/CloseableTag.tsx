'use client'

import { Tag } from '@chakra-ui/react'
import type { ComponentProps } from 'react'

type TagRootProps = ComponentProps<typeof Tag.Root>

interface Props {
  children: React.ReactNode
  onClose: () => void
  size?: TagRootProps['size']
  variant?: TagRootProps['variant']
  colorPalette?: TagRootProps['colorPalette']
  closeAriaLabel?: string
}

export default function CloseableTag({
  children,
  onClose,
  size = 'sm',
  variant,
  colorPalette,
  closeAriaLabel,
}: Props) {
  return (
    <Tag.Root size={size} variant={variant} colorPalette={colorPalette}>
      <Tag.Label>{children}</Tag.Label>
      <Tag.CloseTrigger aria-label={closeAriaLabel ?? 'Retirer'} onClick={onClose} />
    </Tag.Root>
  )
}
