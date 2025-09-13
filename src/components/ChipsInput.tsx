"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
    <div ref={containerRef} className="w-full">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((s) => (
            <span key={s} className="inline-flex items-center gap-2 text-xs bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded">
              {s}
              <button
                type="button"
                className="text-gray-500 hover:text-red-600"
                onClick={() => removeChip(s)}
                aria-label={`Retirer ${s}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:border-zinc-800"
      />
    </div>
  );
}
