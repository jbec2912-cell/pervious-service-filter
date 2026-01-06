import Papa from "papaparse";

const OUTPUT_HEADERS = [
  "phone_number",
  "Customer",
  "Last Name",
  "Purchase Date",
  "Year",
  "Model",
  "VIN",
  "Miles",
  "Payoff",
  "Payment",
];

const PHONE_FIELDS = [
  "CustomerVoicePhone",
  "CustomerTextPhone",
  "CustomerMobilePhone",
  "CustomerHomePhone",
  "CustomerWorkPhone",
];

const TRADE_YEAR = "TradeYear";
const TRADE_MODEL = "TradeModel";
const TRADE_VIN = "TradeVIN";
const TRADE_MILEAGE = "TradeMileage";
const TRADE_PAYOFF = "TradePayoff";
const TRADE_EQUITY = "TradeEquity";
const TRADE_PAYMENT = "TradeMonthlyPayment";
const TRADE_PURCHASE_DATE = "TradePurchaseDate";
const CUSTOMER_FIRST = "CustomerFirstName";
const CUSTOMER_LAST = "CustomerLastName";
const CUSTOMER_NAME = "CustomerName";

const cleanName = (value?: string | null) => {
  if (!value) return "";
  return value.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
};

const parseCurrency = (value?: string | null) => {
  if (value == null) return null;
  const cleaned = value.replace(/[^0-9.-]/g, "");
  if (!cleaned || cleaned === "-" || cleaned === ".") return null;
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
};

const normalizePhone = (raw?: string | null) => {
  if (!raw) return null;
  const digitsOnly = raw.replace(/\D/g, "");
  if (!digitsOnly) return null;
  let digits = digitsOnly;
  if (digits.length >= 10) digits = digits.slice(-10);
  if (digits.length === 10) return `1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return digits;
  return digits;
};

const choosePhone = (row: Record<string, string>) => {
  for (const field of PHONE_FIELDS) {
    const phone = normalizePhone(row[field]);
    if (phone) return phone;
  }
  return null;
};

const formatYear = (value?: string | null) => {
  if (!value) return "";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "";
  return String(parsed % 100).padStart(2, "0");
};

const formatPurchaseDate = (value?: string | null) => {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  const tryFormats = [
    { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, yearIndex: 3 },
    { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/, yearIndex: 3 },
    { regex: /^(\d{4})-(\d{2})-(\d{2})$/, yearIndex: 1 },
    { regex: /^(\d{4})\/(\d{2})\/(\d{2})$/, yearIndex: 1 },
  ];

  for (const fmt of tryFormats) {
    const match = trimmed.match(fmt.regex);
    if (match) {
      const [_, a, b, c] = match;
      // Map groups to month/day/year depending on format length.
      const parts = match.slice(1).map((p) => p.replace(/^0+/, ""));
      if (fmt.yearIndex === 3) {
        const [m, d, y] = parts;
        return `${m}/${d}/${y.slice(-2)}`;
      }
      if (fmt.yearIndex === 1) {
        const [y, m, d] = parts;
        return `${m}/${d}/${y.slice(-2)}`;
      }
    }
  }
  return trimmed;
};

const hasFirstName = (row: Record<string, string>) => {
  const fromFirst = cleanName(row[CUSTOMER_FIRST]);
  if (fromFirst) return fromFirst;
  const fromName = cleanName((row[CUSTOMER_NAME] || "").split(" ")[0]);
  return fromName;
};

const shouldKeep = (row: Record<string, string>, maxYear: number, minEquity: number) => {
  const firstName = hasFirstName(row);
  if (!firstName) return false;

  const yearStr = row[TRADE_YEAR];
  if (yearStr) {
    const yearNum = Number(yearStr);
    if (Number.isFinite(yearNum) && yearNum >= maxYear + 1) return false;
  }

  const equity = parseCurrency(row[TRADE_EQUITY]);
  if (equity !== null && equity < minEquity) return false;

  const phone = choosePhone(row);
  if (!phone) return false;

  return true;
};

const transformRow = (row: Record<string, string>) => {
  const phone = choosePhone(row) || "";
  const firstName = hasFirstName(row);
  const lastName = cleanName(row[CUSTOMER_LAST]);
  const purchaseDate = formatPurchaseDate(row[TRADE_PURCHASE_DATE]);
  const year = formatYear(row[TRADE_YEAR]);
  const model = (row[TRADE_MODEL] || "").trim();
  const vin = (row[TRADE_VIN] || "").trim();
  const miles = (row[TRADE_MILEAGE] || "").trim();
  const payoff = (row[TRADE_PAYOFF] || "").trim();
  const payment = (row[TRADE_PAYMENT] || "").trim();

  return [
    phone,
    firstName,
    lastName,
    purchaseDate,
    year,
    model,
    vin,
    miles,
    payoff,
    payment,
  ];
};

export type TransformResult = {
  csv: string;
  kept: number;
  dropped: number;
};

export const transformCsv = async (file: File, options?: { maxYear?: number; minEquity?: number }) => {
  const maxYear = options?.maxYear ?? 2024;
  const minEquity = options?.minEquity ?? -6000;

  const text = await file.text();
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
  const rows = parsed.data;

  const keptRows: string[][] = [];
  let dropped = 0;

  for (const row of rows) {
    if (!row || Object.keys(row).length === 0) continue;
    if (!shouldKeep(row, maxYear, minEquity)) {
      dropped += 1;
      continue;
    }
    keptRows.push(transformRow(row));
  }

  const csv = Papa.unparse({ fields: OUTPUT_HEADERS, data: keptRows });
  return { csv, kept: keptRows.length, dropped } as TransformResult;
};
