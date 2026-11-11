import {
  createPublicClient,
  http,
  type Chain,
  type Hash,
} from "viem";

import {
  mainnet,
  bsc,
  polygon,
} from "viem/chains";

const CHAINS: Record<string, Chain> = {
  Ethereum: mainnet,
  "BNB Smart Chain": bsc,
  Polygon: polygon,
};

export async function verifyTransfer(
  network: string,
  transactionHash: Hash
) {
  const chain = CHAINS[network];

  if (!chain) {
    throw new Error("Unsupported network");
  }

  const client = createPublicClient({
    chain,
    transport: http(),
  });

  const receipt = await client.waitForTransactionReceipt({
    hash: transactionHash,
  });

  return {
    transactionHash,
    network,
    confirmed: receipt.status === "success",
    blockNumber: receipt.blockNumber.toString(),
  };
}
