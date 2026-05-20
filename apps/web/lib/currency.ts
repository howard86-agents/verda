export type CurrencyCode = "USD" | "TWD" | "EUR" | "JPY" | "HKD";

export const CCY: Record<
  CurrencyCode,
  { sym: string; rate: number; label: string }
> = {
  USD: { sym: "USD $", rate: 1, label: "US Dollar" },
  TWD: { sym: "NT$", rate: 31.8, label: "New Taiwan Dollar" },
  EUR: { sym: "€", rate: 0.92, label: "Euro" },
  JPY: { sym: "¥", rate: 154.4, label: "Japanese Yen" },
  HKD: { sym: "HK$", rate: 7.81, label: "Hong Kong Dollar" },
};

export const CURRENCY_CODES = Object.keys(CCY) as CurrencyCode[];

export function formatCcy(usd: number, code: CurrencyCode): string {
  const c = CCY[code];
  if (!c) {
    return `$${usd}`;
  }
  const v = Math.round(usd * c.rate);
  const grouped = v.toLocaleString("en-US");
  return `${c.sym} ${grouped}`;
}
