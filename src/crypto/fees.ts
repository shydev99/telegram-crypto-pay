import {
  createPublicClient,
  http,
  type Chain,
} from "viem";

export async function estimateNetworkFee(
  chain: Chain,
  rpcUrl: string,
  account: `0x${string}`,
  recipient: `0x${string}`
) {
  const client = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });

  const gas = await client.estimateGas({
    account,
    to: recipient,
    value: BigInt(0),
  });

  const gasPrice = await client.getGasPrice();

  return {
    gas,
    gasPrice,
    estimatedFee: gas * gasPrice,
  };
}
