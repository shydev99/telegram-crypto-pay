import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  erc20Abi,
  parseUnits,
  type Chain,
  type Address,
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

export async function approveTokenTransfer(params: {
  provider: any;
  network: string;
  token: Address;
  spender: Address;
  amount: string;
  decimals: number;
}) {
  const chain = CHAINS[params.network];

  if (!chain) {
    throw new Error("Unsupported network");
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(params.spender)) {
    throw new Error("Invalid spender address");
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(params.token)) {
    throw new Error("Invalid token address");
  }

  const amount = parseUnits(params.amount, params.decimals);

  if (amount <= 0n) {
    throw new Error("Invalid approval amount");
  }

  const wallet = createWalletClient({
    chain,
    transport: custom(params.provider),
  });

  const [account] = await wallet.getAddresses();

  if (!account) {
    throw new Error("Connect your wallet");
  }

  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });

  const hash = await wallet.writeContract({
    account,
    address: params.token,
    abi: erc20Abi,
    functionName: "approve",
    args: [params.spender, amount],
  });

  const receipt = await publicClient.waitForTransactionReceipt({
    hash,
  });

  if (receipt.status !== "success") {
    throw new Error("Token approval failed");
  }

  return {
    hash,
    approvedAmount: amount.toString(),
    spender: params.spender,
    network: params.network,
  };
}
