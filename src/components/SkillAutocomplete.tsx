"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
    <div ref={ref} className="w-full">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:border-zinc-800"
        />
        {value && (
          <button type="button" onClick={clear} className="px-2 py-2 rounded border border-gray-200 dark:border-zinc-800 text-sm">
            Effacer
          </button>
        )}
      </div>
      {open && suggestions.length > 0 && (
        <div className="mt-1 max-h-56 overflow-auto rounded-md border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
          {suggestions.map((s) => (
            <button key={s} type="button" className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-900" onClick={() => pick(s)}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
