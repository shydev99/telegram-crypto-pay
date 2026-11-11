"use client";

import { useState } from "react";
import {
  useAccount,
  useChainId,
  useSwitchChain,
} from "wagmi";

import {
  discoverTokenBalances,
  type TokenAsset,
} from "@/crypto/discovery";

export function EvmAssets() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { chains, switchChain } = useSwitchChain();

  const [assets, setAssets] = useState<TokenAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadAssets() {
    if (!address) {
      setError("Connect your EVM wallet first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const results = await discoverTokenBalances(address);
      setAssets(results);
    } catch (err) {
      console.error(err);
      setError("Unable to retrieve wallet assets.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <h2 className="mb-3 font-semibold">
        Multi-chain wallet assets
      </h2>

      {!isConnected && (
        <p className="text-sm text-neutral-400">
          Connect your EVM wallet using the wallet connection interface.
        </p>
      )}

      {isConnected && (
        <>
          <p className="mb-3 text-xs text-neutral-400">
            Connected chain ID: {chainId}
          </p>

          <button
            onClick={loadAssets}
            disabled={loading}
            className="mb-4 w-full rounded-lg bg-emerald-600 p-3 font-semibold disabled:opacity-50"
          >
            {loading ? "Discovering assets..." : "Discover wallet assets"}
          </button>

          <div className="mb-4 flex flex-wrap gap-2">
            {chains.map((chain) => (
              <button
                key={chain.id}
                onClick={() => switchChain({ chainId: chain.id })}
                className="rounded-lg border border-neutral-700 px-3 py-2 text-xs"
              >
                {chain.name}
              </button>
            ))}
          </div>

          {assets.map((asset, index) => (
            <div
              key={`${asset.network}-${asset.address ?? "native"}-${index}`}
              className="mb-2 rounded-lg bg-neutral-800 p-3"
            >
              <div className="flex justify-between">
                <span className="font-medium">{asset.symbol}</span>
                <span>{asset.balance}</span>
              </div>

              <p className="mt-1 text-xs text-neutral-400">
                {asset.network} · {asset.isNative ? "Native" : "ERC-20"}
              </p>
            </div>
          ))}
        </>
      )}

      {error && (
        <p className="mt-3 text-sm text-amber-400">{error}</p>
      )}
    </section>
  );
}
