"use client";

import { Box, Text } from "@chakra-ui/react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { EmergingSkillTrendPayload } from "@/features/jobs/types/types";

interface Props {
  payload: EmergingSkillTrendPayload | null;
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
];

export default function EmergingSkillsChart({ payload }: Props) {
  if (!payload || !payload.trends || payload.trends.length === 0) return null;

  const months = payload.months;

  // Build a quick lookup for rank per month per skill
  const rankMapPerSkill = new Map<string, Map<string, number>>();
  for (const t of payload.trends) {
    rankMapPerSkill.set(t.skill, new Map(t.monthly.map((r) => [r.month, r.rank])));
  }

  // Compute the max rank seen per month (to transform rank -> ascending score)
  const maxRankPerMonth: Record<string, number> = {};
  for (const m of months) {
    let maxR = 1;
    for (const t of payload.trends) {
      const r = rankMapPerSkill.get(t.skill)?.get(m);
      if (typeof r === 'number' && r > maxR) maxR = r;
    }
    maxRankPerMonth[m] = maxR;
  }

  // Transform to recharts format: one row per month, columns are scores (higher is better)
  const data: Array<Record<string, number | string>> = months.map((m) => ({ month: m }));
  payload.trends.forEach((t) => {
    for (let i = 0; i < months.length; i++) {
      const m = months[i];
      const r = rankMapPerSkill.get(t.skill)?.get(m);
      // score = maxRank + 1 - rank  => increases as rank improves
      const score = typeof r === 'number' ? (maxRankPerMonth[m] + 1 - r) : 0;
      data[i][t.skill] = score;
    }
  });

  return (
    <Box borderWidth="0px" p={0} bg="transparent" shadow="none">
      <Text fontSize="sm" fontWeight="semibold" mb="xs">Tendances émergentes (score croissant ~ meilleur rang)</Text>
      <Box h="20rem">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            {payload.trends.map((t, idx) => (
              <Line key={t.skill} type="monotone" dataKey={t.skill} stroke={COLORS[idx % COLORS.length]} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}
