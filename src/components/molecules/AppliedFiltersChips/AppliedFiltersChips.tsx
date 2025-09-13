"use client";

import { JobFilters } from "@/lib/domain/types";
import RemovableChipsBar, { ChipItem } from "@/components/molecules/RemovableChipsBar/RemovableChipsBar";

interface Props {
  value: JobFilters;
  onChange: (next: JobFilters) => void;
  onClearAll?: () => void;
}

export default function AppliedFiltersChips({ value, onChange, onClearAll }: Props) {
  const items: ChipItem[] = [];

  // q
  if (value.q) {
    items.push({ id: `q:${value.q}`, label: `Texte: ${value.q}`, onRemove: () => onChange({ ...value, q: undefined }) });
  }

  // skills
  (value.skills ?? []).forEach((s) => {
    items.push({ id: `skill:${s}`, label: `Skill: ${s}`, onRemove: () => onChange({ ...value, skills: (value.skills ?? []).filter((x) => x !== s) }) });
  });

  // excludeSkills
  (value.excludeSkills ?? []).forEach((s) => {
    items.push({ id: `ex-skill:${s}`, label: `Exclure skill: ${s}`, onRemove: () => onChange({ ...value, excludeSkills: (value.excludeSkills ?? []).filter((x) => x !== s) }) });
  });

  // excludeTitle
  (value.excludeTitle ?? []).forEach((s) => {
    items.push({ id: `ex-title:${s}`, label: `Titre - ${s}`, onRemove: () => onChange({ ...value, excludeTitle: (value.excludeTitle ?? []).filter((x) => x !== s) }) });
  });

  // cities / regions
  (value.cities ?? []).forEach((c) => {
    items.push({ id: `city:${c}`, label: `Ville: ${c}`, onRemove: () => onChange({ ...value, cities: (value.cities ?? []).filter((x) => x !== c) }) });
  });
  (value.regions ?? []).forEach((r) => {
    items.push({ id: `region:${r}`, label: `Région: ${r}`, onRemove: () => onChange({ ...value, regions: (value.regions ?? []).filter((x) => x !== r) }) });
  });

  if (value.cityMatch === "exact") {
    items.push({ id: `cityMatch:exact`, label: `Ville: correspondance exacte`, onRemove: () => onChange({ ...value, cityMatch: undefined }) });
  }
  if (value.excludeCities) {
    items.push({ id: `flag:excludeCities`, label: `Exclure ces villes`, onRemove: () => onChange({ ...value, excludeCities: undefined }) });
  }
  if (value.excludeRegions) {
    items.push({ id: `flag:excludeRegions`, label: `Exclure ces régions`, onRemove: () => onChange({ ...value, excludeRegions: undefined }) });
  }

  // remote / experience
  (value.remote ?? []).forEach((r) => {
    items.push({ id: `remote:${r}`, label: `Remote: ${r}`, onRemove: () => onChange({ ...value, remote: (value.remote ?? []).filter((x) => x !== r) }) });
  });
  (value.experience ?? []).forEach((e) => {
    items.push({ id: `exp:${e}`, label: `Exp: ${e}`, onRemove: () => onChange({ ...value, experience: (value.experience ?? []).filter((x) => x !== e) }) });
  });

  // min/max TJM
  if (typeof value.minTjm === "number") {
    items.push({ id: `minTjm:${value.minTjm}`, label: `TJM ≥ ${value.minTjm} €`, onRemove: () => onChange({ ...value, minTjm: undefined }) });
  }
  if (typeof value.maxTjm === "number") {
    items.push({ id: `maxTjm:${value.maxTjm}`, label: `TJM ≤ ${value.maxTjm} €`, onRemove: () => onChange({ ...value, maxTjm: undefined }) });
  }

  // dates
  if (value.startDate) items.push({ id: `start:${value.startDate}`, label: `Début: ${value.startDate}`, onRemove: () => onChange({ ...value, startDate: undefined }) });
  if (value.endDate) items.push({ id: `end:${value.endDate}`, label: `Fin: ${value.endDate}`, onRemove: () => onChange({ ...value, endDate: undefined }) });

  // job_slugs
  (value.job_slugs ?? []).forEach((s) => {
    items.push({ id: `slug:${s}`, label: `Slug: ${s}`, onRemove: () => onChange({ ...value, job_slugs: (value.job_slugs ?? []).filter((x) => x !== s) }) });
  });

  return (
    <RemovableChipsBar items={items} onClearAll={onClearAll ?? (() => onChange({}))} />
  );
}
