"use client";

import { Box } from "@chakra-ui/react";

interface Props {
  items: string[];
  onSelect: (value: string) => void;
}

export default function SuggestionsList({ items, onSelect }: Props) {
  if (!items || items.length === 0) return null;
  return (
    <Box mt="sm" maxH="14rem" overflowY="auto" rounded="md" borderWidth="1px" bg="white" shadow="sm">
      {items.map((s) => (
        <Box
          as="button"
          key={s}
          w="full"
          textAlign="left"
          px="sm"
          py="sm"
          fontSize="sm"
          _hover={{ bg: "gray.50" }}
          onClick={() => onSelect(s)}
        >
          {s}
        </Box>
      ))}
    </Box>
  );
}
