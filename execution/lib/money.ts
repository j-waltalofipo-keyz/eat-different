// Square SDK money uses bigint cents; the app uses integer cents (number).

export function toMoney(cents: number): { amount: bigint; currency: "USD" } {
  return { amount: BigInt(cents), currency: "USD" };
}

export function toCents(money?: { amount?: bigint | number | null } | null): number {
  return Number(money?.amount ?? 0);
}

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function formatUsd(cents: number): string {
  return usd.format(cents / 100);
}
