"use client";

import { CacheProvider } from "@chakra-ui/next-js";
import { ChakraProvider } from "@chakra-ui/react";
import { system } from "@/theme/system";
import React from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CacheProvider>
      <ChakraProvider value={system}>
        {children}
      </ChakraProvider>
    </CacheProvider>
  );
}
