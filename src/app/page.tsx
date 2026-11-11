"use client";

import { useState } from "react";
import { useTonConnectUI, useIsConnectionRestored, useTonAddress } from "@tonconnect/ui-react";

const RECIPIENT = process.env.NEXT_PUBLIC_TON_RECIPIENT!;

export default function Home() {
  const [tonConnectUI] = useTonConnectUI();
  const isConnectionRestored = useIsConnectionRestored();
  const userAddress = useTonAddress();
  const [status, setStatus] = useState<"idle" | "pending" | "paid" | "failed" | "no-response">("idle");

  async function handlePay() {
    setStatus("pending");
    try {
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 300,
        messages: [{ address: RECIPIENT, amount: (0.1 * 1e9).toString() }],
      };

      const result = await tonConnectUI.sendTransaction(transaction, {
        enableEmbeddedRequest: true,
      });

      if (result.hasResponse) {
        setStatus("paid");
      } else {
        // Wallet connected but did not process the embedded transaction
        setStatus("no-response");
      }
    } catch (e) {
      console.error(e);
      setStatus("failed");
    }
  }

  if (!isConnectionRestored) {
    return <main className="mx-auto flex min-h-screen max-w-md items-center justify-center bg-neutral-950 p-5 text-neutral-400">Loading…</main>;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 bg-neutral-950 p-5 text-neutral-100">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Crypto Payment</h1>
        <span className="rounded-full bg-neutral-800 px-2 py-1 text-xs text-neutral-400">TON</span>
      </header>

      <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <h2 className="mb-3 text-sm font-medium text-neutral-300">
          {userAddress ? "Confirm payment" : "Connect & Pay"}
        </h2>
        {userAddress && (
          <p className="mb-3 font-mono text-xs text-neutral-400">
            Connected: {userAddress.slice(0, 6)}…{userAddress.slice(-4)}
          </p>
        )}
        <button
          onClick={handlePay}
          disabled={status === "pending"}
          className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold hover:bg-emerald-500 disabled:opacity-50"
        >
          {status === "pending"
            ? "Confirm in wallet…"
            : userAddress
              ? "Pay 0.1 TON"
              : "Connect & Pay 0.1 TON"}
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
      {status === "no-response" && (
        <div className="rounded-lg border border-amber-700 bg-amber-950 p-3 text-xs text-amber-300">
          Wallet connected, but the payment was not confirmed. Tap the button again to retry.
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
