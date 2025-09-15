'use client'

import { Alert, Box, Button,Stack } from '@chakra-ui/react'
import dynamic from 'next/dynamic'

import LoadingOverlay from '@/components/atoms/LoadingOverlay/LoadingOverlay'
import Section from '@/components/molecules/Section/Section'
import SkillSeriesControl from '@/components/molecules/SkillSeriesControl/SkillSeriesControl'
import type { TrendsOptions } from '@/components/molecules/TrendsControls/TrendsControls'
import TrendsControls from '@/components/molecules/TrendsControls/TrendsControls'
import ChartsSkeleton from '@/components/organisms/ChartsSkeleton/ChartsSkeleton'
import type {
  AnalyticsResult,
  EmergingSkillTrendPayload,
  MetaFacets,
  TopSkill,
} from '@/features/jobs/types/types'

const Charts = dynamic(() => import('@/components/organisms/Charts/Charts'), {
  ssr: false,
  loading: () => <ChartsSkeleton />,
})
const TopSkillsBarChart = dynamic(
  () => import('@/components/organisms/TopSkillsBarChart/TopSkillsBarChart'),
  { ssr: false },
)
const EmergingSkillsChart = dynamic(
  () => import('@/components/organisms/EmergingSkillsChart/EmergingSkillsChart'),
  { ssr: false },
)

interface Props {
  meta: MetaFacets | null
  metrics: AnalyticsResult | null
  topSkills: TopSkill[] | null
  emerging: EmergingSkillTrendPayload | null
  seriesSkills: string[] | null
  autoSeriesEnabled: boolean
  onSeriesChange: (next: string[]) => void
  onToggleAuto: (auto: boolean) => void
  trends: TrendsOptions
  setTrends: (next: TrendsOptions) => void
  loading: boolean
  fetching: boolean
  errors?: { metrics?: unknown; topSkills?: unknown; emerging?: unknown }
  onRetry?: () => void
}

export default function JobsChartsSection({
  meta,
  metrics,
  topSkills,
  emerging,
  seriesSkills,
  autoSeriesEnabled,
  onSeriesChange,
  onToggleAuto,
  trends,
  setTrends,
  loading,
  fetching,
  errors,
  onRetry,
}: Props) {
  if (loading) return <ChartsSkeleton />

  return (
    <Section title="Tendances" subtitle="Volume d’offres, TJM moyen et tendances des compétences">
      {fetching && <LoadingOverlay text="Mise à jour des graphiques…" />}
      {!!(errors && (errors.metrics || errors.topSkills || errors.emerging)) && (
        <Alert.Root status="warning" mb="md">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>Certains graphiques n&apos;ont pas pu être chargés</Alert.Title>
            <Alert.Description>
              {!!errors?.metrics && (
                <div>Metrics: {String((errors.metrics as Error)?.message ?? errors.metrics)}</div>
              )}
              {!!errors?.topSkills && (
                <div>
                  Top skills: {String((errors.topSkills as Error)?.message ?? errors.topSkills)}
                </div>
              )}
              {!!errors?.emerging && (
                <div>
                  Émergentes: {String((errors.emerging as Error)?.message ?? errors.emerging)}
                </div>
              )}
            </Alert.Description>
            <Box mt="sm">
              <Button size="sm" onClick={onRetry} variant="outline" colorPalette="brand">
                Réessayer
              </Button>
            </Box>
          </Alert.Content>
        </Alert.Root>
      )}
      <Stack gap="md">
        {/* Période pour les courbes */}
        <TrendsControls value={trends} onChange={setTrends} variant="period" />

        <Charts metrics={metrics} months={trends.months} mode="basics" />
        <Box as="hr" borderTopWidth="1px" borderColor="border" my="md" />

        <Charts
          metrics={metrics}
          months={trends.months}
          mode="skills"
          controlSlot={
            meta ? (
              <SkillSeriesControl
                options={meta.skills}
                value={seriesSkills ?? []}
                onChange={(next) => onSeriesChange(next)}
                autoEnabled={autoSeriesEnabled}
                onToggleAuto={(auto) => onToggleAuto(auto)}
              />
            ) : null
          }
        />
        
        <Box as="hr" borderTopWidth="1px" borderColor="border" my="md" />

        {/* Top compétences: contrôle local sous le titre */}
        <TopSkillsBarChart
          data={topSkills ?? null}
          maxItems={trends.topSkillsLimit}
          controlSlot={<TrendsControls value={trends} onChange={setTrends} variant="topSkills" />}
        />
        <Box as="hr" borderTopWidth="1px" borderColor="border" my="md" />

        {/* Émergentes: contrôle local sous le titre */}
        <EmergingSkillsChart
          payload={emerging ?? null}
          limit={trends.emergingLimit}
          controlSlot={<TrendsControls value={trends} onChange={setTrends} variant="emerging" />}
        />
      </Stack>
    </Section>
  )
}
