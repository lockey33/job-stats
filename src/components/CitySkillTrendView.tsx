"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { JobFilters, MetaFacets } from "@/lib/domain/types";
import { fetchCitySkillTrend } from "@/lib/utils/api";
import SkillAutocomplete from "@/components/SkillAutocomplete";
import CityMultiSelect from "@/components/CityMultiSelect";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Box, Text, Input, Checkbox, Alert } from "@chakra-ui/react";

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
    <Box rounded="lg" borderWidth="0px" p={0} bg="transparent" shadow="none" display="flex" flexDirection="column" gap="md">
      <Box display="flex" flexDirection={{ base: 'column', md: 'row' }} gap="md" alignItems={{ md: 'flex-end' }}>
        <Box flex={{ base: 'unset', md: 1 }} w="full">
          <Text fontSize="sm" fontWeight="medium" mb="xs">Skill</Text>
          <SkillAutocomplete
            options={meta?.skills ?? []}
            value={skill}
            onChange={setSkill}
            placeholder="Choisir un skill à comparer entre les villes…"
          />
        </Box>
        <Box flex={{ base: 'unset', md: 1 }} w="full">
          <Text fontSize="sm" fontWeight="medium" mb="xs">Villes (facultatif)</Text>
          <CityMultiSelect
            options={cityOptions}
            value={selectedCities}
            onChange={setSelectedCities}
            placeholder="Ajouter des villes précises (sinon Top N villes)"
          />
          <Box display="flex" alignItems="center" gap="md" mt="sm" fontSize="xs">
            <Checkbox.Root checked={useSelectedCities} onCheckedChange={(d: any) => setUseSelectedCities(!!d.checked)}>
              <Checkbox.HiddenInput />
              <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
              <Checkbox.Label>Utiliser uniquement ces villes</Checkbox.Label>
            </Checkbox.Root>
            <Box display="inline-flex" alignItems="center" gap="sm">
              <Text>Top N villes:</Text>
              <Input
                type="number"
                min={1}
                max={12}
                value={topCityCount}
                onChange={(e) => setTopCityCount(Math.max(1, Math.min(12, Number(e.target.value) || 1)))}
                size="sm"
                w="4rem"
              />
            </Box>
          </Box>
        </Box>
      </Box>

      {error && (
        <Alert.Root status="error">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Erreur</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert.Root>
      )}
      {loading && <Text fontSize="sm" color="gray.600">Chargement…</Text>}

      {chartData.length > 0 ? (
        <Box>
          <Text fontSize="sm" fontWeight="semibold" mb="sm">Skill « {skill} » par ville (par mois)</Text>
          <Box h="24rem">
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
          </Box>
        </Box>
      ) : (
        <Text fontSize="sm" color="gray.600">Sélectionnez un skill pour afficher la comparaison par ville.</Text>
      )}
    </Box>
  );
}
