"use client";

import { Button, HStack, Text } from "@chakra-ui/react";
import { DownloadIcon } from "@/components/atoms/Icons/Icons";

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
        {leftSlot}
      </HStack>
      <HStack gap="sm" align="center">
        {rightSlot}
        <Button size="md" variant="outline" colorPalette="brand" onClick={onExportCurrentPage} disabled={exporting} title="Exporter la page courante en Excel">
          <DownloadIcon boxSize="1.25em" />
          Exporter (page)
        </Button>
        <Button size="md" variant="solid" colorPalette="brand" onClick={onExportAllFiltered} disabled={exporting} title="Exporter tous les résultats filtrés en Excel">
          <DownloadIcon boxSize="1.25em" />
          Exporter (tous)
        </Button>
        {typeof total === "number" && (
          <Text fontSize="sm" color="gray.700" aria-live="polite" ml="sm">{fmt.format(total)} résultats</Text>
        )}
      </HStack>
    </HStack>
  );
}
