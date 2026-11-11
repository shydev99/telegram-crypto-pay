const NANO = BigInt("1000000000");

export function calculateMaximumTransfer(
  balance: bigint,
  feeReserve: bigint
) {
  const available = balance - feeReserve;
  return available > BigInt("0") ? available : BigInt("0");
}

export function formatTon(amount: bigint) {
  const whole = amount / NANO;
  const fraction = (amount % NANO)
    .toString()
    .padStart(9, "0")
    .replace(/0+$/, "");

  return fraction ? `${whole}.${fraction}` : whole.toString();
}
