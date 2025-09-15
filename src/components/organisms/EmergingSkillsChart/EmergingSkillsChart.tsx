'use client'

import { Box, Text } from '@chakra-ui/react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { EmergingSkillTrendPayload } from '@/features/jobs/types/types'

interface Props {
  payload: EmergingSkillTrendPayload | null
  limit?: number
}

const COLORS = [
  '#2563eb',
  '#16a34a',
  '#dc2626',
  '#7c3aed',
  '#ea580c',
  '#0ea5e9',
  '#22c55e',
  '#e11d48',
  '#a855f7',
  '#f59e0b',
]

export default function EmergingSkillsChart({ payload, limit = 10 }: Props) {
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
  const data: Array<Record<string, number | string>> = months.map((m) => ({ month: m }))
  trends.forEach((t) => {
    for (let i = 0; i < months.length; i++) {
      const m = months[i]
      const r = rankMapPerSkill.get(t.skill)?.get(m)
      // score = maxRank + 1 - rank  => increases as rank improves
      const score = typeof r === 'number' ? maxRankPerMonth[m] + 1 - r : 0
      data[i][t.skill] = score
    }
  })

  const fmtMonth = (m: string) => {
    const d = new Date(`${m}-01`)
    if (isNaN(d.getTime())) return m
    return format(d, 'MMM yyyy', { locale: fr })
  }

  function CustomTooltip({
    active,
    payload,
    label,
  }: {
    active?: boolean
    payload?: any[]
    label?: string
  }) {
    if (!active || !payload || payload.length === 0) return null
    return (
      <Box bg="white" borderWidth="1px" rounded="md" p="sm" fontSize="sm" shadow="sm">
        <Text fontWeight="semibold" mb="xs">
          {label ? fmtMonth(String(label)) : ''}
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

  function CustomLegend({ payload }: { payload?: any[] }) {
    if (!payload || payload.length === 0) return null
    return (
      <Box display="flex" flexWrap="wrap" gap="sm" mt="xs">
        {payload.map((p: any, idx: number) => (
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
      <Text fontSize="sm" fontWeight="semibold" mb="xs">
        Tendances émergentes (score croissant ~ meilleur rang)
      </Text>
      <Box h="20rem">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tickFormatter={fmtMonth} />
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
