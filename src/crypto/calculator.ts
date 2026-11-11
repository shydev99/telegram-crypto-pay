export interface TokenAsset {
  symbol: string;
  balance: string;
  decimals: number;
  network: string;
  isNative: boolean;
}

export function calculateTokenBalance(
  balance: string,
  decimals: number
): string {
  const value = BigInt(balance);
  const divisor = BigInt(10) ** BigInt(decimals);

  const whole = value / divisor;
  const fraction = (value % divisor)
    .toString()
    .padStart(decimals, "0")
    .replace(/0+$/, "");

  return fraction ? `${whole}.${fraction}` : whole.toString();
}

export function calculateAvailableBalance(
  balance: bigint,
  feeReserve: bigint
): bigint {
  const available = balance - feeReserve;
  return available > BigInt(0) ? available : BigInt(0);
}
