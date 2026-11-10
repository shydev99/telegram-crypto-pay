import { mainnet, bsc, polygon } from "wagmi/chains";

export const supportedNetworks = [mainnet, bsc, polygon] as const;

export const networkLabels: Record<number, string> = {
  [mainnet.id]: "Ethereum",
  [bsc.id]: "BNB Smart Chain",
  [polygon.id]: "Polygon",
};
