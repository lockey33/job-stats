"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Box, Input, Button, Tag } from "@chakra-ui/react";

function norm(s: string) {
  return s.toLowerCase().trim();
}

interface Props {
  options: string[]; // available skills
  value: string[]; // selected series skills
  onChange: (next: string[]) => void;
  topSkills?: string[]; // for reset button
}

export default function SkillSeriesControl({ options, value, onChange, topSkills }: Props) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedSet = useMemo(() => new Set(value.map(norm)), [value]);
  const optionsNorm = useMemo(() => options.map((o) => ({ raw: o, norm: norm(o) })), [options]);
  const inputNorm = norm(input);

  const suggestions = useMemo(() => {
    if (!inputNorm) {
      return optionsNorm
        .filter((o) => !selectedSet.has(o.norm))
        .slice(0, 12)
        .map((o) => o.raw);
    }
    return optionsNorm
      .filter((o) => !selectedSet.has(o.norm) && o.norm.includes(inputNorm))
      .slice(0, 12)
      .map((o) => o.raw);
  }, [optionsNorm, selectedSet, inputNorm]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  function addSkill(skill: string) {
    const skillNorm = norm(skill);
    if (selectedSet.has(skillNorm)) return;
    onChange([...value, skill]);
    setInput("");
    setOpen(false);
  }

  function removeSkill(skill: string) {
    const skillNorm = norm(skill);
    onChange(value.filter((v) => norm(v) !== skillNorm));
  }

  function resetTop() {
    if (!topSkills || topSkills.length === 0) return;
    onChange(topSkills);
  }

  return (
    <Box w="full" ref={containerRef}>
      <Box display="flex" flexDirection="column" gap={2}>
        {/* Selected skills chips */}
        {value.length > 0 && (
          <Box display="flex" flexWrap="wrap" gap={2}>
            {value.map((s) => (
              <Tag.Root key={s} size="sm">
                <Tag.Label>{s}</Tag.Label>
                <Tag.CloseTrigger aria-label={`Retirer ${s}`} onClick={() => removeSkill(s)} />
              </Tag.Root>
            ))}
          </Box>
        )}

        <Box display="flex" alignItems="center" gap={2}>
          <Input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Rechercher un skill à ajouter…"
            size="sm"
          />
          <Button
            onClick={resetTop}
            variant="outline"
            size="sm"
            disabled={!topSkills || topSkills.length === 0}
            title="Réinitialiser au Top 10"
          >
            Reset Top 10
          </Button>
        </Box>

        {open && suggestions.length > 0 && (
          <Box mt={1} maxH="14rem" overflowY="auto" rounded="md" borderWidth="1px" bg="white" shadow="sm">
            {suggestions.map((s) => (
              <Box
                as="button"
                key={s}
                w="full"
                textAlign="left"
                px={3}
                py={2}
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
    </Box>
  );
}
