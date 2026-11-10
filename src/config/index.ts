"use client";

import { createAppKit } from "@reown/appkit/react";
import { wagmiAdapter, projectId, metadata } from "./wallet";
import { supportedNetworks } from "./networks";

export const appKitModal = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [...supportedNetworks],
  metadata,
  features: {
    analytics: false,
    email: false,
    socials: false,
  },
  themeMode: "dark",
  // Prioritize Bitget wallets in the modal (required for Telegram OmniConnect)
  featuredWalletIds: [
    "38f5d18bd8522c244bdd70cb4a68e0e718865155811c043f052fb9f1c51de662", // Bitget Wallet
    "21c3a371f72f0057186082edb2ddd43566f7e908508ac3e85373c6d1966ed614", // Bitget Wallet Lite
  ],
});
