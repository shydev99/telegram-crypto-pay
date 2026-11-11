import { TonClient } from "@ton/ton";
import { Address } from "@ton/core";

const client = new TonClient({
  endpoint: "https://toncenter.com/api/v2/jsonRPC",
});

export async function getTonBalance(walletAddress: string) {
  const balance = await client.getBalance(
    Address.parse(walletAddress)
  );

  return balance;
}
