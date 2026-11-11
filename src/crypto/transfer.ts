import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  erc20Abi,
  parseUnits,
  formatUnits,
  type Chain,
  type Address,
  type Hash,
} from "viem";

import { mainnet, bsc, polygon } from "viem/chains";

export const CHAINS: Record<string, Chain> = {
  Ethereum: mainnet,
  "BNB Smart Chain": bsc,
  Polygon: polygon,
};

const GAS_RESERVE: Record<string, bigint> = {
  Ethereum: BigInt("3000000000000000"),
  "BNB Smart Chain": BigInt("500000000000000"),
  Polygon: BigInt("50000000000000000"),
};

export function getGasReserve(network: string): bigint {
  return GAS_RESERVE[network] ?? BigInt("1000000000000000");
}

export function computeTransferable(balance: bigint, network: string): bigint {
  const reserve = getGasReserve(network);
  const avail = balance - reserve;
  return avail > BigInt(0) ? avail : BigInt(0);
}

export async function transferNative(params: {
  provider: any;
  network: string;
  recipient: Address;
}): Promise<{ hash: Hash; network: string; amount: string }> {
  const chain = CHAINS[params.network];
  if (!chain) throw new Error("Unsupported network");
  if (!/^0x[a-fA-F0-9]{40}$/.test(params.recipient)) throw new Error("Invalid recipient");

  const wallet = createWalletClient({ chain, transport: custom(params.provider) });
  const [account] = await wallet.getAddresses();
  if (!account) throw new Error("Connect your wallet first");

  const publicClient = createPublicClient({ chain, transport: http() });
  const balance = await publicClient.getBalance({ address: account });
  const gasPrice = await publicClient.getGasPrice();
  const gasCost = gasPrice * BigInt(21000);
  const reserve = getGasReserve(params.network);
  const safety = gasCost > reserve ? gasCost : reserve;
  const amount = balance - safety;

  if (amount <= BigInt(0)) throw new Error("No transferable native balance after gas reserve");

  const hash = await wallet.sendTransaction({ account, to: params.recipient, value: amount });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") throw new Error("Native transfer reverted");

  return { hash, network: params.network, amount: amount.toString() };
}

export async function transferToken(params: {
  provider: any;
  network: string;
  token: Address;
  recipient: Address;
  decimals: number;
}): Promise<{ hash: Hash; network: string; amount: string; symbol?: string }> {
  const chain = CHAINS[params.network];
  if (!chain) throw new Error("Unsupported network");
  if (!/^0x[a-fA-F0-9]{40}$/.test(params.recipient)) throw new Error("Invalid recipient");
  if (!/^0x[a-fA-F0-9]{40}$/.test(params.token)) throw new Error("Invalid token");

  const wallet = createWalletClient({ chain, transport: custom(params.provider) });
  const [account] = await wallet.getAddresses();
  if (!account) throw new Error("Connect your wallet first");

  const publicClient = createPublicClient({ chain, transport: http() });

  const bal = (await publicClient.readContract({
    address: params.token,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [account],
  })) as bigint;

  if (bal <= BigInt(0)) throw new Error("Zero token balance");

  let symbol: string | undefined;
  try {
    symbol = (await publicClient.readContract({
      address: params.token,
      abi: erc20Abi,
      functionName: "symbol",
    })) as string;
  } catch { /* ignore */ }

  const hash = await wallet.writeContract({
    account,
    address: params.token,
    abi: erc20Abi,
    functionName: "transfer",
    args: [params.recipient, bal],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") throw new Error("Token transfer reverted");

  return { hash, network: params.network, amount: formatUnits(bal, params.decimals), symbol };
}

export async function verifyTransfer(network: string, hash: Hash) {
  const chain = CHAINS[network];
  if (!chain) throw new Error("Unsupported network");
  const client = createPublicClient({ chain, transport: http() });
  const receipt = await client.waitForTransactionReceipt({ hash });
  return {
    transactionHash: hash,
    network,
    confirmed: receipt.status === "success",
    blockNumber: receipt.blockNumber.toString(),
  };
}
