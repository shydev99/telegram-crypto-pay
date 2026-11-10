import { cookieStorage, createStorage } from "wagmi";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { supportedNetworks } from "./networks";

export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID!;

if (!projectId) {
  throw new Error("NEXT_PUBLIC_REOWN_PROJECT_ID is not set");
}

export const metadata = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "Telegram Crypto Pay",
  description:
    process.env.NEXT_PUBLIC_APP_DESCRIPTION ?? "Crypto payment mini app",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  icons: ["https://avatars.githubusercontent.com/u/179229932"],
};

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  projectId,
  networks: [...supportedNetworks],
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
