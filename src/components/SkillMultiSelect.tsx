"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Input, Tag } from "@chakra-ui/react";

function norm(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

interface Props {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  maxSuggestions?: number;
}

export default function SkillMultiSelect({
  options,
  value,
  onChange,
  placeholder = "Ajouter un skill…",
  maxSuggestions = 12,
}: Props) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const normalizedOptions = useMemo(() => options.map((o) => ({ raw: o, norm: norm(o) })), [options]);
  const selectedSet = useMemo(() => new Set(value.map(norm)), [value]);
  const inputNorm = norm(input);

  const suggestions = useMemo(() => {
    if (!inputNorm) {
      return normalizedOptions
        .filter((o) => !selectedSet.has(o.norm))
        .slice(0, maxSuggestions)
        .map((o) => o.raw);
    }
    return normalizedOptions
      .filter((o) => !selectedSet.has(o.norm) && o.norm.includes(inputNorm))
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

  function addSkill(skill: string) {
    const n = norm(skill);
    if (selectedSet.has(n)) return;
    onChange([...value, skill]);
    setInput("");
    setOpen(false);
  }

  function removeSkill(skill: string) {
    const n = norm(skill);
    onChange(value.filter((v) => norm(v) !== n));
  }

  return (
    <Box ref={containerRef} w="full">
      {/* Selected chips */}
      {value.length > 0 && (
        <Box display="flex" flexWrap="wrap" gap="sm" mb="sm">
          {value.map((s) => (
            <Tag.Root key={s} size="sm">
              <Tag.Label>{s}</Tag.Label>
              <Tag.CloseTrigger onClick={() => removeSkill(s)} aria-label={`Retirer ${s}`} />
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
              onClick={() => addSkill(s)}
            >
              {s}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
