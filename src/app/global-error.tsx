'use client'

import { Box, Button, Heading, Text } from '@chakra-ui/react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="fr">
      <body>
        <Box p="lg" display="flex" flexDirection="column" gap="sm" alignItems="flex-start">
          <Heading size="md">Erreur critique</Heading>
          <Text fontSize="sm" color="gray.600">
            {error.message}
          </Text>
          {error.digest && (
            <Text fontSize="xs" color="gray.500">
              Ref: {error.digest}
            </Text>
          )}
          <Button size="sm" variant="outline" colorPalette="brand" onClick={() => reset()}>
            Recharger
          </Button>
        </Box>
      </body>
    </html>
  )
}
