'use client'

import { useEffect } from 'react'
import { Box, Button, Heading, Text } from '@chakra-ui/react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Optionally log to an error reporting service
    // console.error(error);
  }, [error])
  return (
    <Box p="lg" display="flex" flexDirection="column" gap="sm" alignItems="flex-start">
      <Heading size="md">Un problème est survenu</Heading>
      <Text fontSize="sm" color="gray.600">
        {error.message}
      </Text>
      <Button size="sm" variant="outline" colorPalette="brand" onClick={() => reset()}>
        Réessayer
      </Button>
    </Box>
  )
}
