"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { AnalyticsResult } from '@/lib/domain/types';
import { Box, Text } from '@chakra-ui/react';

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

interface Props {
  data: AnalyticsResult | null;
}

export default function Charts({ data }: Props) {
  if (!data) return null;

  return (
    <Box display="grid" gridTemplateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap="lg">
      {/* Postings per month */}
      <Box borderWidth="0px" p={0} bg="transparent" shadow="none">
        <Text fontSize="sm" fontWeight="semibold" mb="sm">Nombre d'offres par mois</Text>
        <Box h="16rem">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.postingsPerMonth} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Box>

      {/* Average TJM per month */}
      <Box borderWidth="0px" p={0} bg="transparent" shadow="none">
        <Text fontSize="sm" fontWeight="semibold" mb="sm">TJM moyen par mois (€)</Text>
        <Box h="16rem">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.avgTjmPerMonth} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Box>

      {/* Skills trends per month */}
      <Box borderWidth="0px" p={0} bg="transparent" shadow="none" gridColumn={{ lg: '1 / -1' }}>
        <Text fontSize="sm" fontWeight="semibold" mb="xs">Tendances des skills</Text>
        <Text fontSize="xs" color="gray.600" mb="sm">Vous pouvez ajouter/retirer des skills à tracer depuis le sélecteur ci-dessus.</Text>
        <Box h="20rem">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.skillsPerMonth} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              {data.seriesSkills.map((s, idx) => (
                <Line key={s} type="monotone" dataKey={s} stroke={COLORS[idx % COLORS.length]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    </Box>
  );
}
