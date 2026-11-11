import {
  createPublicClient,
  http,
  formatUnits,
  erc20Abi,
  isAddress,
  getAddress,
  type Address,
} from "viem";
import { mainnet, bsc, polygon } from "viem/chains";
import { NextResponse } from "next/server";

const NETWORKS = [
  { id: 1, name: "Ethereum", chain: mainnet },
  { id: 56, name: "BNB Smart Chain", chain: bsc },
  { id: 137, name: "Polygon", chain: polygon },
];

const API_KEY = process.env.ONEINCH_API_KEY;

export async function GET(
  _request: Request,
  context: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await context.params;

    if (!isAddress(address)) {
      return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
    }
    if (!API_KEY) {
      return NextResponse.json({ error: "Discovery provider not configured" }, { status: 503 });
    }

    const account = getAddress(address);

    const results = await Promise.all(
      NETWORKS.map(async (network) => {
        const client = createPublicClient({ chain: network.chain, transport: http() });

        const response = await fetch(
          `https://api.1inch.com/balance/v1.2/${network.id}/balances/${account}`,
          { headers: { Authorization: `Bearer ${API_KEY}` }, cache: "no-store" }
        );

        if (!response.ok) throw new Error(`${network.name} discovery failed: ${response.status}`);

        const balances: Record<string, string> = await response.json();
        const nativeBalance = await client.getBalance({ address: account });

        const assets: any[] = [{
          network: network.name,
          chainId: network.id,
          symbol: network.chain.nativeCurrency.symbol,
          name: network.chain.nativeCurrency.name,
          balance: formatUnits(nativeBalance, network.chain.nativeCurrency.decimals),
          decimals: network.chain.nativeCurrency.decimals,
          isNative: true,
        }];

        const tokens = Object.entries(balances).filter(
          ([t, b]) => t !== "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" && BigInt(b) > BigInt(0)
        );

        const tokenAssets = await Promise.all(
          tokens.map(async ([token, rawBalance]) => {
            try {
              const tokenAddress = getAddress(token) as Address;
              const [symbol, decimals] = await Promise.all([
                client.readContract({ address: tokenAddress, abi: erc20Abi, functionName: "symbol" }),
                client.readContract({ address: tokenAddress, abi: erc20Abi, functionName: "decimals" }),
              ]);
              return {
                network: network.name,
                chainId: network.id,
                address: tokenAddress,
                symbol,
                name: symbol,
                balance: formatUnits(BigInt(rawBalance), decimals),
                decimals,
                isNative: false,
              };
            } catch { return null; }
          })
        );

        return [...assets, ...tokenAssets.filter(Boolean)];
      })
    );

    return NextResponse.json({ address: account, assets: results.flat(), readOnly: true });
  } catch (error) {
    console.error("Asset discovery error:", error);
    return NextResponse.json({ error: "Unable to discover wallet assets" }, { status: 502 });
  }
}
