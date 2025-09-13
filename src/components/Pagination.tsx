"use client";

interface Props {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
  onPageChange: (page: number) => void;
}

import { HStack, Button, Text } from '@chakra-ui/react';

export default function Pagination({ page, pageSize, pageCount, total, onPageChange }: Props) {
  return (
    <HStack align="center" justify="space-between" mt="sm" fontSize="sm">
      <Text color="gray.600">
        Page {page} / {pageCount} • {total.toLocaleString()} résultats
      </Text>
      <HStack gap="sm">
        <Button size="sm" variant="outline" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1}>
          Précédent
        </Button>
        <Button size="sm" variant="outline" onClick={() => onPageChange(Math.min(pageCount, page + 1))} disabled={page >= pageCount}>
          Suivant
        </Button>
      </HStack>
    </HStack>
  );
}
