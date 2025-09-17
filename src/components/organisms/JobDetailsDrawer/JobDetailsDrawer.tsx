'use client'

import { Box, Button, Drawer, Text } from '@chakra-ui/react'

import TagsList from '@/components/atoms/TagsList/TagsList'
import type { JobItem } from '@/features/jobs/types/types'
import { cityToRegion } from '@/shared/geo/regions'
import { decodeHtmlEntities, htmlToPlainText } from '@/shared/utils/text'

interface Props {
  job: JobItem | null
  onClose: () => void
}

function formatTjm(min?: number | null, max?: number | null) {
  if (min == null && max == null) return '—'
  const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n)
  if (min != null && max != null) return `${fmt(min)}–${fmt(max)} €`
  const v = (min ?? max) as number
  return `${fmt(v)} €`
}

// replaced by htmlToPlainText from shared utils

function formatExperience(exp?: string | null): string {
  const v = (exp || '').toString().toLowerCase()
  switch (v) {
    case 'junior':
      return 'Junior'
    case 'intermediate':
      return 'Confirmé'
    case 'senior':
      return 'Senior'
    default:
      return exp || '—'
  }
}

function formatRemote(remote?: string | null): string {
  const v = (remote || '').toString().toLowerCase()
  switch (v) {
    case 'full':
      return 'Total'
    case 'partial':
      return 'Partiel'
    case 'none':
      return 'Aucun'
    default:
      return remote || '—'
  }
}

export default function JobDetailsDrawer({ job, onClose }: Props) {
  const open = !!job
  const title = decodeHtmlEntities(job?.title ?? job?.slug ?? job?.job_slug ?? 'Offre')
  const region = job ? (cityToRegion(job.city ?? undefined) ?? '—') : '—'

  return (
    <Drawer.Root
      open={open}
      size="lg"
      placement="end"
      onOpenChange={(e) => {
        if (!e.open) onClose()
      }}
    >
      <Drawer.Backdrop />
      <Drawer.Positioner>
        <Drawer.Content maxW={{ base: '100%', md: '42rem', lg: '56rem' }}>
          <Drawer.Header borderBottomWidth="1px" borderColor="border">
            <Drawer.Title>{title}</Drawer.Title>
            <Drawer.CloseTrigger asChild>
              <Button size="xs" variant="outline" aria-label="Fermer">
                ✕
              </Button>
            </Drawer.CloseTrigger>
          </Drawer.Header>
          <Drawer.Body>
            {job && (
              <Box display="grid" gridTemplateColumns={{ base: '1fr', md: '1fr 1.5fr' }} gap="md">
                <Box display="flex" flexDirection="column" gap="sm">
                  <Box>
                    <Text fontSize="xs" textTransform="uppercase" color="gray.500">
                      Entreprise
                    </Text>
                    <Text fontSize="sm">{job.company_name ?? '—'}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" textTransform="uppercase" color="gray.500">
                      Localisation
                    </Text>
                    <Text fontSize="sm">
                      {job.city ?? '—'}
                      {region !== '—' ? ` • ${region}` : ''}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" textTransform="uppercase" color="gray.500">
                      Télétravail
                    </Text>
                    <Text fontSize="sm">{formatRemote(job.remote)}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" textTransform="uppercase" color="gray.500">
                      Expérience
                    </Text>
                    <Text fontSize="sm">{formatExperience(job.experience)}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" textTransform="uppercase" color="gray.500">
                      TJM
                    </Text>
                    <Text fontSize="sm">
                      {formatTjm(job.min_tjm ?? undefined, job.max_tjm ?? undefined)}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" textTransform="uppercase" color="gray.500">
                      Coordonnées
                    </Text>
                    <Text fontSize="sm">
                      {job.lat ?? '—'} / {job.long ?? '—'}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" textTransform="uppercase" color="gray.500">
                      ID
                    </Text>
                    <Text fontSize="sm">{job.id}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" textTransform="uppercase" color="gray.500">
                      Skills
                    </Text>
                    <Box mt="xs">
                      <TagsList items={job.skills ?? []} />
                    </Box>
                  </Box>
                  <Box>
                    <Text fontSize="xs" textTransform="uppercase" color="gray.500">
                      Soft skills
                    </Text>
                    <Box mt="xs">
                      <TagsList items={job.soft_skills ?? []} />
                    </Box>
                  </Box>
                </Box>

                <Box display="flex" flexDirection="column" gap="md" minH={0}>
                  <Box>
                    <Text fontSize="xs" textTransform="uppercase" color="gray.500" mb="xs">
                      Description
                    </Text>
                    <Text fontSize="sm" whiteSpace="pre-line" lineHeight="tall">
                      {htmlToPlainText(job.description) || '—'}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" textTransform="uppercase" color="gray.500" mb="xs">
                      Profil recherché
                    </Text>
                    <Text fontSize="sm" whiteSpace="pre-line" lineHeight="tall">
                      {htmlToPlainText(job.candidate_profile) || '—'}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" textTransform="uppercase" color="gray.500" mb="xs">
                      À propos
                    </Text>
                    <Text fontSize="sm" whiteSpace="pre-line" lineHeight="tall">
                      {htmlToPlainText(job.company_description) || '—'}
                    </Text>
                  </Box>
                </Box>
              </Box>
            )}
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Positioner>
    </Drawer.Root>
  )
}
