"use client";

import { useEffect, useMemo, useState } from 'react';
import { JobFilters, MetaFacets } from '@/lib/domain/types';
import CityMultiSelect from '@/components/CityMultiSelect';
import SkillMultiSelect from '@/components/SkillMultiSelect';
import ChipsInput from '@/components/ChipsInput';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Box, Text, Input, HStack, Checkbox, Grid } from '@chakra-ui/react';
import ChakraDateInput from '@/components/ChakraDateInput';

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
    <Box rounded="lg" borderWidth="0px" p={0} bg="transparent" shadow="none">
      <Grid gap="md" templateColumns={{ base: '1fr', md: 'repeat(12, 1fr)' }}>
        <Box gridColumn={{ base: '1/-1', md: 'span 4' }}>
          <Text fontSize="sm" fontWeight="medium">Skills</Text>
          <SkillMultiSelect
            options={meta?.skills ?? []}
            value={value.skills ?? []}
            onChange={(skills) => update({ skills })}
            placeholder="Ajouter des skills…"
          />
        </Box>

        <Box gridColumn={{ base: '1/-1', md: 'span 4' }}>
          <Text fontSize="sm" fontWeight="medium">Skills à exclure</Text>
          <SkillMultiSelect
            options={meta?.skills ?? []}
            value={value.excludeSkills ?? []}
            onChange={(excludeSkills) => update({ excludeSkills })}
            placeholder="Tapez pour exclure des skills…"
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

        <Box gridColumn={{ base: '1/-1', md: 'span 6' }}>
          <Text fontSize="sm" fontWeight="medium">Villes</Text>
          <CityMultiSelect
            options={cityOptions}
            value={value.cities ?? []}
            onChange={(cities) => update({ cities })}
            placeholder="Tapez pour rechercher une ville..."
          />
          <HStack pt="xs" gap="sm" align="center">
            <Checkbox.Root
              checked={(value.cityMatch ?? 'contains') === 'exact'}
              onCheckedChange={(d: any) => update({ cityMatch: d.checked ? 'exact' : 'contains' })}
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
              onCheckedChange={(d: any) => update({ excludeCities: !!d.checked })}
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
          <CityMultiSelect
            options={regionOptions}
            value={value.regions ?? []}
            onChange={(regions) => update({ regions })}
            placeholder="Tapez pour rechercher une région..."
          />
          <HStack pt="xs" gap="md" align="center">
            <Checkbox.Root
              checked={!!value.excludeRegions}
              onCheckedChange={(d: any) => update({ excludeRegions: !!d.checked })}
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

        <Box gridColumn={{ base: '1/-1', md: 'span 12' }}>
          <Text fontSize="sm" fontWeight="medium">Job slugs (séparés par des virgules)</Text>
          <Input
            type="text"
            value={jobSlugsText}
            onChange={(e) => setJobSlugsText(e.target.value)}
            onBlur={() => update({ job_slugs: parseCSV(jobSlugsText) })}
            placeholder="ex: developpeur-front-end-javascript-node-react-angular-vue"
            size="sm"
          />
        </Box>

        <Box gridColumn={{ base: '1/-1', md: 'span 6' }}>
          <Text fontSize="sm" fontWeight="medium">Télétravail</Text>
          <HStack gap="sm" wrap="wrap">
            {remoteOptions.map((r) => {
              const checked = (value.remote ?? []).includes(r);
              return (
                <Checkbox.Root key={r} checked={checked} onCheckedChange={(d: any) => {
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
                <Checkbox.Root key={exp} checked={checked} onCheckedChange={(d: any) => {
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

        <Box gridColumn={{ base: '1/-1', md: 'span 3' }}>
          <Text fontSize="sm" fontWeight="medium">TJM min</Text>
          <Input
            type="number"
            value={value.minTjm ?? ''}
            onChange={(e) => update({ minTjm: e.target.value ? Number(e.target.value) : undefined })}
            size="sm"
          />
        </Box>

        <Box gridColumn={{ base: '1/-1', md: 'span 3' }}>
          <Text fontSize="sm" fontWeight="medium">TJM max</Text>
          <Input
            type="number"
            value={value.maxTjm ?? ''}
            onChange={(e) => update({ maxTjm: e.target.value ? Number(e.target.value) : undefined })}
            size="sm"
          />
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
