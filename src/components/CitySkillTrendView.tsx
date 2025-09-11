"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { JobFilters, MetaFacets } from "@/lib/domain/types";
import { fetchCitySkillTrend } from "@/lib/utils/api";
import SkillAutocomplete from "@/components/SkillAutocomplete";
import CityMultiSelect from "@/components/CityMultiSelect";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

const COLORS = [
  '#2563eb', '#16a34a', '#dc2626', '#7c3aed', '#ea580c', '#0ea5e9', '#22c55e', '#e11d48', '#a855f7', '#f59e0b', '#14b8a6', '#9333ea'
];

interface Props {
  filters: JobFilters;
  meta: MetaFacets | null;
  defaultSkill?: string;
}

export default function CitySkillTrendView({ filters, meta, defaultSkill }: Props) {
  const [skill, setSkill] = useState<string>(defaultSkill || "");
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [useSelectedCities, setUseSelectedCities] = useState<boolean>(false);
  const [topCityCount, setTopCityCount] = useState<number>(5);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [months, setMonths] = useState<string[]>([]);
  const [seriesSkills, setSeriesCities] = useState<string[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  // Auto-fill default skill once when analytics suggested one
  useEffect(() => {
    if (!skill && defaultSkill) setSkill(defaultSkill);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultSkill]);

  const triggerFetch = useCallback(async () => {
    if (!skill) {
      setMonths([]);
      setSeriesCities([]);
      setChartData([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const payload = await fetchCitySkillTrend(
        filters,
        skill,
        useSelectedCities && selectedCities.length > 0 ? selectedCities : undefined,
        topCityCount,
      );
      // Transform into recharts format: [{month, CityA: n, CityB: m, ...}, ...]
      const cities = Object.keys(payload.citySeries);
      const map: Record<string, any> = {};
      for (const city of cities) {
        for (const pt of payload.citySeries[city]) {
          if (!map[pt.month]) map[pt.month] = { month: pt.month };
          map[pt.month][city] = pt.value;
        }
      }
      const data = Object.values(map).sort((a: any, b: any) => String(a.month).localeCompare(String(b.month)));
      setMonths(payload.months);
      setSeriesCities(cities);
      setChartData(data);
    } catch (e: any) {
      setError(e?.message ?? "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [filters, skill, selectedCities, useSelectedCities, topCityCount]);

  useEffect(() => {
    triggerFetch();
  }, [triggerFetch]);

  const cityOptions = useMemo(() => meta?.cities ?? [], [meta]);

  return (
    <div className="rounded-lg border border-gray-200 dark:border-zinc-800 p-4 space-y-4">
      <div className="flex items-end flex-col md:flex-row gap-4">
        <div className="w-full md:w-1/2">
          <label className="block text-sm font-medium mb-1">Skill</label>
          <SkillAutocomplete
            options={meta?.skills ?? []}
            value={skill}
            onChange={setSkill}
            placeholder="Choisir un skill à comparer entre les villes…"
          />
        </div>
        <div className="w-full md:w-1/2">
          <label className="block text-sm font-medium mb-1">Villes (facultatif)</label>
          <CityMultiSelect
            options={cityOptions}
            value={selectedCities}
            onChange={setSelectedCities}
            placeholder="Ajouter des villes précises (sinon Top N villes)"
          />
          <div className="flex items-center gap-4 mt-2 text-xs">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={useSelectedCities} onChange={(e) => setUseSelectedCities(e.target.checked)} />
              Utiliser uniquement ces villes
            </label>
            <label className="inline-flex items-center gap-2">
              Top N villes:
              <input
                type="number"
                min={1}
                max={12}
                value={topCityCount}
                onChange={(e) => setTopCityCount(Math.max(1, Math.min(12, Number(e.target.value) || 1)))}
                className="w-16 rounded border border-gray-200 dark:border-zinc-800 px-2 py-1"
              />
            </label>
          </div>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950 p-3 rounded">{error}</div>
      )}
      {loading && <div className="text-sm text-gray-600">Chargement…</div>}

      {chartData.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold mb-2">Skill « {skill} » par ville (par mois)</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                {seriesSkills.map((city, idx) => (
                  <Line key={city} type="monotone" dataKey={city} stroke={COLORS[idx % COLORS.length]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-600">Sélectionnez un skill pour afficher la comparaison par ville.</div>
      )}
    </div>
  );
}
