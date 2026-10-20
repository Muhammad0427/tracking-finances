import { parseAmount, parseDate, type ParsedTransaction } from "./parseStatement";

// Shared line-by-line heuristic for turning loose extracted text (from a PDF's
// text layer, or OCR on a photo) into transactions. Works for statements that
// print one transaction per line as "<date>  <description>  <amount>"
// (optionally followed by a running balance, or a trailing CR/DR marker).
// Multi-line transactions and multi-column layouts will not parse well.

const LEADING_DATE = /^\s*(\d{4}-\d{1,2}-\d{1,2}|\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?)\s+(.*)$/;
const AMOUNT_TOKEN = /\(?-?\$?[\d,]+\.\d{2}\)?-?/g;
const TRAILING_MARKER = /\s*(CR|DR)\s*$/i;

const INCOME_HINTS = [
  "payroll",
  "salary",
  "direct dep",
  "deposit",
  "refund",
  "interest paid",
  "dividend",
  "transfer in",
];

function parseYearlessDate(raw: string): string | null {
  const withYear = parseDate(raw);
  if (withYear) return withYear;

  // "MM/DD" with no year — assume the current year (statements rarely
  // span a year boundary within one file; this is a known limitation).
  const m = raw.trim().match(/^(\d{1,2})[/-](\d{1,2})$/);
  if (m) {
    const year = new Date().getFullYear();
    return `${year}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
  }
  return null;
}

function extractAmount(token: string, description: string): number | null {
  let s = token.trim();
  let sign: 1 | -1 | null = null;

  const markerMatch = s.match(TRAILING_MARKER);
  if (markerMatch) {
    sign = markerMatch[1].toUpperCase() === "CR" ? 1 : -1;
    s = s.slice(0, markerMatch.index).trim();
  }

  if (s.endsWith("-") && !s.startsWith("(")) {
    sign = -1;
    s = s.slice(0, -1);
  }

  const amount = parseAmount(s);
  if (amount == null) return null;

  if (sign != null) {
    return sign * Math.abs(amount);
  }
  if (s.startsWith("(") || s.startsWith("-")) {
    // parseAmount already applied the sign from parentheses/leading minus.
    return amount;
  }

  // No explicit sign anywhere — guess from the description, defaulting to
  // an expense (the common case for line items on a statement).
  const desc = description.toLowerCase();
  const looksLikeIncome = INCOME_HINTS.some((kw) => desc.includes(kw));
  return looksLikeIncome ? Math.abs(amount) : -Math.abs(amount);
}

function parseLine(line: string): ParsedTransaction | "skip" | null {
  const trimmed = line.trim();
  if (trimmed.length < 6) return null;

  const dateMatch = trimmed.match(LEADING_DATE);
  if (!dateMatch) return null;

  const [, dateRaw, rest] = dateMatch;
  const date = parseYearlessDate(dateRaw);
  if (!date) return "skip";

  const amountTokens = rest.match(AMOUNT_TOKEN);
  if (!amountTokens || amountTokens.length === 0) return "skip";

  // If a running balance is also printed, it's the last token; the
  // transaction amount is the one before it.
  const amountToken =
    amountTokens.length >= 2 ? amountTokens[amountTokens.length - 2] : amountTokens[0];

  const lastIndex = rest.lastIndexOf(amountToken);
  const description = rest.slice(0, lastIndex).trim().replace(/[-–—\s]+$/, "");
  if (!description) return "skip";

  const amount = extractAmount(amountToken, description);
  if (amount == null) return "skip";

  return { date, description, amount };
}

export function parseTransactionLines(text: string): {
  transactions: ParsedTransaction[];
  skippedRows: number;
} {
  const lines = text.split(/\r?\n/);
  const transactions: ParsedTransaction[] = [];
  let skippedRows = 0;

  for (const line of lines) {
    const result = parseLine(line);
    if (result === "skip") skippedRows += 1;
    else if (result) transactions.push(result);
  }

  return { transactions, skippedRows };
}
