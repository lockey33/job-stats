"use client";

import { useEffect, useMemo, useState } from 'react';
import { JobFilters, MetaFacets } from '@/features/jobs/types/types';
import MultiSelect from '@/components/molecules/MultiSelect/MultiSelect';
import ChipsInput from '@/components/molecules/ChipsInput/ChipsInput';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Box, Text, Input, HStack, Checkbox, Grid, Button } from '@chakra-ui/react';
import type { CheckboxCheckedChangeDetails } from '@chakra-ui/react';
import ChakraDateInput from '@/components/atoms/ChakraDateInput/ChakraDateInput';
import { normCity } from '@/shared/utils/normalize';

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
  const [jobSlugsText, setJobSlugsText] = useState<string>((value.job_slugs ?? []).join(', '));
  const [advancedOpen, setAdvancedOpen] = useState<boolean>(false);

  useEffect(() => {
    setJobSlugsText((value.job_slugs ?? []).join(', '));
  }, [value.job_slugs]);

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
    <Box rounded="lg" borderWidth="0px" p={0} bg="transparent" shadow="none" role="region" aria-labelledby="filters-heading">
      <HStack justify="space-between" align="center" mb="sm">
        <HStack gap="xs">
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setAdvancedOpen((v) => !v)}
            aria-expanded={advancedOpen}
            aria-controls="advanced-filters"
          >
            {advancedOpen ? 'Masquer avancés' : 'Afficher avancés'}
          </Button>
          <Button size="xs" variant="outline" colorPalette="gray" onClick={() => onChange({})} aria-label="Réinitialiser tous les filtres">
            Réinitialiser
          </Button>
        </HStack>
      </HStack>
      <Grid id="filter-panel-content" gap="md" templateColumns={{ base: '1fr', md: 'repeat(12, 1fr)' }}>
        {/* Section: Compétences */}
        <Box gridColumn={{ base: '1/-1', md: 'span 12' }}>
          <Text fontSize="xs" color="gray.600" textTransform="uppercase" letterSpacing="wide">Compétences</Text>
        </Box>
        <Box gridColumn={{ base: '1/-1', md: 'span 4' }}>
          <Text fontSize="sm" fontWeight="medium">Skills</Text>
          <MultiSelect
            options={meta?.skills ?? []}
            value={value.skills ?? []}
            onChange={(skills) => update({ skills })}
            placeholder="Ajouter des skills…"
            dedupeByNormalized
          />
        </Box>

        <Box gridColumn={{ base: '1/-1', md: 'span 4' }}>
          <Text fontSize="sm" fontWeight="medium">Skills à exclure</Text>
          <MultiSelect
            options={meta?.skills ?? []}
            value={value.excludeSkills ?? []}
            onChange={(excludeSkills) => update({ excludeSkills })}
            placeholder="Tapez pour exclure des skills…"
            dedupeByNormalized
          />
        </Box>

        <Box gridColumn={{ base: '1/-1', md: 'span 4' }}>
          <Text fontSize="sm" fontWeight="medium">Mots-clés à exclure (dans le titre)</Text>
          <ChipsInput
            value={value.excludeTitle ?? []}
            onChange={(excludeTitle) => update({ excludeTitle })}
            placeholder="ex: alternance, stage, junior"
          />
        </Box>

        {/* Section: Localisation */}
        <Box gridColumn={{ base: '1/-1', md: 'span 12' }} mt="sm">
          <Text fontSize="xs" color="gray.600" textTransform="uppercase" letterSpacing="wide">Localisation</Text>
        </Box>
        <Box gridColumn={{ base: '1/-1', md: 'span 6' }}>
          <Text fontSize="sm" fontWeight="medium">Villes</Text>
          <MultiSelect
            options={cityOptions}
            value={value.cities ?? []}
            onChange={(cities) => update({ cities })}
            placeholder="Tapez pour rechercher une ville..."
            normalize={normCity}
            dedupeByNormalized={false}
          />
          <HStack pt="xs" gap="sm" align="center">
            <Checkbox.Root
              checked={(value.cityMatch ?? 'contains') === 'exact'}
              onCheckedChange={(d: CheckboxCheckedChangeDetails) => update({ cityMatch: d.checked ? 'exact' : 'contains' })}
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Label>
                <Text fontSize="xs">Correspondance exacte</Text>
              </Checkbox.Label>
            </Checkbox.Root>
            <Checkbox.Root
              checked={!!value.excludeCities}
              onCheckedChange={(d: CheckboxCheckedChangeDetails) => update({ excludeCities: !!d.checked })}
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Label>
                <Text fontSize="xs">Exclure ces villes</Text>
              </Checkbox.Label>
            </Checkbox.Root>
          </HStack>
        </Box>

        <Box gridColumn={{ base: '1/-1', md: 'span 6' }}>
          <Text fontSize="sm" fontWeight="medium">Régions</Text>
          <MultiSelect
            options={regionOptions}
            value={value.regions ?? []}
            onChange={(regions) => update({ regions })}
            placeholder="Tapez pour rechercher une région..."
            dedupeByNormalized={false}
          />
          <HStack pt="xs" gap="md" align="center">
            <Checkbox.Root
              checked={!!value.excludeRegions}
              onCheckedChange={(d: CheckboxCheckedChangeDetails) => update({ excludeRegions: !!d.checked })}
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Label>
                <Text fontSize="xs">Exclure ces régions</Text>
              </Checkbox.Label>
            </Checkbox.Root>
          </HStack>
        </Box>

        {advancedOpen && (
          <Box id="advanced-filters" gridColumn={{ base: '1/-1', md: 'span 12' }}>
            <Text fontSize="sm" fontWeight="medium">Job slugs (séparés par des virgules)</Text>
            <Input
              type="text"
              value={jobSlugsText}
              onChange={(e) => setJobSlugsText(e.target.value)}
              onBlur={() => update({ job_slugs: parseCSV(jobSlugsText) })}
              placeholder="ex: developpeur-front-end-javascript-node-react-angular-vue"
              size="sm"
              aria-label="Job slugs, séparés par des virgules"
            />
          </Box>
        )}

        {/* Section: Caractéristiques */}
        <Box gridColumn={{ base: '1/-1', md: 'span 12' }} mt="sm">
          <Text fontSize="xs" color="gray.600" textTransform="uppercase" letterSpacing="wide">Caractéristiques</Text>
        </Box>
        <Box gridColumn={{ base: '1/-1', md: 'span 6' }}>
          <Text fontSize="sm" fontWeight="medium">Télétravail</Text>
          <HStack gap="sm" wrap="wrap">
            {remoteOptions.map((r) => {
              const checked = (value.remote ?? []).includes(r);
              return (
                <Checkbox.Root key={r} checked={checked} onCheckedChange={(d: CheckboxCheckedChangeDetails) => {
                  const cur = new Set(value.remote ?? []);
                  if (d.checked) cur.add(r); else cur.delete(r);
                  update({ remote: Array.from(cur) });
                }}>
                  <Checkbox.HiddenInput />
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Checkbox.Label>
                    <Text fontSize="sm">{r}</Text>
                  </Checkbox.Label>
                </Checkbox.Root>
              );
            })}
          </HStack>
        </Box>

        <Box gridColumn={{ base: '1/-1', md: 'span 6' }}>
          <Text fontSize="sm" fontWeight="medium">Expérience</Text>
          <HStack gap="sm" wrap="wrap">
            {expOptions.map((exp) => {
              const checked = (value.experience ?? []).includes(exp);
              return (
                <Checkbox.Root key={exp} checked={checked} onCheckedChange={(d: CheckboxCheckedChangeDetails) => {
                  const cur = new Set(value.experience ?? []);
                  if (d.checked) cur.add(exp); else cur.delete(exp);
                  update({ experience: Array.from(cur) });
                }}>
                  <Checkbox.HiddenInput />
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Checkbox.Label>
                    <Text fontSize="sm">{exp}</Text>
                  </Checkbox.Label>
                </Checkbox.Root>
              );
            })}
          </HStack>
        </Box>

        {/* Section: Finances */}
        <Box gridColumn={{ base: '1/-1', md: 'span 12' }} mt="sm">
          <Text fontSize="xs" color="gray.600" textTransform="uppercase" letterSpacing="wide">Finances</Text>
        </Box>
        <Box gridColumn={{ base: '1/-1', md: 'span 3' }}>
          <Text fontSize="sm" fontWeight="medium">TJM min</Text>
          <Input
            type="number"
            value={value.minTjm ?? ''}
            onChange={(e) => update({ minTjm: e.target.value ? Number(e.target.value) : undefined })}
            size="sm"
            aria-label="TJM minimum"
          />
        </Box>

        <Box gridColumn={{ base: '1/-1', md: 'span 3' }}>
          <Text fontSize="sm" fontWeight="medium">TJM max</Text>
          <Input
            type="number"
            value={value.maxTjm ?? ''}
            onChange={(e) => update({ maxTjm: e.target.value ? Number(e.target.value) : undefined })}
            size="sm"
            aria-label="TJM maximum"
          />
        </Box>

        {/* Section: Période */}
        <Box gridColumn={{ base: '1/-1', md: 'span 12' }} mt="sm">
          <Text fontSize="xs" color="gray.600" textTransform="uppercase" letterSpacing="wide">Période</Text>
        </Box>
        <Box gridColumn={{ base: '1/-1', md: 'span 3' }}>
          <Text fontSize="sm" fontWeight="medium">Date de début</Text>
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
            customInput={<ChakraDateInput />}
          />
        </Box>

        <Box gridColumn={{ base: '1/-1', md: 'span 3' }}>
          <Text fontSize="sm" fontWeight="medium">Date de fin</Text>
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
            customInput={<ChakraDateInput />}
          />
        </Box>
      </Grid>
    </Box>
  );
}
