'use client'

import { Box, Heading, Text } from '@chakra-ui/react'

interface Props {
  title: React.ReactNode
  subtitle?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
}

export default function ChartCard({ title, subtitle, actions, children }: Props) {
  return (
    <Box bg="surface" borderWidth="1px" borderColor="border" rounded="lg" shadow="sm" p="md">
      <Box
        display="flex"
        alignItems={{ base: 'flex-start', md: 'center' }}
        justifyContent="space-between"
        gap="sm"
        mb="sm"
      >
        <Box>
          {typeof title === 'string' ? (
            <Heading as="h3" size="sm">
              {title}
            </Heading>
          ) : (
            title
          )}
          {subtitle && (
            <Text fontSize="xs" color="textMuted" mt="1">
              {subtitle}
            </Text>
          )}
        </Box>
        {actions && (
          <Box display="flex" alignItems="center" gap="xs">
            {actions}
          </Box>
        )}
      </Box>
      {children}
    </Box>
  )
}
