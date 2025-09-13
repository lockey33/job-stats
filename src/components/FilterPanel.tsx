"use client";

import { useEffect, useMemo, useState } from 'react';
import { JobFilters, MetaFacets } from '@/lib/domain/types';
import CityMultiSelect from '@/components/CityMultiSelect';
import SkillMultiSelect from '@/components/SkillMultiSelect';
import ChipsInput from '@/components/ChipsInput';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface FilterPanelProps {
  meta: MetaFacets | null;
  value: JobFilters;
  onChange: (filters: JobFilters) => void;
}

function parseCSV(input: string): string[] {
  return input
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function FilterPanel({ meta, value, onChange }: FilterPanelProps) {
  const [skillsText, setSkillsText] = useState<string>((value.skills ?? []).join(', '));
  
  const [citiesText, setCitiesText] = useState<string>((value.cities ?? []).join(', '));
  const [jobSlugsText, setJobSlugsText] = useState<string>((value.job_slugs ?? []).join(', '));

  useEffect(() => {
    setSkillsText((value.skills ?? []).join(', '));
    
    setCitiesText((value.cities ?? []).join(', '));
    setJobSlugsText((value.job_slugs ?? []).join(', '));
  }, [value.skills, value.cities, value.job_slugs]);

  const remoteOptions = useMemo(() => meta?.remote ?? ['full', 'partial', 'none'], [meta]);
  const expOptions = useMemo(() => meta?.experience ?? ['junior', 'intermediate', 'senior'], [meta]);
  const cityOptions = useMemo(() => meta?.cities ?? [], [meta]);
  const regionOptions = useMemo(() => meta?.regions ?? [], [meta]);

  const update = (patch: Partial<JobFilters>) => onChange({ ...value, ...patch });

  // Helpers to convert between YYYY-MM-DD and Date for the datepicker
  function ymdToDate(ymd?: string): Date | null {
    if (!ymd) return null;
    const parts = ymd.split('-').map((n) => Number(n));
    if (parts.length !== 3) return null;
    const [y, m, d] = parts;
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  }

  function dateToYmd(d: Date | null | undefined): string | undefined {
    return d ? format(d, 'yyyy-MM-dd') : undefined;
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-zinc-800 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium">Skills</label>
        <SkillMultiSelect
          options={meta?.skills ?? []}
          value={value.skills ?? []}
          onChange={(skills) => update({ skills })}
          placeholder="Ajouter des skills…"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Skills à exclure</label>
        <SkillMultiSelect
          options={meta?.skills ?? []}
          value={value.excludeSkills ?? []}
          onChange={(excludeSkills) => update({ excludeSkills })}
          placeholder="Tapez pour exclure des skills…"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Mots-clés à exclure (dans le titre)</label>
        <ChipsInput
          value={value.excludeTitle ?? []}
          onChange={(excludeTitle) => update({ excludeTitle })}
          placeholder="ex: alternance, stage, junior"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Villes</label>
        <CityMultiSelect
          options={cityOptions}
          value={value.cities ?? []}
          onChange={(cities) => update({ cities })}
          placeholder="Tapez pour rechercher une ville..."
        />
        <div className="pt-1 flex items-center gap-4">
          <label className="inline-flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={(value.cityMatch ?? 'contains') === 'exact'}
              onChange={(e) => update({ cityMatch: e.target.checked ? 'exact' : 'contains' })}
            />
            Correspondance exacte
          </label>
          <label className="inline-flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={!!value.excludeCities}
              onChange={(e) => update({ excludeCities: e.target.checked })}
            />
            Exclure ces villes
          </label>
        </div>
      </div>

      {/* Regions */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Régions</label>
        <CityMultiSelect
          options={regionOptions}
          value={value.regions ?? []}
          onChange={(regions) => update({ regions })}
          placeholder="Tapez pour rechercher une région..."
        />
        <div className="pt-1 flex items-center gap-4">
          <label className="inline-flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={!!value.excludeRegions}
              onChange={(e) => update({ excludeRegions: e.target.checked })}
            />
            Exclure ces régions
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Job slugs (séparés par des virgules)</label>
        <input
          type="text"
          value={jobSlugsText}
          onChange={(e) => setJobSlugsText(e.target.value)}
          onBlur={() => update({ job_slugs: parseCSV(jobSlugsText) })}
          placeholder="ex: developpeur-front-end-javascript-node-react-angular-vue"
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:border-zinc-800"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Télétravail</label>
        <div className="flex flex-wrap gap-2">
          {remoteOptions.map((r) => {
            const checked = (value.remote ?? []).includes(r);
            return (
              <label key={r} className="inline-flex items-center gap-2 text-sm border rounded-md px-2 py-1">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    const cur = new Set(value.remote ?? []);
                    if (e.target.checked) cur.add(r);
                    else cur.delete(r);
                    update({ remote: Array.from(cur) });
                  }}
                />
                {r}
              </label>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Expérience</label>
        <div className="flex flex-wrap gap-2">
          {expOptions.map((exp) => {
            const checked = (value.experience ?? []).includes(exp);
            return (
              <label key={exp} className="inline-flex items-center gap-2 text-sm border rounded-md px-2 py-1">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    const cur = new Set(value.experience ?? []);
                    if (e.target.checked) cur.add(exp);
                    else cur.delete(exp);
                    update({ experience: Array.from(cur) });
                  }}
                />
                {exp}
              </label>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">TJM min</label>
        <input
          type="number"
          value={value.minTjm ?? ''}
          onChange={(e) => update({ minTjm: e.target.value ? Number(e.target.value) : undefined })}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:border-zinc-800"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">TJM max</label>
        <input
          type="number"
          value={value.maxTjm ?? ''}
          onChange={(e) => update({ maxTjm: e.target.value ? Number(e.target.value) : undefined })}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:border-zinc-800"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Date de début</label>
        <DatePicker
          selected={ymdToDate(value.startDate)}
          onChange={(d: Date | null) => update({ startDate: dateToYmd(d) })}
          dateFormat="yyyy-MM-dd"
          placeholderText="Choisir une date"
          isClearable
          maxDate={ymdToDate(value.endDate) ?? undefined}
          selectsStart
          startDate={ymdToDate(value.startDate) ?? undefined}
          endDate={ymdToDate(value.endDate) ?? undefined}
          todayButton="Aujourd’hui"
          locale={fr}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:border-zinc-800"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Date de fin</label>
        <DatePicker
          selected={ymdToDate(value.endDate)}
          onChange={(d: Date | null) => update({ endDate: dateToYmd(d) })}
          dateFormat="yyyy-MM-dd"
          placeholderText="Choisir une date"
          isClearable
          minDate={ymdToDate(value.startDate) ?? undefined}
          selectsEnd
          startDate={ymdToDate(value.startDate) ?? undefined}
          endDate={ymdToDate(value.endDate) ?? undefined}
          todayButton="Aujourd’hui"
          locale={fr}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-zinc-900 dark:border-zinc-800"
        />
      </div>
    </div>
  );
}
