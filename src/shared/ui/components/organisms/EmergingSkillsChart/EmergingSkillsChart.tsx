'use client'

import { Box, Text, useBreakpointValue } from '@chakra-ui/react'
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

import type { EmergingSkillTrendPayload } from '@/features/jobs/types/types'
import { COLORS } from '@/shared/ui/charts/colors'
import { CHART_MARGIN, xAxisProps } from '@/shared/ui/charts/common'
import { formatMonthFR } from '@/shared/utils/dates'

interface Props {
  payload: EmergingSkillTrendPayload | null
  limit?: number
  controlSlot?: React.ReactNode
}

// colors are imported from shared/ui/charts/colors

export default function EmergingSkillsChart({ payload, limit = 10, controlSlot }: Props) {
  const isMobile = useBreakpointValue({ base: true, md: false }) ?? false
  if (!payload || !payload.trends || payload.trends.length === 0) return null

  const months = payload.months
  // Keep only top N trends by slope
  const trends = [...payload.trends]
    .sort((a, b) => (b.slope ?? 0) - (a.slope ?? 0))
    .slice(0, Math.max(1, limit))

  // Build a quick lookup for rank per month per skill
  const rankMapPerSkill = new Map<string, Map<string, number>>()
  for (const t of trends) {
    rankMapPerSkill.set(t.skill, new Map(t.monthly.map((r) => [r.month, r.rank])))
  }

  // Compute the max rank seen per month (to transform rank -> ascending score)
  const maxRankPerMonth: Record<string, number> = {}
  for (const m of months) {
    let maxR = 1
    for (const t of trends) {
      const r = rankMapPerSkill.get(t.skill)?.get(m)
      if (typeof r === 'number' && r > maxR) maxR = r
    }
    maxRankPerMonth[m] = maxR
  }

  // Transform to recharts format: one row per month, columns are scores (higher is better)
  const data: Array<Record<string, number | string>> = months.map((m) => ({
    month: m,
    monthLabel: formatMonthFR(m),
  }))
  trends.forEach((t) => {
    for (let i = 0; i < months.length; i++) {
      const m = months[i]!
      const r = rankMapPerSkill.get(t.skill)?.get(m)
      const maxR = maxRankPerMonth[m] ?? 0
      const score = typeof r === 'number' ? maxR + 1 - r : 0
      const row = data[i]!
      row[t.skill] = score
    }
  })

  // month label formatting handled via shared util (formatMonthFR)

  type TipItem = { name?: string; value?: number; color?: string }

  function getRawMonth(pl?: TipItem[]): string | number | undefined {
    const p0 = pl && pl[0]
    if (p0 && typeof p0 === 'object' && p0) {
      const inner = (p0 as unknown as { payload?: Record<string, unknown> }).payload
      const m = inner?.month
      if (typeof m === 'string' || typeof m === 'number') return m
    }
    return undefined
  }

  function CustomTooltip({ active, payload }: { active?: boolean; payload?: TipItem[] }) {
    if (!active || !payload || payload.length === 0) return null
    const rawMonth = getRawMonth(payload)
    return (
      <Box bg="white" borderWidth="1px" rounded="md" p="sm" fontSize="sm" shadow="sm">
        <Text fontWeight="semibold" mb="xs">
          {rawMonth !== undefined ? formatMonthFR(String(rawMonth)) : ''}
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

  function CustomLegend({ payload }: { payload?: Array<{ value?: string; color?: string }> }) {
    if (!payload || payload.length === 0) return null
    return (
      <Box display="flex" flexWrap="wrap" gap="sm" mt="xs">
        {payload.map((p, idx: number) => (
          <Box
            key={idx}
            display="inline-flex"
            alignItems="center"
            gap="xs"
            px="xs"
            py="1"
            rounded="md"
            borderWidth="1px"
          >
            <Box w="10px" h="10px" rounded="full" bg={p.color} />
            <Text fontSize="sm">{p.value}</Text>
          </Box>
        ))}
      </Box>
    )
  }

  return (
    <Box borderWidth="0px" p={0} bg="transparent" shadow="none">
      <Box display="flex" alignItems="center" justifyContent="space-between" gap="sm" mb="xs">
        <Text fontSize="sm" fontWeight="semibold">
          Compétences émergentes (score croissant = meilleur rang)
        </Text>
        {controlSlot ? <Box>{controlSlot}</Box> : null}
      </Box>
      <Box h={{ base: '18rem', md: '20rem' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              {...xAxisProps(isMobile)}
              tickFormatter={(v) => formatMonthFR(v)}
            />
            <YAxis allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 1000 }} />
            <Legend content={<CustomLegend />} />
            {trends.map((t, idx) => (
              <Line
                key={t.skill}
                type="monotone"
                dataKey={t.skill}
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
