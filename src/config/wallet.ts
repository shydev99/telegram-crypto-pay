import { cookieStorage, createStorage } from "wagmi";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { mainnet, bsc, polygon } from "@reown/appkit/networks";

export const projectId = "805fb07ea7baed60aacb672825ad36a9";
if (!projectId) throw new Error("NEXT_PUBLIC_REOWN_PROJECT_ID is not set");

export const networks = [mainnet, bsc, polygon] as const;

export const metadata = {
  name: "Telegram Crypto Pay",
  description: "Crypto payment mini app",
  url: "https://telegram-crypto-pay.shyannedelana4.workers.dev",
  icons: ["https://avatars.githubusercontent.com/u/179229932"],
};

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  projectId,
  networks: [...networks],
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;

