'use client'

import { Box, Text, useBreakpointValue } from '@chakra-ui/react'
import React from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { AnalyticsResult } from '@/features/jobs/types/types'
import { COLORS } from '@/shared/ui/charts/colors'
import { CHART_MARGIN, xAxisProps } from '@/shared/ui/charts/common'
import { formatMonthFR } from '@/shared/utils/dates'

// colors are imported from shared/ui/charts/colors

type Mode = 'basics' | 'skills'

interface Props {
  metrics: AnalyticsResult | null
  months?: 6 | 12 | 24
  mode?: Mode
  controlSlot?: React.ReactNode
}

export default function Charts({ metrics, months = 12, mode = 'basics', controlSlot }: Props) {
  const [hidden, setHidden] = React.useState<string[]>([])
  const isMobile = useBreakpointValue({ base: true, md: false }) ?? false

  if (!metrics) return null

  const fmtMonth = (m: string | number) => formatMonthFR(m)

  type TooltipItem = { name?: string; value?: number; color?: string }

  function getRawMonth(pl?: TooltipItem[]): string | number | undefined {
    const p0 = pl && pl[0]

    if (p0 && typeof p0 === 'object') {
      const inner = (p0 as unknown as { payload?: Record<string, unknown> }).payload
      const m = inner?.month

      if (typeof m === 'string' || typeof m === 'number') return m
    }

    return undefined
  }

  function SimpleTooltip({
    active,
    payload,
    unit,
  }: {
    active?: boolean
    payload?: TooltipItem[]
    unit?: string
  }) {
    if (!active || !payload || payload.length === 0) return null
    const val = payload[0]?.value as number | undefined
    const rawMonth = getRawMonth(payload)

    return (
      <Box bg="white" borderWidth="1px" rounded="md" p="sm" fontSize="sm" shadow="sm">
        <Text fontWeight="semibold" mb="xs">
          {rawMonth !== undefined ? fmtMonth(String(rawMonth)) : ''}
        </Text>
        <Text>
          {typeof val === 'number' ? val.toLocaleString('fr-FR') : '—'}
          {unit ? ` ${unit}` : ''}
        </Text>
      </Box>
    )
  }

  function MultiTooltip({ active, payload }: { active?: boolean; payload?: TooltipItem[] }) {
    if (!active || !payload || payload.length === 0) return null
    const rawMonth = getRawMonth(payload)

    return (
      <Box bg="white" borderWidth="1px" rounded="md" p="sm" fontSize="sm" shadow="sm">
        <Text fontWeight="semibold" mb="xs">
          {rawMonth !== undefined ? fmtMonth(String(rawMonth)) : ''}
        </Text>
        {payload.map((entry, idx) => (
          <Box key={idx} display="flex" alignItems="center" justifyContent="space-between" gap="md">
            <Box display="inline-flex" alignItems="center" gap="xs">
              <Box w="10px" h="10px" bg={entry.color} rounded="full" />
              <Text>{entry.name}</Text>
            </Box>
            <Text fontWeight="medium">
              {typeof entry.value === 'number' ? entry.value.toLocaleString('fr-FR') : '—'}
            </Text>
          </Box>
        ))}
      </Box>
    )
  }

  function SimpleLegend({ payload }: { payload?: Array<{ value?: string; color?: string }> }) {
    if (!payload || payload.length === 0) return null

    return (
      <Box display="flex" flexWrap="wrap" gap="sm" mt="xs">
        {payload.map((p, idx: number) => {
          const name = (p.value ?? '') as string
          const isHidden = hidden.includes(name)

          return (
            <Box
              as="button"
              key={idx}
              display="inline-flex"
              alignItems="center"
              gap="xs"
              px="xs"
              py="1"
              rounded="md"
              borderWidth="1px"
              opacity={isHidden ? 0.4 : 1}
              onClick={() => toggleSeries(name)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  toggleSeries(name)
                }
              }}
              role="switch"
              aria-checked={!isHidden}
              title={`${isHidden ? 'Afficher' : 'Masquer'} ${name}`}
            >
              <Box w="10px" h="10px" rounded="full" bg={p.color} />
              <Text fontSize="sm">{name}</Text>
            </Box>
          )
        })}
      </Box>
    )
  }

  // Determine the slice of months to keep
  const allMonths = metrics.months
  const keep = Math.max(1, Math.min(allMonths.length, months))
  const keptMonths = allMonths.slice(-keep)

  // Smoothing removed per UX decision

  // Slice datasets
  const postingsPerMonth = metrics.postingsPerMonth.filter((p) => keptMonths.includes(p.month))
  const avgTjmPerMonth = metrics.avgTjmPerMonth.filter((p) => keptMonths.includes(p.month))
  const skillsPerMonth = metrics.skillsPerMonth.filter((p) => keptMonths.includes(String(p.month)))

  // Use raw month keys ('YYYY-MM') and format only at render time
  const postingsData = postingsPerMonth
  const avgTjmData = avgTjmPerMonth
  const skillsData = skillsPerMonth

  // Allow toggling series visibility for skills
  function toggleSeries(name: string) {
    setHidden((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]))
  }

  // Note: avoid render-phase logging and post-hydration effects to prevent any hydration mismatch risks.

  if (mode === 'basics') {
    return (
      <Box display="grid" gridTemplateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap="lg">
        <Box borderWidth="0px" p={0} bg="transparent" shadow="none">
          <Text fontSize="sm" fontWeight="semibold" mb="sm">
            Nombre d’offres par mois
          </Text>
          <Box h={{ base: '14rem', md: '16rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={postingsData} margin={CHART_MARGIN}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  {...xAxisProps(isMobile)}
                  tickFormatter={(v) => fmtMonth(v)}
                />
                <YAxis allowDecimals={false} />
                <Tooltip content={<SimpleTooltip unit="offres" />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Box>
        <Box borderWidth="0px" p={0} bg="transparent" shadow="none">
          <Text fontSize="sm" fontWeight="semibold" mb="sm">
            TJM moyen par mois (€)
          </Text>
          <Box h={{ base: '14rem', md: '16rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={avgTjmData} margin={CHART_MARGIN}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  {...xAxisProps(isMobile)}
                  tickFormatter={(v) => fmtMonth(v)}
                />
                <YAxis />
                <Tooltip content={<SimpleTooltip unit="€" />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#16a34a"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      </Box>
    )
  }

  // skills only
  return (
    <Box>
      <Text fontSize="sm" fontWeight="semibold" mb="xs">
        Tendances des compétences
      </Text>
      <Text fontSize="xs" color="gray.600" mb="xs">
        Ajoutez/retirez des compétences via le sélecteur, et cliquez sur la légende pour
        masquer/afficher une série.
      </Text>
      {controlSlot ? <Box mb="sm">{controlSlot}</Box> : null}
      <Box h={{ base: '18rem', md: '20rem' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={skillsData} margin={CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" {...xAxisProps(isMobile)} tickFormatter={(v) => fmtMonth(v)} />
            <YAxis allowDecimals={false} />
            <Tooltip content={<MultiTooltip />} />
            <Legend content={<SimpleLegend />} />
            {metrics.seriesSkills
              .filter((s) => !hidden.includes(s))
              .map((s, idx) => (
                <Line
                  key={s}
                  type="monotone"
                  dataKey={s}
                  stroke={COLORS[idx % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  )
}
