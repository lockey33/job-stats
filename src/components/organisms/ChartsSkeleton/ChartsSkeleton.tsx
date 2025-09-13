"use client";

import { Box, Skeleton, SkeletonText } from "@chakra-ui/react";

export default function ChartsSkeleton() {
  return (
    <Box display="grid" gridTemplateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap="lg">
      <Box>
        <SkeletonText noOfLines={1} mb="sm" />
        <Skeleton height="16rem" rounded="md" />
      </Box>
      <Box>
        <SkeletonText noOfLines={1} mb="sm" />
        <Skeleton height="16rem" rounded="md" />
      </Box>
      <Box gridColumn={{ lg: '1 / -1' }}>
        <SkeletonText noOfLines={2} mb="sm" />
        <Skeleton height="20rem" rounded="md" />
      </Box>
    </Box>
  );
}

