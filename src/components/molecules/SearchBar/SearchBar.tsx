"use client";

import { useState, useEffect } from 'react';
import { useDebounce } from '@/lib/hooks/useDebounce';
import { Box, Input } from '@chakra-ui/react';

interface Props {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value = '', onChange, placeholder = 'Rechercher une offre, une techno, une ville, une entreprise…' }: Props) {
  const [text, setText] = useState<string>(value);
  const debounced = useDebounce(text, 400);

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
        size="sm"
        bg="white"
        shadow="sm"
        borderColor="neutral.200"
      />
    </Box>
  );
}

