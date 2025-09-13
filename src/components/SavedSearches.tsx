"use client";

import { useEffect, useMemo, useState } from "react";
import { JobFilters } from "@/lib/domain/types";
import { toQueryString } from "@/lib/utils/filters";

const STORAGE_KEY = "job-stats:saved-searches:v1";

export interface SavedSearchItem {
  id: string;
  name: string;
  filters: JobFilters;
  createdAt: string; // ISO
}

interface Props {
  currentFilters: JobFilters;
  onApply: (filters: JobFilters) => void;
  className?: string;
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function SavedSearches({ currentFilters, onApply, className }: Props) {
  const [items, setItems] = useState<SavedSearchItem[]>([]);
  const [name, setName] = useState("");

  // Load from storage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch (e) {
      console.warn("Failed to load saved searches", e);
    }
  }, []);

  // Persist to storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn("Failed to save searches", e);
    }
  }, [items]);

  const canSave = useMemo(() => name.trim().length > 0, [name]);

  function saveCurrent() {
    if (!canSave) return;
    const item: SavedSearchItem = {
      id: uid(),
      name: name.trim(),
      filters: { ...currentFilters },
      createdAt: new Date().toISOString(),
    };
    setItems((prev) => [item, ...prev]);
    setName("");
  }

  function applyItem(it: SavedSearchItem) {
    onApply({ ...it.filters });
  }

  function deleteItem(id: string) {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  async function copyLink(it: SavedSearchItem) {
    try {
      const qs = toQueryString({ ...it.filters, page: 1 });
      const url = `${window.location.origin}${window.location.pathname}?${qs}`;
      await navigator.clipboard.writeText(url);
    } catch (e) {
      console.warn("Clipboard copy failed", e);
    }
  }

  return (
    <div className={className}>
      <div className="rounded-lg border border-gray-200 dark:border-zinc-800 p-3 space-y-3">
        <div className="flex flex-col md:flex-row gap-2 md:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Nom de la recherche</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Paris + React + TJM > 600"
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:border-zinc-800"
            />
          </div>
          <button
            type="button"
            onClick={saveCurrent}
            disabled={!canSave}
            className="px-3 py-2 rounded-md text-sm bg-blue-600 text-white disabled:opacity-50"
            title="Enregistrer la recherche actuelle"
          >
            Enregistrer
          </button>
        </div>

        {items.length > 0 ? (
          <div className="space-y-2">
            <div className="text-xs text-gray-600 dark:text-gray-400">Favoris</div>
            <div className="flex flex-wrap gap-2">
              {items.map((it) => (
                <div key={it.id} className="inline-flex items-center gap-2 border rounded px-2 py-1 text-xs">
                  <button
                    type="button"
                    className="underline underline-offset-2"
                    title={`Appliquer: ${it.name}`}
                    onClick={() => applyItem(it)}
                  >
                    {it.name}
                  </button>
                  <button
                    type="button"
                    title="Copier le lien"
                    className="text-gray-500 hover:text-gray-800"
                    onClick={() => copyLink(it)}
                  >
                    🔗
                  </button>
                  <button
                    type="button"
                    title="Supprimer"
                    className="text-red-600 hover:text-red-800"
                    onClick={() => deleteItem(it.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-600">Aucune recherche enregistrée pour le moment.</div>
        )}
      </div>
    </div>
  );
}
