"use client";

import { useEffect } from "react";
import { JobItem } from "@/lib/domain/types";
import { cityToRegion } from "@/lib/domain/regions";
import { Dialog, Box, Text, Tag, Button } from "@chakra-ui/react";

interface Props {
  job: JobItem | null;
  onClose: () => void;
}

function formatTjm(min?: number | null, max?: number | null) {
  if (min == null && max == null) return "—";
  if (min != null && max != null) return `${min}–${max} €`;
  return `${min ?? max} €`;
}

function stripHtml(input?: string | null) {
  if (!input) return "";
  return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export default function JobDetailsModal({ job, onClose }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const open = !!job;
  const region = job ? (cityToRegion(job.city ?? undefined) ?? "—") : "—";

  return (
    <Dialog.Root open={open} onOpenChange={(e) => { if (!e.open) onClose(); }} placement="center">
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content maxW="3xl">
          <Dialog.Header>
            <Dialog.Title>
              {job?.title ?? job?.slug ?? job?.job_slug ?? "Offre"}
            </Dialog.Title>
            <Dialog.CloseTrigger asChild>
              <Button size="xs" variant="outline" onClick={onClose} aria-label="Fermer">✕</Button>
            </Dialog.CloseTrigger>
          </Dialog.Header>
          <Dialog.Body>
            {job && (
              <Box display="grid" gridTemplateColumns={{ base: "1fr", md: "1fr 2fr" }} gap="md">
                <Box display="flex" flexDirection="column" gap="sm">
                  <Box>
                    <Text fontSize="xs" textTransform="uppercase" color="gray.500">Entreprise</Text>
                    <Text fontSize="sm">{job.company_name ?? "—"}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" textTransform="uppercase" color="gray.500">Localisation</Text>
                    <Text fontSize="sm">{job.city ?? "—"}{region !== "—" ? ` • ${region}` : ""}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" textTransform="uppercase" color="gray.500">Télétravail</Text>
                    <Text fontSize="sm">{job.remote ?? "—"}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" textTransform="uppercase" color="gray.500">Expérience</Text>
                    <Text fontSize="sm">{job.experience ?? "—"}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" textTransform="uppercase" color="gray.500">TJM</Text>
                    <Text fontSize="sm">{formatTjm(job.min_tjm ?? undefined, job.max_tjm ?? undefined)}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" textTransform="uppercase" color="gray.500">Coordonnées</Text>
                    <Text fontSize="sm">{job.lat ?? "—"} / {job.long ?? "—"}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" textTransform="uppercase" color="gray.500">ID</Text>
                    <Text fontSize="sm">{job.id}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" textTransform="uppercase" color="gray.500">Skills</Text>
                    <Box display="flex" flexWrap="wrap" gap="xs" mt="xs">
                      {(job.skills ?? []).map((s, i) => (
                        <Tag.Root key={`${job.id}-skill-${i}`} size="sm"><Tag.Label>{s}</Tag.Label></Tag.Root>
                      ))}
                    </Box>
                  </Box>
                  <Box>
                    <Text fontSize="xs" textTransform="uppercase" color="gray.500">Soft skills</Text>
                    <Box display="flex" flexWrap="wrap" gap="xs" mt="xs">
                      {(job.soft_skills ?? []).map((s, i) => (
                        <Tag.Root key={`${job.id}-soft-${i}`} size="sm"><Tag.Label>{s}</Tag.Label></Tag.Root>
                      ))}
                    </Box>
                  </Box>
                </Box>

                <Box display="flex" flexDirection="column" gap="md">
                  <Box>
                    <Text fontSize="xs" textTransform="uppercase" color="gray.500" mb="xs">Description</Text>
                    <Text fontSize="sm" whiteSpace="pre-line" lineHeight="tall">{stripHtml(job.description) || "—"}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" textTransform="uppercase" color="gray.500" mb="xs">Profil recherché</Text>
                    <Text fontSize="sm" whiteSpace="pre-line" lineHeight="tall">{stripHtml(job.candidate_profile) || "—"}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" textTransform="uppercase" color="gray.500" mb="xs">À propos</Text>
                    <Text fontSize="sm" whiteSpace="pre-line" lineHeight="tall">{stripHtml(job.company_description) || "—"}</Text>
                  </Box>
                </Box>
              </Box>
            )}
          </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
