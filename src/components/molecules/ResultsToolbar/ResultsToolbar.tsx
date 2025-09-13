"use client";

import { Button, HStack, Text } from "@chakra-ui/react";

interface Props {
  total?: number;
  exporting?: boolean;
  onExportCurrentPage: () => void;
  onExportAllFiltered: () => void;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
}

export default function ResultsToolbar({
  total,
  exporting = false,
  onExportCurrentPage,
  onExportAllFiltered,
  leftSlot,
  rightSlot,
}: Props) {
  const fmt = new Intl.NumberFormat("fr-FR");
  return (
    <HStack as="section" justify="space-between" align="center" w="full" py="sm">
      <HStack gap="sm">
        {typeof total === "number" && (
          <Text fontSize="sm" color="gray.700" aria-live="polite">{fmt.format(total)} résultats</Text>
        )}
        {leftSlot}
      </HStack>
      <HStack gap="sm">
        {rightSlot}
        <Button size="sm" variant="outline" colorPalette="brand" onClick={onExportCurrentPage} disabled={exporting} title="Exporter la page courante en Excel">
          Exporter (page)
        </Button>
        <Button size="sm" variant="solid" colorPalette="brand" onClick={onExportAllFiltered} disabled={exporting} title="Exporter tous les résultats filtrés en Excel">
          Exporter (tous)
        </Button>
      </HStack>
    </HStack>
  );
}

