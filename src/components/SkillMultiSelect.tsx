"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
    <div ref={containerRef} className="w-full">
      {/* Selected chips */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((s) => (
            <span key={s} className="inline-flex items-center gap-2 text-xs bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded">
              {s}
              <button
                type="button"
                className="text-gray-500 hover:text-red-600"
                onClick={() => removeSkill(s)}
                aria-label={`Retirer ${s}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input */}
      <input
        type="text"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:border-zinc-800"
      />

      {/* Suggestions dropdown */}
      {open && suggestions.length > 0 && (
        <div className="mt-1 max-h-56 overflow-auto rounded-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-900"
              onClick={() => addSkill(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
