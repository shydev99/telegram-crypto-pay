"use client";

import { TonConnectUIProvider } from "@tonconnect/ui-react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TonConnectUIProvider manifestUrl="https://shyv.netlify.app/tonconnect-manifest.json">
      {children}
    </TonConnectUIProvider>
  );
}
