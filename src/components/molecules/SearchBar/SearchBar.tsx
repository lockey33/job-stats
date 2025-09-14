"use client";

import { useState, useEffect } from 'react';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { Box, Input } from '@chakra-ui/react';

interface Props {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  delayMs?: number; // debounce delay
}

export default function SearchBar({ value = '', onChange, placeholder = 'Rechercher une offre, une techno, une ville, une entreprise…', delayMs = 400 }: Props) {
  const [text, setText] = useState<string>(value);
  // keep local state in sync when parent value changes (e.g., reset filters)
  useEffect(() => {
    setText(value || '');
  }, [value]);
  const debounced = useDebounce(text, delayMs);

  useEffect(() => {
    onChange?.(debounced);
  }, [debounced, onChange]);

  return (
    <Box w="full">
      <Input
        type="text"
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-label="Recherche"
        size="md"
        bg="white"
        shadow="sm"
        borderColor="neutral.200"
      />
    </Box>
  );
}
