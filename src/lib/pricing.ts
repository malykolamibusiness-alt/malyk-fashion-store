export function priceToMinorUnits(value: string, currency: string): number | null {
  const fractionDigits = currency === "JPY" ? 0 : 2;
  const pattern =
    fractionDigits === 0
      ? /^\d{1,9}$/
      : /^\d{1,9}(?:\.\d{1,2})?$/;
  if (!pattern.test(value)) return null;

  const [whole, fraction = ""] = value.split(".");
  const minor =
    Number(whole) * 10 ** fractionDigits +
    Number((fraction + "00").slice(0, fractionDigits) || "0");
  return Number.isSafeInteger(minor) ? minor : null;
}
