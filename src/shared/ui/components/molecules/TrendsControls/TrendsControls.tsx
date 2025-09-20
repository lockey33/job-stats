'use client'

import { Box, Button, HStack, Text } from '@chakra-ui/react'

export interface TrendsOptions {
  months: 6 | 12 | 24
  topSkillsLimit: 10 | 25 | 50
  emergingLimit: 5 | 10 | 15
}

interface Props {
  value: TrendsOptions
  onChange: (next: TrendsOptions) => void
  variant?: 'all' | 'period' | 'topSkills' | 'emerging'
}

export default function TrendsControls({ value, onChange, variant = 'all' }: Props) {
  function set<K extends keyof TrendsOptions>(key: K, v: TrendsOptions[K]) {
    onChange({ ...value, [key]: v })
  }

  return (
    <Box
      display="flex"
      flexDirection={{ base: 'column', md: 'row' }}
      gap="sm"
      alignItems={{ md: 'center' }}
      justifyContent="space-between"
    >
      {(variant === 'all' || variant === 'period') && (
        <HStack gap="xs" align="center">
          <Text fontSize="sm" color="textMuted">
            Période
          </Text>
          {[6, 12, 24].map((m) => (
            <Button
              key={m}
              size="xs"
              variant={value.months === (m as 6 | 12 | 24) ? 'solid' : 'outline'}
              onClick={() => set('months', m as 6 | 12 | 24)}
            >
              {m} mois
            </Button>
          ))}
        </HStack>
      )}
      {(variant === 'all' || variant === 'topSkills') && (
        <HStack gap="xs" align="center">
          <Text fontSize="sm" color="textMuted">
            Top compétences
          </Text>
          {[10, 25, 50].map((n) => (
            <Button
              key={n}
              size="xs"
              variant={value.topSkillsLimit === (n as 10 | 25 | 50) ? 'solid' : 'outline'}
              onClick={() => set('topSkillsLimit', n as 10 | 25 | 50)}
            >
              {n}
            </Button>
          ))}
        </HStack>
      )}
      {(variant === 'all' || variant === 'emerging') && (
        <HStack gap="xs" align="center">
          <Text fontSize="sm" color="textMuted">
            Émergentes
          </Text>
          {[5, 10, 15].map((n) => (
            <Button
              key={n}
              size="xs"
              variant={value.emergingLimit === (n as 5 | 10 | 15) ? 'solid' : 'outline'}
              onClick={() => set('emergingLimit', n as 5 | 10 | 15)}
            >
              Top {n}
            </Button>
          ))}
        </HStack>
      )}
    </Box>
  )
}
