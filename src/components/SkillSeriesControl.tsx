"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
    <div className="w-full" ref={containerRef}>
      <div className="flex flex-col gap-2">
        {/* Selected skills chips */}
        {value.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {value.map((s) => (
              <span key={s} className="inline-flex items-center gap-2 text-xs bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded">
                {s}
                <button
                  type="button"
                  aria-label={`Retirer ${s}`}
                  className="text-gray-500 hover:text-red-600"
                  onClick={() => removeSkill(s)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Rechercher un skill à ajouter…"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:border-zinc-800"
          />
          <button
            type="button"
            onClick={resetTop}
            className="whitespace-nowrap px-3 py-2 rounded border border-gray-200 dark:border-zinc-800 text-sm"
            disabled={!topSkills || topSkills.length === 0}
            title="Réinitialiser au Top 10"
          >
            Reset Top 10
          </button>
        </div>

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
    </div>
  );
}
