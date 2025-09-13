"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Input, Tag } from "@chakra-ui/react";

function norm(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  addOnBlur?: boolean;
}

export default function ChipsInput({ value, onChange, placeholder = "Ajouter…", addOnBlur = true }: Props) {
  const [input, setInput] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  const normSet = useMemo(() => new Set(value.map(norm)), [value]);

  function addChip(raw: string) {
    const n = norm(raw);
    if (!n) return;
    if (normSet.has(n)) {
      setInput("");
      return;
    }
    onChange([...value, raw.trim()]);
    setInput("");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addChip(input);
    } else if (e.key === "Backspace" && input === "" && value.length > 0) {
      // quick remove last chip
      const next = value.slice(0, -1);
      onChange(next);
    }
  }

  function removeChip(s: string) {
    const n = norm(s);
    onChange(value.filter((v) => norm(v) !== n));
  }

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        if (addOnBlur && input.trim()) addChip(input);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [input, addOnBlur]);

  return (
    <Box ref={containerRef} w="full">
      {value.length > 0 && (
        <Box display="flex" flexWrap="wrap" gap="sm" mb="sm">
          {value.map((s) => (
            <Tag.Root key={s} size="sm">
              <Tag.Label>{s}</Tag.Label>
              <Tag.CloseTrigger onClick={() => removeChip(s)} aria-label={`Retirer ${s}`} />
            </Tag.Root>
          ))}
        </Box>
      )}
      <Input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        size="sm"
      />
    </Box>
  );
}
