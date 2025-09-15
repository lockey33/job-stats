'use client'

import { Box, Button, Heading, Text } from '@chakra-ui/react'
import Link from 'next/link'

export default function NotFound() {
  return (
    <Box p="lg" display="flex" flexDirection="column" gap="sm" alignItems="flex-start">
      <Heading size="md">Page introuvable</Heading>
      <Text fontSize="sm" color="gray.600">
        La ressource demandée n’existe pas ou a été déplacée.
      </Text>
      <Link href="/">
        <Button as="span" size="sm" variant="outline" colorPalette="brand">
          Retour à l’accueil
        </Button>
      </Link>
    </Box>
  )
}
