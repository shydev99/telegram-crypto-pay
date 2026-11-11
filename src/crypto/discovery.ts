import {
  createPublicClient,
  http,
  formatUnits,
  erc20Abi,
  type Chain,
} from "viem";

import {
  mainnet,
  bsc,
  polygon,
} from "viem/chains";

export interface TokenAsset {
  symbol: string;
  name: string;
  address?: `0x${string}`;
  decimals: number;
  balance: string;
  network: string;
  isNative: boolean;
}

const NETWORKS: {
  chain: Chain;
  rpc: string;
  name: string;
}[] = [
  {
    chain: mainnet,
    rpc: process.env.NEXT_PUBLIC_ETH_RPC || "https://cloudflare-eth.com",
    name: "Ethereum",
  },
  {
    chain: bsc,
    rpc: process.env.NEXT_PUBLIC_BSC_RPC || "https://bsc-dataseed.binance.org",
    name: "BNB Smart Chain",
  },
  {
    chain: polygon,
    rpc: process.env.NEXT_PUBLIC_POLYGON_RPC || "https://polygon-rpc.com",
    name: "Polygon",
  },
];

// Add verified token contracts to this registry.
export const SUPPORTED_TOKENS: {
  network: string;
  address: `0x${string}`;
  symbol: string;
  name: string;
  decimals: number;
}[] = [];

export async function discoverTokenBalances(
  account: `0x${string}`
): Promise<TokenAsset[]> {
  const results: TokenAsset[] = [];

  for (const network of NETWORKS) {
    const client = createPublicClient({
      chain: network.chain,
      transport: http(network.rpc),
    });

    const nativeBalance = await client.getBalance({
      address: account,
    });

    results.push({
      symbol: network.chain.nativeCurrency.symbol,
      name: network.chain.nativeCurrency.name,
      decimals: network.chain.nativeCurrency.decimals,
      balance: formatUnits(
        nativeBalance,
        network.chain.nativeCurrency.decimals
      ),
      network: network.name,
      isNative: true,
    });

    const tokens = SUPPORTED_TOKENS.filter(
      token => token.network === network.name
    );

    for (const token of tokens) {
      const balance = await client.readContract({
        address: token.address,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [account],
      });

      results.push({
        ...token,
        balance: formatUnits(balance, token.decimals),
        isNative: false,
      });
    }
  }

  return results;
}
