import { getDb } from "./db";

export interface Category {
  id: number;
  name: string;
  type: "income" | "essential" | "discretionary" | "giving" | "savings";
  color: string;
  is_default: number;
}

export interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  category_id: number | null;
  category_name: string | null;
  category_color: string | null;
  category_type: string | null;
  account: string | null;
  notes: string | null;
  statement_id: number | null;
}

export function listCategories(): Category[] {
  const db = getDb();
  return db.prepare("SELECT * FROM categories ORDER BY type, name").all() as Category[];
}

export function getCategoryByName(name: string): Category | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM categories WHERE name = ?").get(name) as Category | undefined;
}

export interface TransactionFilters {
  categoryId?: number | null;
  month?: string; // YYYY-MM
  search?: string;
  limit?: number;
}

export function listTransactions(filters: TransactionFilters = {}): Transaction[] {
  const db = getDb();
  const clauses: string[] = [];
  const params: Record<string, unknown> = {};

  if (filters.categoryId != null) {
    clauses.push("t.category_id = @categoryId");
    params.categoryId = filters.categoryId;
  }
  if (filters.month) {
    clauses.push("t.date LIKE @month");
    params.month = `${filters.month}%`;
  }
  if (filters.search) {
    clauses.push("LOWER(t.description) LIKE @search");
    params.search = `%${filters.search.toLowerCase()}%`;
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const limit = filters.limit ? `LIMIT ${Number(filters.limit)}` : "";

  const sql = `
    SELECT
      t.id, t.date, t.description, t.amount, t.category_id, t.account, t.notes, t.statement_id,
      c.name as category_name, c.color as category_color, c.type as category_type
    FROM transactions t
    LEFT JOIN categories c ON c.id = t.category_id
    ${where}
    ORDER BY t.date DESC, t.id DESC
    ${limit}
  `;

  return db.prepare(sql).all(params) as Transaction[];
}

export function getMonthsWithData(): string[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT DISTINCT substr(date, 1, 7) as month FROM transactions ORDER BY month DESC`
    )
    .all() as { month: string }[];
  return rows.map((r) => r.month);
}

export interface CategoryTotal {
  category_id: number | null;
  category_name: string;
  category_color: string;
  category_type: string;
  total: number;
  count: number;
}

export function getCategoryTotals(month?: string): CategoryTotal[] {
  const db = getDb();
  const where = month ? "WHERE t.date LIKE @month AND t.amount < 0" : "WHERE t.amount < 0";
  const sql = `
    SELECT
      c.id as category_id,
      COALESCE(c.name, 'Uncategorized') as category_name,
      COALESCE(c.color, '#9ca3af') as category_color,
      COALESCE(c.type, 'discretionary') as category_type,
      SUM(-t.amount) as total,
      COUNT(*) as count
    FROM transactions t
    LEFT JOIN categories c ON c.id = t.category_id
    ${where}
    GROUP BY c.id
    ORDER BY total DESC
  `;
  const params = month ? { month: `${month}%` } : {};
  return db.prepare(sql).all(params) as CategoryTotal[];
}

export interface MonthlySummary {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export function getMonthlySummaries(): MonthlySummary[] {
  const db = getDb();
  const sql = `
    SELECT
      substr(date, 1, 7) as month,
      SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN amount < 0 THEN -amount ELSE 0 END) as expenses
    FROM transactions
    GROUP BY month
    ORDER BY month ASC
  `;
  const rows = db.prepare(sql).all() as { month: string; income: number; expenses: number }[];
  return rows.map((r) => ({ ...r, net: r.income - r.expenses }));
}

export function getMonthlyCategoryTrend(categoryId: number | null): { month: string; total: number }[] {
  const db = getDb();
  const sql = categoryId
    ? `SELECT substr(date,1,7) as month, SUM(-amount) as total FROM transactions WHERE category_id = ? AND amount < 0 GROUP BY month ORDER BY month ASC`
    : `SELECT substr(date,1,7) as month, SUM(-amount) as total FROM transactions WHERE category_id IS NULL AND amount < 0 GROUP BY month ORDER BY month ASC`;
  return db.prepare(sql).all(categoryId ?? undefined) as { month: string; total: number }[];
}

export function listStatements() {
  const db = getDb();
  return db
    .prepare("SELECT * FROM statements ORDER BY uploaded_at DESC")
    .all() as { id: number; filename: string; uploaded_at: string; transaction_count: number }[];
}
