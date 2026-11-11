import type { TonConnectUI } from "@tonconnect/ui";

export async function requestTonPayment(
  tonConnectUI: TonConnectUI,
  recipient: string,
  amountNano: bigint
) {
  if (!tonConnectUI.connected) {
    throw new Error("Connect your TON wallet first");
  }

  if (amountNano <= BigInt("0")) {
    throw new Error("Invalid payment amount");
  }

  return tonConnectUI.sendTransaction({
    validUntil: Math.floor(Date.now() / 1000) + 300,
    messages: [
      {
        address: recipient,
        amount: amountNano.toString(),
      },
    ],
  });
}

