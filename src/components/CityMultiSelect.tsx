"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Input, Tag } from "@chakra-ui/react";

function normCity(s: string): string {
  const v = s.toLowerCase().replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
  return v;
}

interface Props {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  maxSuggestions?: number;
}

export default function CityMultiSelect({
  options,
  value,
  onChange,
  placeholder = "Ajouter une ville…",
  maxSuggestions = 12,
}: Props) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const normalizedOptions = useMemo(() => options.map((o) => ({ raw: o, norm: normCity(o) })), [options]);
  const selectedSet = useMemo(() => new Set(value), [value]);
  const inputNorm = normCity(input);

  const suggestions = useMemo(() => {
    if (!inputNorm) {
      // show top alphabetical options not selected
      return normalizedOptions
        .filter((o) => !selectedSet.has(o.raw))
        .slice(0, maxSuggestions)
        .map((o) => o.raw);
    }
    return normalizedOptions
      .filter((o) => !selectedSet.has(o.raw) && o.norm.includes(inputNorm))
      .slice(0, maxSuggestions)
      .map((o) => o.raw);
  }, [normalizedOptions, selectedSet, inputNorm, maxSuggestions]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  function addCity(city: string) {
    if (selectedSet.has(city)) return;
    onChange([...value, city]);
    setInput("");
    setOpen(false);
  }

  function removeCity(city: string) {
    onChange(value.filter((v) => v !== city));
  }

  return (
    <Box ref={containerRef} w="full">
      {/* Selected chips */}
      {value.length > 0 && (
        <Box display="flex" flexWrap="wrap" gap="sm" mb="sm">
          {value.map((c) => (
            <Tag.Root key={c} size="sm">
              <Tag.Label>{c}</Tag.Label>
              <Tag.CloseTrigger onClick={() => removeCity(c)} aria-label={`Retirer ${c}`} />
            </Tag.Root>
          ))}
        </Box>
      )}
      {/* Input */}
      <Input
        type="text"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        size="sm"
      />

      {/* Suggestions dropdown */}
      {open && suggestions.length > 0 && (
        <Box mt="sm" maxH="14rem" overflowY="auto" rounded="md" borderWidth="1px" bg="white" shadow="sm">
          {suggestions.map((s) => (
            <Box
              as="button"
              key={s}
              w="full"
              textAlign="left"
              px="sm"
              py="sm"
              fontSize="sm"
              _hover={{ bg: "gray.50" }}
              onClick={() => addCity(s)}
            >
              {s}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
