"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { JobFilters, MetaFacets } from "@/lib/domain/types";
import { fetchCitySkillTrend } from "@/lib/utils/api";
import Autocomplete from "@/components/molecules/Autocomplete/Autocomplete";
import MultiSelect from "@/components/molecules/MultiSelect/MultiSelect";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Legend } from "recharts";
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
  const [hiddenCities, setHiddenCities] = useState<string[]>([]);

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

  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    seriesSkills.forEach((city, idx) => {
      map[city] = COLORS[idx % COLORS.length];
    });
    return map;
  }, [seriesSkills]);

  function toggleCityVisibility(city: string) {
    setHiddenCities((prev) => (prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]));
  }

  function CustomLegend({ payload }: any) {
    if (!payload) return null;
    return (
      <Box display="flex" flexWrap="wrap" gap="sm" mt="xs">
        {seriesSkills.map((city) => {
          const color = colorMap[city];
          const hidden = hiddenCities.includes(city);
          return (
            <Box
              as="button"
              key={city}
              display="inline-flex"
              alignItems="center"
              gap="xs"
              px="xs"
              py="1"
              rounded="md"
              borderWidth="1px"
              opacity={hidden ? 0.4 : 1}
              onClick={() => toggleCityVisibility(city)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleCityVisibility(city);
                }
              }}
              role="switch"
              aria-checked={!hidden}
              title={`${hidden ? 'Afficher' : 'Masquer'} ${city}`}
            >
              <Box w="10px" h="10px" rounded="full" bg={color} />
              <Text fontSize="sm">{city}</Text>
            </Box>
          );
        })}
      </Box>
    );
  }

  function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload || payload.length === 0) return null;
    const prevIdx = months.findIndex((m) => m === label) - 1;
    const prevMonth = prevIdx >= 0 ? months[prevIdx] : null;
    const prev = prevMonth ? chartData.find((d) => String(d.month) === String(prevMonth)) : null;
    return (
      <Box bg="white" borderWidth="1px" rounded="md" p="sm" fontSize="sm" shadow="sm">
        <Text fontWeight="semibold" mb="xs">{label}</Text>
        {payload.map((entry: any, idx: number) => {
          const city = entry.name;
          const val = entry.value as number;
          const prevVal = prev ? (prev[city] ?? null) : null;
          const delta = typeof prevVal === 'number' ? val - prevVal : null;
          return (
            <Box key={`${city}-${idx}`} display="flex" alignItems="center" justifyContent="space-between" gap="md">
              <Box display="inline-flex" alignItems="center" gap="xs">
                <Box w="10px" h="10px" bg={entry.color} rounded="full" />
                <Text>{city}</Text>
              </Box>
              <Box>
                <Text as="span" fontWeight="medium">{val}</Text>
                {delta !== null && (
                  <Text as="span" color={delta >= 0 ? 'green.600' : 'red.600'} ml="2">
                    {delta >= 0 ? `+${delta}` : `${delta}`}
                  </Text>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    );
  }

  return (
    <Box rounded="lg" borderWidth="0px" p={0} bg="transparent" shadow="none" display="flex" flexDirection="column" gap="md">
      <Box display="flex" flexDirection={{ base: 'column', md: 'row' }} gap="md" alignItems={{ md: 'flex-end' }}>
        <Box flex={{ base: 'unset', md: 1 }} w="full">
          <Text fontSize="sm" fontWeight="medium" mb="xs">Skill</Text>
          <Autocomplete
            options={meta?.skills ?? []}
            value={skill}
            onChange={setSkill}
            placeholder="Choisir un skill à comparer entre les villes…"
          />
        </Box>
        <Box flex={{ base: 'unset', md: 1 }} w="full">
          <Text fontSize="sm" fontWeight="medium" mb="xs">Villes (facultatif)</Text>
          <MultiSelect
            options={cityOptions}
            value={selectedCities}
            onChange={setSelectedCities}
            placeholder="Ajouter des villes précises (sinon Top N villes)"
            normalize={(s) => s.toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim()}
            dedupeByNormalized={false}
          />
          <Box display="flex" alignItems="center" gap="md" mt="sm" fontSize="xs">
            <Checkbox.Root checked={useSelectedCities} onCheckedChange={(d: any) => setUseSelectedCities(!!d.checked)}>
              <Checkbox.HiddenInput />
              <Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>
              <Checkbox.Label>Utiliser uniquement ces villes</Checkbox.Label>
            </Checkbox.Root>
            <Box display="flex" alignItems="center" gap="sm" minW={{ md: '20rem' }}>
              <Text>Top N villes:</Text>
              <Input
                type="range"
                min={1}
                max={12}
                value={topCityCount}
                onChange={(e) => setTopCityCount(Math.max(1, Math.min(12, Number(e.target.value) || 1)))}
                w="full"
              />
              <Box as="span" fontWeight="medium" minW="2rem" textAlign="right">{topCityCount}</Box>
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
                <ReTooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
                {seriesSkills.filter((c) => !hiddenCities.includes(c)).map((city) => (
                  <Line key={city} type="monotone" dataKey={city} stroke={colorMap[city]} strokeWidth={2} dot={false} />
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
