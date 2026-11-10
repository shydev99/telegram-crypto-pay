"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TonConnectUIProvider } from "@tonconnect/ui-react";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TonConnectUIProvider manifestUrl="https://telegram-crypto-pay.vercel.app/tonconnect-manifest.json">
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </TonConnectUIProvider>
  );
}
