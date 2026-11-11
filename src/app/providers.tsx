"use client";

import { useState } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { wagmiConfig } from "@/config/wallet";
import "@/config";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <TonConnectUIProvider manifestUrl="https://shyv.netlify.app/tonconnect-manifest.json">
          {children}
        </TonConnectUIProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
