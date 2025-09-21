'use client'

import {
  Alert,
  Box,
  Grid,
  SliderControl,
  SliderRange,
  SliderRoot,
  SliderThumb,
  SliderTrack,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { fetchCitySkillTrend } from '@/features/jobs/api/endpoints'
import type { JobFilters, MetaFacets } from '@/features/jobs/types/types'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { COLORS } from '@/shared/ui/charts/colors'
import { CITY_CHART_MARGIN, xAxisProps } from '@/shared/ui/charts/common'
import Autocomplete from '@/shared/ui/components/molecules/Autocomplete/Autocomplete'
import MultiSelect from '@/shared/ui/components/molecules/MultiSelect/MultiSelect'
import { formatMonthFR } from '@/shared/utils/dates'
import { normCity } from '@/shared/utils/normalize'

// colors are shared from '@/shared/ui/charts/colors'

interface Props {
  filters: JobFilters
  meta: MetaFacets | null
  defaultSkill?: string
}

export default function CitySkillTrendView({ filters, meta, defaultSkill }: Props) {
  const isMobile = useBreakpointValue({ base: true, md: false }) ?? false
  const [skill, setSkill] = useState<string>(defaultSkill || '')
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [topCityCount, setTopCityCount] = useState<number>(5)
  const debouncedTopCityCount = useDebounce(topCityCount, 300)

  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [months, setMonths] = useState<string[]>([])
  const [seriesCities, setSeriesCities] = useState<string[]>([])

  type CityChartDatum = { month: string; monthLabel: string } & Record<string, number | string>
  const [chartData, setChartData] = useState<CityChartDatum[]>([])
  const [hiddenCities, setHiddenCities] = useState<string[]>([])
  const abortRef = useRef<AbortController | null>(null)

  // Auto-fill default skill when provided, only if user has not selected one yet
  useEffect(() => {
    if (!skill && defaultSkill) setSkill(defaultSkill)
  }, [defaultSkill, skill])

  const triggerFetch = useCallback(async () => {
    if (!skill) {
      setMonths([])
      setSeriesCities([])
      setChartData([])

      return
    }

    try {
      setLoading(true)
      // cancel previous request if any
      abortRef.current?.abort()
      const ctrl = new AbortController()

      abortRef.current = ctrl
      setError(null)
      const payload = await fetchCitySkillTrend(
        filters,
        skill,
        selectedCities.length > 0 ? selectedCities : undefined,
        debouncedTopCityCount,
        { signal: ctrl.signal },
      )
      // Transform into recharts format: [{month, monthLabel, CityA: n, CityB: m, ...}, ...]
      const cities = Object.keys(payload.citySeries)
      const map: Record<string, CityChartDatum> = {}

      for (const city of cities) {
        for (const pt of payload.citySeries[city] ?? []) {
          const existing = map[pt.month]
          const row =
            existing ??
            (map[pt.month] = {
              month: pt.month,
              monthLabel: formatMonthFR(pt.month),
            } as CityChartDatum)

          row[city] = pt.value
        }
      }

      const data = Object.values(map).sort((a, b) => String(a.month).localeCompare(String(b.month)))

      setMonths(payload.months)
      setSeriesCities(cities)
      setChartData(data)
    } catch (e: unknown) {
      // Ignore abort errors
      if (e instanceof DOMException && e.name === 'AbortError') return
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [filters, skill, selectedCities, debouncedTopCityCount])

  useEffect(() => {
    triggerFetch()
  }, [triggerFetch])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const cityOptions = useMemo(() => meta?.cities ?? [], [meta])

  const colorMap = useMemo(() => {
    const map: Record<string, string> = {}

    seriesCities.forEach((city, idx) => {
      map[city] = COLORS[idx % COLORS.length]!
    })

    return map
  }, [seriesCities])

  function toggleCityVisibility(city: string) {
    setHiddenCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city],
    )
  }

  function CustomLegend() {
    return (
      <Box display="flex" flexWrap="wrap" gap="sm" mt="xs">
        {seriesCities.map((city) => {
          const color = colorMap[city]
          const hidden = hiddenCities.includes(city)

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
                  e.preventDefault()
                  toggleCityVisibility(city)
                }
              }}
              role="switch"
              aria-checked={!hidden}
              title={`${hidden ? 'Afficher' : 'Masquer'} ${city}`}
            >
              <Box w="10px" h="10px" rounded="full" bg={color} />
              <Text fontSize="sm">{city}</Text>
            </Box>
          )
        })}
      </Box>
    )
  }

  type TooltipEntry = { name: string; value: number; color?: string }

  function getRawMonth(pl?: TooltipEntry[]): string | undefined {
    const p0 = pl && pl[0]

    if (p0 && typeof p0 === 'object') {
      const inner = (p0 as unknown as { payload?: Record<string, unknown> }).payload
      const m = inner?.month

      if (typeof m === 'string') return m
    }

    return undefined
  }

  function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipEntry[] }) {
    if (!active || !payload || payload.length === 0) return null
    const rawMonth = getRawMonth(payload)
    const idx = rawMonth ? months.findIndex((m) => String(m) === String(rawMonth)) : -1
    const prevIdx = idx - 1
    const prevMonth = prevIdx >= 0 ? months[prevIdx] : null
    const prev = prevMonth ? chartData.find((d) => String(d.month) === String(prevMonth)) : null

    return (
      <Box bg="white" borderWidth="1px" rounded="md" p="sm" fontSize="sm" shadow="sm">
        <Text fontWeight="semibold" mb="xs">
          {rawMonth ? formatMonthFR(String(rawMonth)) : ''}
        </Text>
        {payload.map((entry: TooltipEntry, idx: number) => {
          const city = entry.name
          const val = entry.value as number
          const prevVal = prev ? (prev[city] ?? null) : null
          const delta = typeof prevVal === 'number' ? val - prevVal : null

          return (
            <Box
              key={`${city}-${idx}`}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              gap="md"
            >
              <Box display="inline-flex" alignItems="center" gap="xs">
                <Box w="10px" h="10px" bg={entry.color} rounded="full" />
                <Text>{city}</Text>
              </Box>
              <Box>
                <Text as="span" fontWeight="medium">
                  {val}
                </Text>
                {delta !== null && (
                  <Text as="span" color={delta >= 0 ? 'green.600' : 'red.600'} ml="2">
                    {delta >= 0 ? `+${delta}` : `${delta}`}
                  </Text>
                )}
              </Box>
            </Box>
          )
        })}
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
      display="flex"
      flexDirection="column"
      gap="md"
    >
      <Grid templateColumns={{ base: '1fr', md: 'repeat(12, 1fr)' }} gap="md" alignItems="end">
        <Box gridColumn={{ base: '1/-1', md: 'span 6' }}>
          <Text fontSize="sm" fontWeight="medium" mb="xs">
            Compétence
          </Text>
          <Autocomplete
            options={meta?.skills ?? []}
            value={skill}
            onChange={setSkill}
            placeholder="Choisir une compétence à comparer entre les villes…"
          />
        </Box>
        <Box gridColumn={{ base: '1/-1', md: 'span 6' }}>
          <Text fontSize="sm" fontWeight="medium" mb="xs">
            Villes (facultatif)
          </Text>
          <MultiSelect
            options={cityOptions}
            value={selectedCities}
            onChange={setSelectedCities}
            placeholder="Ajouter des villes précises (sinon Top N villes)"
            normalize={normCity}
            dedupeByNormalized={false}
          />
        </Box>
        <Box gridColumn={{ base: '1/-1', md: 'span 12' }}>
          <Box
            display="flex"
            flexWrap="wrap"
            alignItems="center"
            justifyContent="flex-end"
            gap="sm"
            mt="sm"
          >
            <Text fontSize="xs" color="textMuted" whiteSpace="nowrap">
              Top N villes
            </Text>
            <Box flex={1} minW={{ md: '20rem' }} maxW={{ md: '28rem' }}>
              <SliderRoot
                min={1}
                max={12}
                value={[topCityCount]}
                onValueChange={(d) => {
                  const v = Array.isArray(d.value) ? d.value[0] : undefined

                  if (typeof v === 'number') setTopCityCount(v)
                }}
                disabled={selectedCities.length > 0}
                size="md"
              >
                <SliderControl>
                  <SliderTrack h="2" bg="neutral.200" rounded="md">
                    <SliderRange bg="brand.500" rounded="md" />
                  </SliderTrack>
                  <SliderThumb
                    index={0}
                    boxSize="4"
                    bg="surface"
                    borderWidth="2px"
                    borderColor="brand.500"
                    rounded="full"
                    shadow="sm"
                  />
                </SliderControl>
              </SliderRoot>
            </Box>
            <Box as="span" fontWeight="medium" minW="2rem" textAlign="right">
              {topCityCount}
            </Box>
          </Box>
          {selectedCities.length > 0 && (
            <Text fontSize="xs" color="textMuted" mt="1">
              Le Top N s’applique lorsqu’aucune ville n’est sélectionnée.
            </Text>
          )}
        </Box>
      </Grid>

      {error && (
        <Alert.Root status="error">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Erreur</Alert.Title>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert.Root>
      )}
      {loading && (
        <Text fontSize="sm" color="gray.600">
          Chargement…
        </Text>
      )}

      {chartData.length > 0 ? (
        <Box>
          <Text fontSize="sm" fontWeight="semibold" mb="xs">
            Skill « {skill} » par ville (par mois)
          </Text>
          <Box h={{ base: '20rem', md: '24rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={CITY_CHART_MARGIN}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  {...xAxisProps(isMobile)}
                  tickFormatter={(v) => formatMonthFR(v)}
                />
                <YAxis allowDecimals={false} />
                <ReTooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
                {seriesCities
                  .filter((c) => !hiddenCities.includes(c))
                  .map((city) => (
                    <Line
                      key={city}
                      type="monotoneX"
                      dataKey={city}
                      stroke={colorMap[city]}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      dot={false}
                      connectNulls
                    />
                  ))}
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      ) : (
        <Text fontSize="sm" color="gray.600">
          Sélectionnez un skill pour afficher la comparaison par ville.
        </Text>
      )}
    </Box>
  )
}
