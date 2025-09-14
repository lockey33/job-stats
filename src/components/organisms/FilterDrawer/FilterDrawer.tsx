"use client";

import { useCallback, useEffect, useState } from "react";
import { Drawer, Box, Button, Text, Stack } from "@chakra-ui/react";
import { CloseIcon } from "@/components/atoms/Icons/Icons";
import SearchBar from "@/components/molecules/SearchBar/SearchBar";
import FilterPanel from "@/components/organisms/FilterPanel/FilterPanel";
import type { JobFilters, MetaFacets } from "@/features/jobs/types/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  meta: MetaFacets | null;
  filters: JobFilters;
  onChange: (next: JobFilters) => void; // apply on Confirm
}

export default function FilterDrawer({ isOpen, onClose, meta, filters, onChange }: Props) {
  const [draft, setDraft] = useState<JobFilters>({ ...filters });

  useEffect(() => {
    if (isOpen) setDraft({ ...filters });
  }, [isOpen]);

  const updateDraft = useCallback((next: JobFilters) => { setDraft(next); }, []);
  const updateSearch = useCallback((q: string) => { setDraft((prev) => ({ ...prev, q: q || undefined })); }, []);
  function resetDraft() { setDraft({} as JobFilters); }
  function confirm() { onChange(draft); onClose(); }

  return (
    <Drawer.Root open={isOpen} placement="end" onOpenChange={(e) => { if (!e.open) onClose(); }}>
      <Drawer.Backdrop />
      <Drawer.Positioner>
        <Drawer.Content maxW={{ base: '100%', md: '28rem' }} position="relative">
          <Drawer.Header borderBottomWidth="1px" borderColor="border" py="sm" display="flex" alignItems="center" gap="sm">
            <Drawer.Title>Filtrer les résultats</Drawer.Title>
            <Drawer.CloseTrigger asChild>
              <Button size="sm" variant="ghost" aria-label="Fermer" px="2" position="absolute" top="1" right="2">
                <CloseIcon boxSize="1.1em" />
              </Button>
            </Drawer.CloseTrigger>
          </Drawer.Header>
          <Drawer.Body px="md" py="md">
            <Stack gap="sm">
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb="xs">Recherche</Text>
                <SearchBar value={draft.q} onChange={updateSearch} />
              </Box>
              <FilterPanel meta={meta} value={draft as JobFilters} onChange={updateDraft} compact showReset={false} />
            </Stack>
          </Drawer.Body>
          <Drawer.Footer borderTopWidth="1px" borderColor="border" py="sm">
            <Box display="flex" justifyContent="flex-end" w="full">
              <Button size="sm" variant="solid" colorPalette="brand" onClick={confirm}>Confirmer</Button>
            </Box>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer.Positioner>
    </Drawer.Root>
  );
}
