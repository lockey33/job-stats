"use client";

interface Props {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, pageSize, pageCount, total, onPageChange }: Props) {
  return (
    <div className="flex items-center justify-between text-sm mt-3">
      <div className="text-gray-600 dark:text-gray-400">
        Page {page} / {pageCount} • {total.toLocaleString()} résultats
      </div>
      <div className="flex gap-2">
        <button
          className="px-3 py-1 rounded border border-gray-200 dark:border-zinc-800 disabled:opacity-50"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          Précédent
        </button>
        <button
          className="px-3 py-1 rounded border border-gray-200 dark:border-zinc-800 disabled:opacity-50"
          onClick={() => onPageChange(Math.min(pageCount, page + 1))}
          disabled={page >= pageCount}
        >
          Suivant
        </button>
      </div>
    </div>
  );
}
