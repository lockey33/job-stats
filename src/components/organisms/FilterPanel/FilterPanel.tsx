'use client'

import type { CheckboxCheckedChangeDetails } from '@chakra-ui/react'
import { Box, Button, Checkbox, Grid, HStack, Input, Text } from '@chakra-ui/react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useEffect, useMemo, useState } from 'react'

import ChakraDateInput from '@/components/atoms/ChakraDateInput/ChakraDateInput'
import DatePicker from '@/components/atoms/DatePicker/DatePicker'
import ChipsInput from '@/components/molecules/ChipsInput/ChipsInput'
import MultiSelect from '@/components/molecules/MultiSelect/MultiSelect'
import type { JobFilters, MetaFacets } from '@/features/jobs/types/types'
import { normCity } from '@/shared/utils/normalize'

export interface FilterPanelProps {
  meta: MetaFacets | null
  value: JobFilters
  onChange: (filters: JobFilters) => void
  compact?: boolean // layout optimized for narrow containers (e.g., drawer)
  showReset?: boolean // show reset button in header (default true)
}

function parseCSV(input: string): string[] {
  return input
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export default function FilterPanel({
  meta,
  value,
  onChange,
  compact = false,
  showReset = true,
}: FilterPanelProps) {
  const [jobSlugsText, setJobSlugsText] = useState<string>((value.job_slugs ?? []).join(', '))

  useEffect(() => {
    setJobSlugsText((value.job_slugs ?? []).join(', '))
  }, [value.job_slugs])

  const remoteOptions = useMemo(() => meta?.remote ?? ['full', 'partial', 'none'], [meta])
  const expOptions = useMemo(() => meta?.experience ?? ['junior', 'intermediate', 'senior'], [meta])
  const cityOptions = useMemo(() => meta?.cities ?? [], [meta])
  const regionOptions = useMemo(() => meta?.regions ?? [], [meta])

  const update = (patch: Partial<JobFilters>) => {
    const next = { ...value } as JobFilters & Record<string, unknown>
    for (const [k, v] of Object.entries(patch)) {
      if (typeof v === 'undefined') delete next[k]
      else next[k] = v
    }
    onChange(next as JobFilters)
  }

  // Helpers to convert between YYYY-MM-DD and Date for the datepicker
  function ymdToDate(ymd?: string): Date | null {
    if (!ymd) return null
    const parts = ymd.split('-').map((n) => Number(n))
    if (parts.length !== 3) return null
    const [y, m, d] = parts
    if (!y || !m || !d) return null
    return new Date(y, m - 1, d)
  }

  function dateToYmd(d: Date | null | undefined): string | undefined {
    return d ? format(d, 'yyyy-MM-dd') : undefined
  }

  const gc = (md: string) =>
    compact ? { base: '1/-1' as const } : { base: '1/-1' as const, md: md }

  function SectionTitle({ label, first = false }: { label: string; first?: boolean }) {
    const mt = first ? '0' : compact ? 'sm' : 'sm'
    const pt = compact && !first ? 'md' : undefined
    const borderTopWidth = compact && !first ? '1px' : '0px'
    return (
      <Box
        gridColumn={gc('span 12')}
        mt={mt}
        pt={pt}
        borderTopWidth={borderTopWidth}
        borderColor="border"
      >
        <Text
          fontSize="xs"
          color="textMuted"
          textTransform="uppercase"
          letterSpacing="wide"
          mb="xs"
        >
          {label}
        </Text>
      </Box>
    )
  }

  return (
    <Box
      rounded="lg"
      borderWidth="0px"
      p={0}
      bg="transparent"
      shadow="none"
      role="region"
      aria-labelledby="filters-heading"
    >
      <HStack justify="space-between" align="center" mb="sm">
        <HStack gap="xs">
          {showReset && (
            <Button
              size="xs"
              variant="outline"
              colorPalette="gray"
              onClick={() => onChange({})}
              aria-label="Réinitialiser tous les filtres"
            >
              Réinitialiser
            </Button>
          )}
        </HStack>
      </HStack>
      <Grid
        id="filter-panel-content"
        gap={compact ? 'sm' : 'md'}
        templateColumns={compact ? { base: '1fr' } : { base: '1fr', md: 'repeat(12, 1fr)' }}
      >
        {/* Section: Compétences */}
        <SectionTitle label="Compétences" first />
        <Box gridColumn={gc('span 4')}>
          <Text fontSize="sm" fontWeight="medium" mb="xs">
            Compétences
          </Text>
          <MultiSelect
            options={meta?.skills ?? []}
            value={value.skills ?? []}
            onChange={(skills) => update({ skills })}
            placeholder="Ajouter des skills…"
            dedupeByNormalized
          />
        </Box>

        <Box gridColumn={gc('span 4')}>
          <Text fontSize="sm" fontWeight="medium" mb="xs">
            Compétences à exclure
          </Text>
          <MultiSelect
            options={meta?.skills ?? []}
            value={value.excludeSkills ?? []}
            onChange={(excludeSkills) => update({ excludeSkills })}
            placeholder="Tapez pour exclure des skills…"
            dedupeByNormalized
          />
        </Box>

        <Box gridColumn={gc('span 4')}>
          <Text fontSize="sm" fontWeight="medium" mb="xs">
            Mots-clés à exclure (dans le titre)
          </Text>
          <ChipsInput
            value={value.excludeTitle ?? []}
            onChange={(excludeTitle) => update({ excludeTitle })}
            placeholder="ex: alternance, stage, junior"
          />
        </Box>

        {/* Section: Localisation */}
        <SectionTitle label="Localisation" />
        <Box gridColumn={gc('span 6')}>
          <Text fontSize="sm" fontWeight="medium" mb="xs">
            Villes
          </Text>
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
              onCheckedChange={(d: CheckboxCheckedChangeDetails) =>
                update({ cityMatch: d.checked ? 'exact' : 'contains' })
              }
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
              onCheckedChange={(d: CheckboxCheckedChangeDetails) =>
                update({ excludeCities: !!d.checked })
              }
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

        <Box gridColumn={gc('span 6')}>
          <Text fontSize="sm" fontWeight="medium" mb="xs">
            Régions
          </Text>
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
              onCheckedChange={(d: CheckboxCheckedChangeDetails) =>
                update({ excludeRegions: !!d.checked })
              }
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

        <Box id="advanced-filters" gridColumn={gc('span 12')}>
          <SectionTitle label="Avancés" />
          <Text fontSize="sm" fontWeight="medium" mb="xs">
            Job slugs (séparés par des virgules)
          </Text>
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

        {/* Section: Caractéristiques */}
        <SectionTitle label="Caractéristiques" />
        <Box gridColumn={gc('span 6')}>
          <Text fontSize="sm" fontWeight="medium" mb="xs">
            Télétravail
          </Text>
          <HStack gap="sm" wrap="wrap">
            {remoteOptions.map((r) => {
              const checked = (value.remote ?? []).includes(r)
              return (
                <Checkbox.Root
                  key={r}
                  checked={checked}
                  onCheckedChange={(d: CheckboxCheckedChangeDetails) => {
                    const cur = new Set(value.remote ?? [])
                    if (d.checked) cur.add(r)
                    else cur.delete(r)
                    update({ remote: Array.from(cur) })
                  }}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Checkbox.Label>
                    <Text fontSize="sm">{r}</Text>
                  </Checkbox.Label>
                </Checkbox.Root>
              )
            })}
          </HStack>
        </Box>

        <Box gridColumn={gc('span 6')}>
          <Text fontSize="sm" fontWeight="medium" mb="xs">
            Expérience
          </Text>
          <HStack gap="sm" wrap="wrap">
            {expOptions.map((exp) => {
              const checked = (value.experience ?? []).includes(exp)
              return (
                <Checkbox.Root
                  key={exp}
                  checked={checked}
                  onCheckedChange={(d: CheckboxCheckedChangeDetails) => {
                    const cur = new Set(value.experience ?? [])
                    if (d.checked) cur.add(exp)
                    else cur.delete(exp)
                    update({ experience: Array.from(cur) })
                  }}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Checkbox.Label>
                    <Text fontSize="sm">{exp}</Text>
                  </Checkbox.Label>
                </Checkbox.Root>
              )
            })}
          </HStack>
        </Box>

        {/* Section: Finances */}
        <SectionTitle label="Finances" />
        <Box gridColumn={gc('span 3')}>
          <Text fontSize="sm" fontWeight="medium" mb="xs">
            TJM min
          </Text>
          <Input
            type="number"
            value={value.minTjm ?? ''}
            onChange={(e) => {
              const v = e.target.value ? Number(e.target.value) : undefined
              if (typeof v === 'number') update({ minTjm: v })
              else update({})
            }}
            size="sm"
            aria-label="TJM minimum"
          />
        </Box>

        <Box gridColumn={gc('span 3')}>
          <Text fontSize="sm" fontWeight="medium" mb="xs">
            TJM max
          </Text>
          <Input
            type="number"
            value={value.maxTjm ?? ''}
            onChange={(e) => {
              const v = e.target.value ? Number(e.target.value) : undefined
              if (typeof v === 'number') update({ maxTjm: v })
              else update({})
            }}
            size="sm"
            aria-label="TJM maximum"
          />
        </Box>

        {/* Section: Période */}
        <SectionTitle label="Période" />
        <Box gridColumn={gc('span 3')}>
          <Text fontSize="sm" fontWeight="medium" mb="xs">
            Date de début
          </Text>
          <DatePicker
            selected={ymdToDate(value.startDate)}
            onChange={(d: Date | null) => {
              const sv = dateToYmd(d)
              if (sv) update({ startDate: sv })
              else update({})
            }}
            dateFormat="yyyy-MM-dd"
            placeholderText="Choisir une date"
            isClearable
            maxDate={ymdToDate(value.endDate) ?? null}
            selectsStart
            startDate={ymdToDate(value.startDate) ?? null}
            endDate={ymdToDate(value.endDate) ?? null}
            todayButton="Aujourd’hui"
            locale={fr}
            customInput={<ChakraDateInput />}
            {...(compact ? { withPortal: true } : {})}
          />
        </Box>

        <Box gridColumn={gc('span 3')}>
          <Text fontSize="sm" fontWeight="medium" mb="xs">
            Date de fin
          </Text>
          <DatePicker
            selected={ymdToDate(value.endDate)}
            onChange={(d: Date | null) => {
              const ev = dateToYmd(d)
              if (ev) update({ endDate: ev })
              else update({})
            }}
            dateFormat="yyyy-MM-dd"
            placeholderText="Choisir une date"
            isClearable
            minDate={ymdToDate(value.startDate) ?? null}
            selectsEnd
            startDate={ymdToDate(value.startDate) ?? null}
            endDate={ymdToDate(value.endDate) ?? null}
            todayButton="Aujourd’hui"
            locale={fr}
            customInput={<ChakraDateInput />}
            {...(compact ? { withPortal: true } : {})}
          />
        </Box>
      </Grid>
    </Box>
  )
}
