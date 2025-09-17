'use client'

import { Box, Button, HStack, Text, Menu } from '@chakra-ui/react'

import { DownloadIcon } from '@/components/atoms/Icons/Icons'

interface Props {
  total?: number
  exporting?: boolean
  onExportCurrentPage: () => void
  onExportAllFiltered: () => void
  leftSlot?: React.ReactNode
  rightSlot?: React.ReactNode
  rightActionLabel?: string
  onRightAction?: () => void
}

export default function ResultsToolbar({
  total,
  exporting = false,
  onExportCurrentPage,
  onExportAllFiltered,
  leftSlot,
  rightSlot,
  rightActionLabel,
  onRightAction,
}: Props) {
  const fmt = new Intl.NumberFormat('fr-FR')
  return (
    <Box as="section" w="full" py="sm">
      {/* Mobile: 2 buttons (Filtrer + Actions) and the count on the same line */}
      <HStack display={{ base: 'flex', md: 'none' }} justify="space-between" align="center" w="full">
        <HStack gap="sm" align="center">
          {leftSlot}
          <Menu.Root positioning={{ placement: 'bottom-start' }}>
            <Menu.Trigger asChild>
              <Button size="sm" variant="outline" aria-label="Autres actions" title="Autres actions">
                Actions
              </Button>
            </Menu.Trigger>
            <Menu.Positioner>
              <Menu.Content minW="14rem" borderWidth="1px" borderColor="border" bg="surface" shadow="md" rounded="md" p="xs">
                {/* Saved searches / favorites */}
                {onRightAction && rightActionLabel ? (
                  <Menu.Item onClick={onRightAction} value="saved">
                    <Text>{rightActionLabel}</Text>
                  </Menu.Item>
                ) : (
                  rightSlot && (
                    <Menu.Item asChild value="saved">
                      {rightSlot}
                    </Menu.Item>
                  )
                )}
                <Menu.Separator />
                <Menu.Item onClick={onExportCurrentPage} value="export-page">
                  <Text>Exporter (page)</Text>
                </Menu.Item>
                <Menu.Item onClick={onExportAllFiltered} value="export-all">
                  <Text>Exporter (tous)</Text>
                </Menu.Item>
              </Menu.Content>
            </Menu.Positioner>
          </Menu.Root>
        </HStack>
        {typeof total === 'number' && (
          <Text fontSize="sm" color="gray.700" aria-live="polite">
            {fmt.format(total)} résultats
          </Text>
        )}
      </HStack>

      {/* Desktop: split layout with count on the right */}
      <HStack
        display={{ base: 'none', md: 'flex' }}
        justify="space-between"
        align="center"
        w="full"
        gap="md"
      >
        <HStack gap="sm">{leftSlot}</HStack>
        <HStack gap="sm" align="center">
          {rightSlot}

          <Button
            size="md"
            variant="outline"
            colorPalette="brand"
            onClick={onExportCurrentPage}
            disabled={exporting}
            aria-label="Exporter la page courante en Excel"
            title="Exporter la page courante en Excel"
          >
            <DownloadIcon boxSize="1.25em" />
            <Box as="span" display={{ base: 'none', md: 'inline' }}>
              Exporter (page)
            </Box>
          </Button>

          <Button
            size="md"
            variant="solid"
            colorPalette="brand"
            onClick={onExportAllFiltered}
            disabled={exporting}
            aria-label="Exporter tous les résultats filtrés en Excel"
            title="Exporter tous les résultats filtrés en Excel"
          >
            <DownloadIcon boxSize="1.25em" />
            <Box as="span" display={{ base: 'none', md: 'inline' }}>
              Exporter (tous)
            </Box>
          </Button>

          {typeof total === 'number' && (
            <Text fontSize="sm" color="gray.700" aria-live="polite" ml="sm">
              {fmt.format(total)} résultats
            </Text>
          )}
        </HStack>
      </HStack>
    </Box>
  )
}
