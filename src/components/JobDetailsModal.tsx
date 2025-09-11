"use client";

import { useEffect } from "react";
import { JobItem } from "@/lib/domain/types";
import { cityToRegion } from "@/lib/domain/regions";

interface Props {
  job: JobItem | null;
  onClose: () => void;
}

function formatTjm(min?: number | null, max?: number | null) {
  if (min == null && max == null) return "—";
  if (min != null && max != null) return `${min}–${max} €`;
  return `${min ?? max} €`;
}

function stripHtml(input?: string | null) {
  if (!input) return "";
  return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export default function JobDetailsModal({ job, onClose }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!job) return null;

  const region = cityToRegion(job.city ?? undefined) ?? "—";

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-start justify-center overflow-auto p-4">
        <div className="w-full max-w-3xl mt-8 rounded-lg bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 shadow-xl">
          <div className="flex items-start justify-between p-4 border-b border-gray-200 dark:border-zinc-800">
            <div>
              <h2 className="text-lg font-semibold">{job.title ?? job.slug ?? job.job_slug ?? "Offre"}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {job.company_name ?? "—"} • {job.city ?? "—"} ({region}) • {job.created_at?.slice(0,10) ?? "—"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="rounded px-2 py-1 text-sm border border-gray-200 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900"
            >
              ✕
            </button>
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 space-y-3">
              <div>
                <div className="text-xs uppercase text-gray-500">Entreprise</div>
                <div className="text-sm">{job.company_name ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-gray-500">Localisation</div>
                <div className="text-sm">{job.city ?? "—"}{region !== "—" ? ` • ${region}` : ""}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-gray-500">Télétravail</div>
                <div className="text-sm">{job.remote ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-gray-500">Expérience</div>
                <div className="text-sm">{job.experience ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-gray-500">TJM</div>
                <div className="text-sm">{formatTjm(job.min_tjm ?? undefined, job.max_tjm ?? undefined)}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-gray-500">Coordonnées</div>
                <div className="text-sm">{job.lat ?? "—"} / {job.long ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-gray-500">ID</div>
                <div className="text-sm">{job.id}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-gray-500">Skills</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(job.skills ?? []).map((s, i) => (
                    <span key={`${job.id}-skill-${i}`} className="text-xs bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{s}</span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase text-gray-500">Soft skills</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(job.soft_skills ?? []).map((s, i) => (
                    <span key={`${job.id}-soft-${i}`} className="text-xs bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded">{s}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <div>
                <div className="text-xs uppercase text-gray-500 mb-1">Description</div>
                <div className="text-sm whitespace-pre-line leading-relaxed">
                  {stripHtml(job.description) || "—"}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase text-gray-500 mb-1">Profil recherché</div>
                <div className="text-sm whitespace-pre-line leading-relaxed">
                  {stripHtml(job.candidate_profile) || "—"}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase text-gray-500 mb-1">À propos</div>
                <div className="text-sm whitespace-pre-line leading-relaxed">
                  {stripHtml(job.company_description) || "—"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
