"use client";

import { ChakraProvider } from "@chakra-ui/react";
import { system } from "@/theme/system";
import React, { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }));
  return (
    <ChakraProvider value={system}>
      <QueryClientProvider client={queryClient}>
        <Suspense>
          <NuqsAdapter>
            {children}
          </NuqsAdapter>
        </Suspense>
      </QueryClientProvider>
    </ChakraProvider>
  );
}
