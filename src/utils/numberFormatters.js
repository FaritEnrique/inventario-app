const decimalFormatter = new Intl.NumberFormat("es-PE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const integerFormatter = new Intl.NumberFormat("es-PE", {
  maximumFractionDigits: 0,
});

const penCurrencyFormatter = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const normalizeNumber = (value) => {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
};

export const formatDecimal = (value) =>
  decimalFormatter.format(normalizeNumber(value));

export const formatQuantity = (value) => formatDecimal(value);

export const formatInteger = (value) =>
  integerFormatter.format(normalizeNumber(value));

export const formatCurrency = (value) =>
  penCurrencyFormatter.format(normalizeNumber(value));

export const formatMoneyWithPrefix = (value, prefix = "S/") => {
  const normalizedPrefix = String(prefix || "").trim();
  const amount = formatDecimal(value);
  return normalizedPrefix ? `${normalizedPrefix} ${amount}` : amount;
};
