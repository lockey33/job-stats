'use client'

import { Box, Heading, Text } from '@chakra-ui/react'

interface Props {
  id?: string
  title?: React.ReactNode
  subtitle?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
}

export default function Section({ id, title, subtitle, actions, children }: Props) {
  const hasHeader = !!title || !!subtitle || !!actions
  return (
    <Box
      id={id}
      bg="surface"
      borderWidth="1px"
      borderColor="border"
      rounded="lg"
      shadow="sm"
      p="md"
    >
      {hasHeader && (
        <Box
          display="flex"
          flexDirection={{ base: 'column', md: 'row' }}
          alignItems={{ base: 'flex-start', md: 'center' }}
          justifyContent="space-between"
          gap="sm"
          mb="sm"
        >
          <Box>
            {typeof title === 'string' ? (
              <Heading as="h2" size="md" lineHeight="short">
                {title}
              </Heading>
            ) : (
              title
            )}
            {subtitle && (
              <Text fontSize="sm" color="textMuted" mt="1">
                {subtitle}
              </Text>
            )}
          </Box>
          {actions && (
            <Box display="flex" alignItems="center" gap="sm" mt={{ base: 'xs', md: 0 }}>
              {actions}
            </Box>
          )}
        </Box>
      )}
      {children}
    </Box>
  )
}
