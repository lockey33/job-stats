'use client'

import type { JobFilters } from '@/features/jobs/types/types'
import type { ChipItem } from '@/shared/ui/components/molecules/RemovableChipsBar/RemovableChipsBar'
import RemovableChipsBar from '@/shared/ui/components/molecules/RemovableChipsBar/RemovableChipsBar'

interface Props {
  value: JobFilters
  onChange: (next: JobFilters) => void
  onClearAll?: () => void
}

export default function AppliedFiltersChips({ value, onChange, onClearAll }: Props) {
  function unset<K extends keyof JobFilters>(key: K) {
    const next = { ...value } as JobFilters & Record<string, unknown>
    delete next[key as string]
    onChange(next as JobFilters)
  }
  const items: ChipItem[] = []

  // q
  if (value.q) {
    items.push({
      id: `q:${value.q}`,
      label: `Texte: ${value.q}`,
      onRemove: () => unset('q'),
    })
  }

  // skills
  for (const s of (value.skills ?? []) as string[]) {
    items.push({
      id: `skill:${s}`,
      label: `Skill: ${s}`,
      onRemove: () => onChange({ ...value, skills: (value.skills ?? []).filter((x) => x !== s) }),
    })
  }

  // excludeSkills
  for (const s of (value.excludeSkills ?? []) as string[]) {
    items.push({
      id: `ex-skill:${s}`,
      label: `Exclure skill: ${s}`,
      onRemove: () =>
        onChange({ ...value, excludeSkills: (value.excludeSkills ?? []).filter((x) => x !== s) }),
    })
  }

  // excludeTitle
  for (const s of (value.excludeTitle ?? []) as string[]) {
    items.push({
      id: `ex-title:${s}`,
      label: `Titre - ${s}`,
      onRemove: () =>
        onChange({ ...value, excludeTitle: (value.excludeTitle ?? []).filter((x) => x !== s) }),
    })
  }

  // cities / regions
  for (const c of (value.cities ?? []) as string[]) {
    items.push({
      id: `city:${c}`,
      label: `Ville: ${c}`,
      onRemove: () => onChange({ ...value, cities: (value.cities ?? []).filter((x) => x !== c) }),
    })
  }
  for (const r of (value.regions ?? []) as string[]) {
    items.push({
      id: `region:${r}`,
      label: `Région: ${r}`,
      onRemove: () => onChange({ ...value, regions: (value.regions ?? []).filter((x) => x !== r) }),
    })
  }

  if (value.cityMatch === 'exact') {
    items.push({
      id: `cityMatch:exact`,
      label: `Ville: correspondance exacte`,
      onRemove: () => unset('cityMatch'),
    })
  }
  if (value.excludeCities) {
    items.push({
      id: `flag:excludeCities`,
      label: `Exclure ces villes`,
      onRemove: () => unset('excludeCities'),
    })
  }
  if (value.excludeRegions) {
    items.push({
      id: `flag:excludeRegions`,
      label: `Exclure ces régions`,
      onRemove: () => unset('excludeRegions'),
    })
  }

  // remote / experience
  for (const r of (value.remote ?? []) as string[]) {
    items.push({
      id: `remote:${r}`,
      label: `Remote: ${r}`,
      onRemove: () => onChange({ ...value, remote: (value.remote ?? []).filter((x) => x !== r) }),
    })
  }
  for (const e of (value.experience ?? []) as string[]) {
    items.push({
      id: `exp:${e}`,
      label: `Exp: ${e}`,
      onRemove: () =>
        onChange({ ...value, experience: (value.experience ?? []).filter((x) => x !== e) }),
    })
  }

  // min/max TJM
  if (typeof value.minTjm === 'number') {
    items.push({
      id: `minTjm:${value.minTjm}`,
      label: `TJM ≥ ${value.minTjm} €`,
      onRemove: () => unset('minTjm'),
    })
  }
  if (typeof value.maxTjm === 'number') {
    items.push({
      id: `maxTjm:${value.maxTjm}`,
      label: `TJM ≤ ${value.maxTjm} €`,
      onRemove: () => unset('maxTjm'),
    })
  }

  // dates
  if (value.startDate)
    items.push({
      id: `start:${value.startDate}`,
      label: `Début: ${value.startDate}`,
      onRemove: () => unset('startDate'),
    })
  if (value.endDate)
    items.push({
      id: `end:${value.endDate}`,
      label: `Fin: ${value.endDate}`,
      onRemove: () => unset('endDate'),
    })

  // job_slugs
  for (const s of (value.job_slugs ?? []) as string[]) {
    items.push({
      id: `slug:${s}`,
      label: `Slug: ${s}`,
      onRemove: () =>
        onChange({ ...value, job_slugs: (value.job_slugs ?? []).filter((x) => x !== s) }),
    })
  }

  return (
    <RemovableChipsBar
      items={items}
      onClearAll={onClearAll ?? (() => onChange({} as JobFilters))}
    />
  )
}
