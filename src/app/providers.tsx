"use client";

import { useState } from "react";
import { WagmiProvider, type State } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { wagmiConfig } from "@/config/wallet";
import "@/config";

export function Providers({
  children,
  initialState,
}: {
  children: React.ReactNode;
  initialState?: State;
}) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <TonConnectUIProvider manifestUrl="https://telegram-crypto-pay.shyannedelana4.workers.dev/tonconnect-manifest.json">
          {children}
        </TonConnectUIProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
