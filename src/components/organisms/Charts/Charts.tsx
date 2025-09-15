'use client'

import React from 'react'
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
import { AnalyticsResult } from '@/features/jobs/types/types'
import { Box, Text } from '@chakra-ui/react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

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

type Mode = 'basics' | 'skills'

interface Props {
  metrics: AnalyticsResult | null
  months?: 6 | 12 | 24
  smooth?: boolean
  mode?: Mode
}

export default function Charts({ metrics, months = 12, smooth = false, mode = 'basics' }: Props) {
  if (!metrics) return null

  const fmtMonth = (m: string) => {
    const d = new Date(`${m}-01`)
    if (isNaN(d.getTime())) return m
    return format(d, 'MMM yyyy', { locale: fr })
  }

  function SimpleTooltip({
    active,
    payload,
    label,
    unit,
  }: {
    active?: boolean
    payload?: any[]
    label?: string
    unit?: string
  }) {
    if (!active || !payload || payload.length === 0) return null
    const val = payload[0]?.value as number | undefined
    return (
      <Box bg="white" borderWidth="1px" rounded="md" p="sm" fontSize="sm" shadow="sm">
        <Text fontWeight="semibold" mb="xs">
          {label ? fmtMonth(String(label)) : ''}
        </Text>
        <Text>
          {typeof val === 'number' ? val.toLocaleString('fr-FR') : '—'}
          {unit ? ` ${unit}` : ''}
        </Text>
      </Box>
    )
  }

  function MultiTooltip({
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

  function SimpleLegend({ payload }: { payload?: any[] }) {
    if (!payload || payload.length === 0) return null
    return (
      <Box display="flex" flexWrap="wrap" gap="sm" mt="xs">
        {payload.map((p: any, idx: number) => {
          const name = p.value as string
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

  function ma3(
    series: Array<Record<string, number | string>>,
  ): Array<Record<string, number | string>> {
    if (!smooth) return series
    // Apply moving average on numeric series keys (ignoring 'month')
    const out = series.map((row) => ({ ...row }))
    for (let i = 0; i < series.length; i++) {
      const acc: Record<string, number> = {}
      let count = 0
      for (let j = Math.max(0, i - 1); j <= Math.min(series.length - 1, i + 1); j++) {
        const r = series[j]
        Object.keys(r).forEach((k) => {
          if (k === 'month') return
          const v = r[k]
          if (typeof v === 'number') {
            acc[k] = (acc[k] || 0) + v
          }
        })
        count++
      }
      Object.keys(acc).forEach((k) => {
        ;(out[i] as any)[k] = Math.round((acc[k] / count) * 100) / 100
      })
    }
    return out
  }

  // Slice datasets
  const postingsPerMonth = metrics.postingsPerMonth.filter((p) => keptMonths.includes(p.month))
  const avgTjmPerMonth = metrics.avgTjmPerMonth.filter((p) => keptMonths.includes(p.month))
  const skillsPerMonth = ma3(
    metrics.skillsPerMonth.filter((p) => keptMonths.includes(String(p.month))),
  )

  // Allow toggling series visibility for skills
  const [hidden, setHidden] = React.useState<string[]>([])
  function toggleSeries(name: string) {
    setHidden((prev) => (prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]))
  }

  if (mode === 'basics') {
    return (
      <Box display="grid" gridTemplateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap="lg">
        <Box borderWidth="0px" p={0} bg="transparent" shadow="none">
          <Text fontSize="sm" fontWeight="semibold" mb="sm">
            Nombre d’offres par mois
          </Text>
          <Box h="16rem">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={postingsPerMonth}
                margin={{ top: 10, right: 20, bottom: 0, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tickFormatter={fmtMonth} />
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
          <Box h="16rem">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={avgTjmPerMonth} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tickFormatter={fmtMonth} />
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
        Tendances des skills
      </Text>
      <Text fontSize="xs" color="gray.600" mb="sm">
        Ajoutez/retirez des skills via le sélecteur, et cliquez sur la légende pour masquer/afficher
        une série.
      </Text>
      <Box h="20rem">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={skillsPerMonth} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tickFormatter={fmtMonth} />
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
