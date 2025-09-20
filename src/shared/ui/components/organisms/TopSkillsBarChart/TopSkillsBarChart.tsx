'use client'

import { Box, Text, useBreakpointValue } from '@chakra-ui/react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import type { TopSkill } from '@/features/jobs/types/types'

interface Props {
  data: TopSkill[] | null
  maxItems?: number
  controlSlot?: React.ReactNode
}

export default function TopSkillsBarChart({ data, maxItems = 50, controlSlot }: Props) {
  const isMobile = useBreakpointValue({ base: true, md: false }) ?? false
  if (!data || data.length === 0) return null
  const chartData = data.slice(0, maxItems).map((d) => ({ name: d.skill, value: d.count }))
  type TipItem = { value?: number }
  function CustomTooltip({
    active,
    payload,
    label,
  }: {
    active?: boolean
    payload?: TipItem[]
    label?: string
  }) {
    if (!active || !payload || payload.length === 0) return null
    const val = payload[0]?.value as number | undefined
    return (
      <Box bg="white" borderWidth="1px" rounded="md" p="sm" fontSize="sm" shadow="sm">
        <Text fontWeight="semibold" mb="xs">
          {label}
        </Text>
        <Text>{typeof val === 'number' ? val.toLocaleString('fr-FR') : '—'} offres</Text>
      </Box>
    )
  }
  return (
    <Box borderWidth="0px" p={0} bg="transparent" shadow="none">
      <Box display="flex" alignItems="center" justifyContent="space-between" gap="sm" mb="xs">
        <Text fontSize="sm" fontWeight="semibold">
          Top {maxItems} des compétences (nombre d&apos;offres)
        </Text>
        {controlSlot ? <Box>{controlSlot}</Box> : null}
      </Box>
      <Box h={{ base: '18rem', md: '24rem' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 16, bottom: isMobile ? 10 : 40, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              angle={isMobile ? 0 : -45}
              textAnchor={isMobile ? 'middle' : 'end'}
              interval={isMobile ? 'preserveStartEnd' : 0}
              height={isMobile ? 16 : 80}
              tick={isMobile ? false : true}
            />
            <YAxis allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  )
}
