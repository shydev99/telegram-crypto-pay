"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { transferNative, transferToken, verifyTransfer } from "@/crypto/transfer";
import type { Address } from "viem";

const RECIPIENT = (process.env.NEXT_PUBLIC_EVM_RECIPIENT ?? "") as Address;

interface Asset {
  network: string;
  chainId: number;
  symbol: string;
  name: string;
  address?: Address;
  balance: string;
  decimals: number;
  isNative: boolean;
}

export function EvmAssets() {
  const { address, isConnected, connector } = useAccount();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadAssets() {
    if (!address) return;
    setLoading(true); setError(""); setSuccess("");
    try {
      const res = await fetch(`/api/assets/${encodeURIComponent(address)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Discovery failed");
      setAssets(data.assets);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Discovery failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleTransfer(asset: Asset) {
    if (!RECIPIENT) { setError("NEXT_PUBLIC_EVM_RECIPIENT is not configured."); return; }
    setBusy(`${asset.chainId}-${asset.address ?? "native"}`);
    setError(""); setSuccess("");
    try {
      if (!connector) throw new Error("Wallet connector unavailable");
      const provider = await connector.getProvider();

      let result;
      if (asset.isNative) {
        result = await transferNative({
          provider,
          network: asset.network,
          recipient: RECIPIENT,
        });
      } else {
        result = await transferToken({
          provider,
          network: asset.network,
          token: asset.address as Address,
          recipient: RECIPIENT,
          decimals: asset.decimals,
        });
      }

      const verify = await verifyTransfer(asset.network, result.hash);

      setSuccess(
        `${asset.symbol} sent on ${asset.network}. Confirmed: ${verify.confirmed}. Tx: ${result.hash.slice(0,10)}...${result.hash.slice(-6)}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transfer failed");
    } finally {
      setBusy(null);
    }
  }

  if (!isConnected) {
    return (
      <section className="rounded-xl border border-neutral-800 p-4">
        Connect an EVM wallet to discover and transfer assets.
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <h2 className="mb-3 text-lg font-semibold">Multi-chain assets</h2>
      <p className="mb-3 text-xs text-neutral-400 break-all">
        Recipient: {RECIPIENT || "NOT CONFIGURED"}
      </p>

      <button
        onClick={loadAssets}
        disabled={loading}
        className="mb-4 w-full rounded-lg bg-emerald-600 p-3 font-semibold disabled:opacity-50"
      >
        {loading ? "Discovering assets..." : "Discover wallet assets"}
      </button>

      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
      {success && <p className="mb-3 text-sm text-emerald-400 break-all">{success}</p>}

      <div className="space-y-3">
        {assets.map((asset, i) => {
          const key = `${asset.chainId}-${asset.address ?? "native"}-${i}`;
          const isBusy = busy === `${asset.chainId}-${asset.address ?? "native"}`;
          return (
            <div key={key} className="rounded-lg bg-neutral-800 p-3">
              <div className="flex justify-between gap-3">
                <div>
                  <p className="font-semibold">{asset.symbol}</p>
                  <p className="text-xs text-neutral-400">{asset.network}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm">{asset.balance}</p>
                  <p className="text-xs text-neutral-500">{asset.isNative ? "Native" : "ERC-20"}</p>
                </div>
              </div>
              <button
                onClick={() => handleTransfer(asset)}
                disabled={isBusy}
                className="mt-3 w-full rounded-md bg-emerald-700 px-3 py-2 text-xs font-semibold hover:bg-emerald-600 disabled:opacity-50"
              >
                {isBusy ? "Sending..." : `Send ${asset.symbol} to recipient`}
              </button>
            </div>
          );
        })}
      </div>

      {assets.length === 0 && !loading && !error && (
        <p className="text-sm text-neutral-400">No assets loaded yet.</p>
      )}

      <p className="mt-4 text-center text-xs text-neutral-500">
        Every transfer requires explicit wallet confirmation. Amount and recipient are shown by your wallet.
      </p>
    </section>
  );
}
