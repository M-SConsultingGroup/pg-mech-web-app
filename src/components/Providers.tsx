// app/Providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { TicketFilterProvider } from '@/context/TicketFilterContext';

let client: QueryClient | null = null;

function getQueryClient() {
  if (!client) {
    client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000,
        },
      },
    });
  }
  return client;
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <AuthProvider>
        <TicketFilterProvider>
          {children}
        </TicketFilterProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}