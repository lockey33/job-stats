"use client";

import { Box } from "@chakra-ui/react";

interface Props {
  items: string[];
  onSelect: (value: string) => void;
  overlay?: boolean; // absolute overlay positioned under an anchor
}

export default function SuggestionsList({ items, onSelect, overlay = false }: Props) {
  if (!items || items.length === 0) return null;
  return (
    <Box
      role="listbox"
      maxH="14rem"
      overflowY="auto"
      rounded="md"
      borderWidth="1px"
      bg="white"
      shadow="sm"
      position={overlay ? 'absolute' : 'static'}
      left={overlay ? 0 : undefined}
      right={overlay ? 0 : undefined}
      top={overlay ? 'calc(100% + 4px)' : undefined}
      zIndex={overlay ? 10 : undefined}
      mt={overlay ? undefined : 'sm'}
    >
      {items.map((s) => (
        <Box
          as="div"
          key={s}
          role="option"
          tabIndex={0}
          w="full"
          textAlign="left"
          px="sm"
          py="sm"
          fontSize="sm"
          _hover={{ bg: "neutral.50" }}
          _focusVisible={{ outline: '2px solid', outlineColor: 'brand.500', outlineOffset: '2px' }}
          onClick={() => onSelect(s)}
          onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelect(s);
            }
          }}
        >
          {s}
        </Box>
      ))}
    </Box>
  );
}
