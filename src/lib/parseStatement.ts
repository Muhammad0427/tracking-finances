import Papa from "papaparse";

export interface ParsedTransaction {
  date: string; // ISO yyyy-mm-dd
  description: string;
  amount: number; // negative = expense, positive = income
}

export interface ParseResult {
  transactions: ParsedTransaction[];
  skippedRows: number;
  errors: string[];
}

const DATE_KEYS = ["date", "transaction date", "posted date", "posting date"];
const DESC_KEYS = ["description", "memo", "payee", "name", "transaction", "details"];
const AMOUNT_KEYS = ["amount", "transaction amount"];
const DEBIT_KEYS = ["debit", "withdrawal", "withdrawals", "money out", "expense"];
const CREDIT_KEYS = ["credit", "deposit", "deposits", "money in", "income"];

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase();
}

function findKey(headers: string[], candidates: string[]): string | undefined {
  const normalized = headers.map(normalizeHeader);
  for (const candidate of candidates) {
    const idx = normalized.indexOf(candidate);
    if (idx !== -1) return headers[idx];
  }
  // fallback: partial match
  for (const candidate of candidates) {
    const idx = normalized.findIndex((h) => h.includes(candidate));
    if (idx !== -1) return headers[idx];
  }
  return undefined;
}

export function parseAmount(raw: string): number | null {
  if (raw == null) return null;
  let s = String(raw).trim();
  if (s === "") return null;
  let negative = false;
  if (s.startsWith("(") && s.endsWith(")")) {
    negative = true;
    s = s.slice(1, -1);
  }
  s = s.replace(/[^0-9.\-]/g, "");
  if (s === "" || s === "-") return null;
  const num = Number(s);
  if (Number.isNaN(num)) return null;
  return negative ? -Math.abs(num) : num;
}

export function parseDate(raw: string): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  // Try YYYY-MM-DD first
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) {
    return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
  }
  // Try MM/DD/YYYY or M/D/YY
  m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (m) {
    const [, mm, dd] = m;
    let yyyy = m[3];
    if (yyyy.length === 2) yyyy = `20${yyyy}`;
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  return null;
}

export function parseStatementCsv(csvText: string): ParseResult {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const errors: string[] = result.errors.map((e) => `Row ${e.row}: ${e.message}`);
  const headers = result.meta.fields ?? [];

  if (headers.length === 0) {
    return { transactions: [], skippedRows: 0, errors: ["No headers found in CSV."] };
  }

  const dateKey = findKey(headers, DATE_KEYS);
  const descKey = findKey(headers, DESC_KEYS);
  const amountKey = findKey(headers, AMOUNT_KEYS);
  const debitKey = findKey(headers, DEBIT_KEYS);
  const creditKey = findKey(headers, CREDIT_KEYS);

  if (!dateKey || !descKey || (!amountKey && !debitKey && !creditKey)) {
    return {
      transactions: [],
      skippedRows: 0,
      errors: [
        `Could not detect required columns. Found headers: ${headers.join(", ")}. ` +
          `Expected a date column, a description column, and either an amount column or debit/credit columns.`,
      ],
    };
  }

  const transactions: ParsedTransaction[] = [];
  let skippedRows = 0;

  for (const row of result.data) {
    const dateRaw = dateKey ? row[dateKey] : "";
    const descRaw = descKey ? row[descKey] : "";
    const date = parseDate(dateRaw);
    const description = (descRaw ?? "").toString().trim();

    let amount: number | null = null;
    if (amountKey && row[amountKey]) {
      amount = parseAmount(row[amountKey]);
    } else {
      const debit = debitKey ? parseAmount(row[debitKey]) : null;
      const credit = creditKey ? parseAmount(row[creditKey]) : null;
      if (debit != null && debit !== 0) amount = -Math.abs(debit);
      else if (credit != null && credit !== 0) amount = Math.abs(credit);
    }

    if (!date || !description || amount == null) {
      skippedRows += 1;
      continue;
    }

    transactions.push({ date, description, amount });
  }

  return { transactions, skippedRows, errors };
}
