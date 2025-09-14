"use client";

import { Box, Skeleton, SkeletonText } from "@chakra-ui/react";

export default function ResultsSkeleton() {
  return (
    <Box w="full">
      <SkeletonText noOfLines={1} mt="0" mb="sm" />
      <Box borderTopWidth="1px" borderColor="neutral.200" rounded="lg" overflow="hidden">
        {/* Header row skeleton */}
        <Box display="grid" gridTemplateColumns="2fr 1fr 1fr 1fr 1fr 2fr 1fr" bg="neutral.50" px="md" py="sm" gap="md">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} height="16px" />
          ))}
        </Box>
        {/* Body rows skeleton */}
        {Array.from({ length: 6 }).map((_, r) => (
          <Box key={r} display="grid" gridTemplateColumns="2fr 1fr 1fr 1fr 1fr 2fr 1fr" px="md" py="sm" gap="md" borderTopWidth="1px" borderColor="neutral.200">
            {Array.from({ length: 7 }).map((_, c) => (
              <Skeleton key={c} height="14px" />
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
