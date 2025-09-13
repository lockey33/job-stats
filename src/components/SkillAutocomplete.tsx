"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Input, Button } from "@chakra-ui/react";

function norm(s: string) { return s.toLowerCase().trim(); }

interface Props {
  options: string[];
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}

export default function SkillAutocomplete({ options, value, onChange, placeholder = "Choisir un skill…" }: Props) {
  const [input, setInput] = useState<string>(value || "");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => setInput(value || ""), [value]);

  const opts = useMemo(() => options.map((o) => ({ raw: o, norm: norm(o) })), [options]);
  const inputNorm = norm(input);

  const suggestions = useMemo(() => {
    if (!inputNorm) return opts.slice(0, 12).map((o) => o.raw);
    return opts.filter((o) => o.norm.includes(inputNorm)).slice(0, 12).map((o) => o.raw);
  }, [opts, inputNorm]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  function pick(s: string) {
    onChange(s);
    setOpen(false);
  }

  function clear() {
    onChange("");
    setInput("");
  }

  return (
    <Box ref={ref} w="full">
      <Box display="flex" alignItems="center" gap={2}>
        <Input
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          size="sm"
        />
        {value && (
          <Button type="button" size="sm" variant="outline" onClick={clear}>
            Effacer
          </Button>
        )}
      </Box>
      {open && suggestions.length > 0 && (
        <Box mt={1} maxH="14rem" overflowY="auto" rounded="md" borderWidth="1px" bg="white" shadow="sm">
          {suggestions.map((s) => (
            <Box key={s} as="button" w="full" textAlign="left" px={3} py={2} fontSize="sm" _hover={{ bg: "gray.50" }} onClick={() => pick(s)}>
              {s}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
