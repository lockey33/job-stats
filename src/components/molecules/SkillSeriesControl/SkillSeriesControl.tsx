"use client";

import { Box, Button, Checkbox, HStack, Text } from "@chakra-ui/react";
import type { CheckboxCheckedChangeDetails } from "@chakra-ui/react";
import MultiSelect from "@/components/molecules/MultiSelect/MultiSelect";

interface Props {
  options: string[]; // available skills
  value: string[]; // selected series skills
  onChange: (next: string[]) => void;
  topSkills?: string[]; // for reset button
  autoEnabled?: boolean;
  onToggleAuto?: (auto: boolean) => void;
  onPresetTop?: (count: number) => void; // e.g., 5 or 10
}

export default function SkillSeriesControl({ options, value, onChange, topSkills, autoEnabled, onToggleAuto, onPresetTop }: Props) {
  function resetTop() {
    if (!topSkills || topSkills.length === 0) return;
    onChange(topSkills);
  }

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
          <Button
            onClick={() => onPresetTop?.(5)}
            variant="outline"
            size="sm"
            disabled={!topSkills || topSkills.length === 0}
            title="Utiliser le Top 5 actuel"
          >
            Top 5
          </Button>
          <Button
            onClick={() => onPresetTop?.(10)}
            variant="outline"
            size="sm"
            disabled={!topSkills || topSkills.length === 0}
            title="Utiliser le Top 10 actuel"
          >
            Top 10
          </Button>
          <Button
            onClick={() => onPresetTop?.(50)}
            variant="outline"
            size="sm"
            disabled={!topSkills || topSkills.length === 0}
            title="Utiliser le Top 50 actuel"
          >
            Top 50
          </Button>
          <Button
            onClick={resetTop}
            variant="ghost"
            size="sm"
            disabled={!topSkills || topSkills.length === 0}
            title="Réinitialiser au Top 10"
          >
            Reset
          </Button>
          <Checkbox.Root
            checked={!!autoEnabled}
            onCheckedChange={(detail: CheckboxCheckedChangeDetails) => onToggleAuto?.(!!detail.checked)}
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
      </Box>
    </Box>
  );
}
