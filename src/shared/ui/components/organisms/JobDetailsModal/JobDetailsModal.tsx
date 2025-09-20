'use client'

import { Box, Button, Dialog, Text } from '@chakra-ui/react'
import { useEffect } from 'react'

import type { JobItem } from '@/features/jobs/types/types'
import { cityToRegion } from '@/shared/geo/regions'
import TagsList from '@/shared/ui/components/atoms/TagsList/TagsList'
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

// replaced by htmlToPlainText from shared utils

export default function JobDetailsModal({ job, onClose }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const open = !!job
  const region = job ? (cityToRegion(job.city ?? undefined) ?? '—') : '—'

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => {
        if (!e.open) onClose()
      }}
      placement="center"
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content maxW="3xl">
          <Dialog.Header>
            <Dialog.Title>
              {decodeHtmlEntities(job?.title ?? job?.slug ?? job?.job_slug ?? 'Offre')}
            </Dialog.Title>
            <Dialog.CloseTrigger asChild>
              <Button size="xs" variant="outline" onClick={onClose} aria-label="Fermer">
                ✕
              </Button>
            </Dialog.CloseTrigger>
          </Dialog.Header>
          <Dialog.Body>
            {job && (
              <Box display="grid" gridTemplateColumns={{ base: '1fr', md: '1fr 2fr' }} gap="md">
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
                    <Text fontSize="sm">{formatRemote(job.remote ?? undefined)}</Text>
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

                <Box display="flex" flexDirection="column" gap="md">
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
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  )
}
