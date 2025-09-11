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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Postings per month */}
      <div className="rounded-lg border border-gray-200 dark:border-zinc-800 p-3">
        <h3 className="text-sm font-semibold mb-2">Nombre d'offres par mois</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.postingsPerMonth} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Average TJM per month */}
      <div className="rounded-lg border border-gray-200 dark:border-zinc-800 p-3">
        <h3 className="text-sm font-semibold mb-2">TJM moyen par mois (€)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.avgTjmPerMonth} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Skills trends per month */}
      <div className="lg:col-span-2 rounded-lg border border-gray-200 dark:border-zinc-800 p-3">
        <h3 className="text-sm font-semibold mb-1">Tendances des skills</h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Vous pouvez ajouter/retirer des skills à tracer depuis le sélecteur ci-dessus.</p>
        <div className="h-80">
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
        </div>
      </div>
    </div>
  );
}
