'use client'

import { Box, Spinner, Text } from '@chakra-ui/react'

interface Props {
  text?: string
}

export default function LoadingOverlay({ text }: Props) {
  return (
    <Box
      position="absolute"
      top="0"
      right="0"
      bottom="0"
      left="0"
      bg="whiteAlpha.700"
      zIndex={1}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Box
        display="inline-flex"
        flexDirection="column"
        alignItems="center"
        gap="xs"
        p="sm"
        rounded="md"
        borderWidth="0px"
        bg="transparent"
      >
        <Spinner size="sm" borderWidth="2px" />
        {text && (
          <Text fontSize="xs" color="gray.700">
            {text}
          </Text>
        )}
      </Box>
    </Box>
  )
}
