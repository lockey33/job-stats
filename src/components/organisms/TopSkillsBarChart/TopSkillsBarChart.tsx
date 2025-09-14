"use client";

import { Box, Text } from "@chakra-ui/react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { TopSkill } from "@/features/jobs/types/types";

interface Props {
  data: TopSkill[] | null;
  maxItems?: number;
}

export default function TopSkillsBarChart({ data, maxItems = 50 }: Props) {
  if (!data || data.length === 0) return null;
  const chartData = data.slice(0, maxItems).map((d) => ({ name: d.skill, value: d.count }));
  function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
    if (!active || !payload || payload.length === 0) return null;
    const val = payload[0]?.value as number | undefined;
    return (
      <Box bg="white" borderWidth="1px" rounded="md" p="sm" fontSize="sm" shadow="sm">
        <Text fontWeight="semibold" mb="xs">{label}</Text>
        <Text>{typeof val === 'number' ? val.toLocaleString('fr-FR') : '—'} offres</Text>
      </Box>
    );
  }
  return (
    <Box borderWidth="0px" p={0} bg="transparent" shadow="none">
      <Text fontSize="sm" fontWeight="semibold" mb="xs">Top 50 des skills (nombre d&apos;offres)</Text>
      <Box h="24rem">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 40, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={80} />
            <YAxis allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}
