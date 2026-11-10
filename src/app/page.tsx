"use client";

import { useState } from "react";
import { TonConnectButton, useTonConnectUI } from "@tonconnect/ui-react";

const RECIPIENT = process.env.NEXT_PUBLIC_TON_RECIPIENT!;

export default function Home() {
  const [tonConnectUI] = useTonConnectUI();
  const [status, setStatus] = useState<"idle" | "pending" | "paid" | "failed">("idle");

  async function handlePay() {
    setStatus("pending");
    try {
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60,
        messages: [{
          address: RECIPIENT,
          amount: (0.1 * 1e9).toString(),
        }],
      };
      await tonConnectUI.sendTransaction(transaction);
      setStatus("paid");
    } catch (e) {
      setStatus("failed");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 bg-neutral-950 p-5 text-neutral-100">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Crypto Payment</h1>
        <span className="rounded-full bg-neutral-800 px-2 py-1 text-xs text-neutral-400">
          Telegram Mini App
        </span>
      </header>

      <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <h2 className="mb-3 text-sm font-medium text-neutral-300">
          Connect your wallet
        </h2>
        <TonConnectButton />
      </section>

      <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <h2 className="mb-3 text-sm font-medium text-neutral-300">
          Pay with TON
        </h2>
        <button
          onClick={handlePay}
          disabled={status === "pending"}
          className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold hover:bg-emerald-500 disabled:opacity-50"
        >
          {status === "pending" ? "Confirm in wallet…" : "Pay 0.1 TON"}
        </button>
      </section>

      <p className="text-center text-xs text-neutral-500">
        Payment requires approval in your TON wallet.
      </p>

      {status === "paid" && (
        <div className="rounded-lg border border-emerald-700 bg-emerald-950 p-3 text-xs text-emerald-300">
          ✅ Payment confirmed.
        </div>
      )}
      {status === "failed" && (
        <div className="rounded-lg border border-red-700 bg-red-950 p-3 text-xs text-red-300">
          Payment failed. Try again.
        </div>
      )}
    </main>
  );
}
