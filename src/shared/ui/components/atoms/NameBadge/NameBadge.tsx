"use client"

import { Box, Image,Link as ChakraLink, Text } from "@chakra-ui/react"
import React from "react"

type Props = {
  name: string
  linkedinUrl: string
}

export default function NameBadge({ name, linkedinUrl }: Props) {
  return (
    <Box position="fixed" top={{ base: 3, md: 4 }} right={{ base: 3, md: 4 }} zIndex={1400}>
      <ChakraLink
        href={linkedinUrl}
        target="_blank"
        rel="noopener noreferrer"
        _focusVisible={{ boxShadow: "outline" }}
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        whiteSpace="nowrap"
        lineHeight="1"
        fontSize="md"
        gap={3}
        px={4}
        h={10}
        borderRadius="full"
        bg="white"
        boxShadow="0 8px 24px rgba(2,6,23,0.12), 0 2px 6px rgba(2,6,23,0.08)"
        borderWidth="1px"
        borderColor="blackAlpha.100"
        _hover={{ boxShadow: "0 10px 28px rgba(2,6,23,0.16), 0 4px 10px rgba(2,6,23,0.10)", transform: "translateY(-1px)" }}
        transition="all 0.15s ease"
        aria-label={`Voir le profil LinkedIn de ${name}`}
      >
        <Text
          fontWeight="600"
          letterSpacing="0.2px"
          color="gray.800"
          lineHeight="1"
          display="flex"
          alignItems="center"
        >
          {name}
        </Text>
        <Image src="/assets/linkedin.svg" alt="" aria-hidden="true" boxSize="1.1em" display="block" />
      </ChakraLink>
    </Box>
  )
}
