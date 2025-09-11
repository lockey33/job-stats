"use client";

import { useState, useEffect } from 'react';
import { useDebounce } from '@/lib/hooks/useDebounce';

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
    <div className="w-full">
      <input
        type="text"
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:border-zinc-800"
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
    </div>
  );
}
