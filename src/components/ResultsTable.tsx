"use client";

import { JobItem } from '@/lib/domain/types';

interface Props {
  items: JobItem[];
  total: number;
  onSelect?: (item: JobItem) => void;
}

export default function ResultsTable({ items, total, onSelect }: Props) {
  return (
    <div className="w-full">
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{total.toLocaleString()} résultats</div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-zinc-800">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-900">
            <tr>
              <th className="text-left px-3 py-2">Titre</th>
              <th className="text-left px-3 py-2">Entreprise</th>
              <th className="text-left px-3 py-2">Ville</th>
              <th className="text-left px-3 py-2">Exp.</th>
              <th className="text-left px-3 py-2">TJM</th>
              <th className="text-left px-3 py-2">Skills</th>
              <th className="text-left px-3 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr
                key={`${it.id}-${it.created_at ?? ''}-${idx}`}
                className="border-t border-gray-100 dark:border-zinc-800 hover:bg-gray-50/60 dark:hover:bg-zinc-900 cursor-pointer"
                onClick={() => onSelect?.(it)}
                title="Afficher le détail"
              >
                <td className="px-3 py-2">
                  <div className="font-medium">{it.title ?? it.slug ?? it.job_slug ?? '—'}</div>
                </td>
                <td className="px-3 py-2">{it.company_name ?? '—'}</td>
                <td className="px-3 py-2">{it.city ?? '—'}</td>
                <td className="px-3 py-2">{it.experience ?? '—'}</td>
                <td className="px-3 py-2">
                  {it.min_tjm || it.max_tjm ? (
                    <span>
                      {it.min_tjm ?? '—'}
                      {it.max_tjm ? `–${it.max_tjm}` : ''} €
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    {(it.skills ?? []).slice(0, 6).map((s, idx) => (
                      <span key={`${it.id}-${idx}-${s}`} className="text-xs bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                        {s}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-2">{it.created_at?.slice(0, 10) ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
