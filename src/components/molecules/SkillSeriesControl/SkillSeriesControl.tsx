'use client'

import { Box, Checkbox, HStack, Text } from '@chakra-ui/react'
import type { CheckboxCheckedChangeDetails } from '@chakra-ui/react'
import MultiSelect from '@/components/molecules/MultiSelect/MultiSelect'

interface Props {
  options: string[] // available skills
  value: string[] // selected series skills
  onChange: (next: string[]) => void
  topSkills?: string[] // for reset button
  autoEnabled?: boolean
  onToggleAuto?: (auto: boolean) => void
}

export default function SkillSeriesControl({
  options,
  value,
  onChange,
  topSkills,
  autoEnabled,
  onToggleAuto,
}: Props) {
  return (
    <Box w="full">
      <Box display="flex" flexDirection="column" gap={2}>
        <MultiSelect
          options={options}
          value={value}
          onChange={onChange}
          placeholder="Rechercher un skill à ajouter…"
          dedupeByNormalized
        />

        <HStack gap={2} align="center">
          <Checkbox.Root
            checked={!!autoEnabled}
            onCheckedChange={(detail: CheckboxCheckedChangeDetails) =>
              onToggleAuto?.(!!detail.checked)
            }
            aria-label="Suivre automatiquement le Top 10"
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            <Checkbox.Label>
              <Text fontSize="xs">Auto Top 10</Text>
            </Checkbox.Label>
          </Checkbox.Root>
        </HStack>

        <Text fontSize="xs" color="textMuted">
          Le Top 10 est généré automatiquement en fonction de votre recherche et des filtres
          appliqués.
        </Text>
      </Box>
    </Box>
  )
}
