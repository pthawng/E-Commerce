import { Currency } from "../settingsStore";

export const formatCurrency = (
  value: number,
  currency: Currency,
  locale: string = "en-US",
) => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: currency === "VND" ? 0 : 2,
  }).format(value);
};
