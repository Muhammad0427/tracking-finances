import { getDb, toRows } from "./db";

export interface Category {
  id: number;
  name: string;
  type: "income" | "essential" | "discretionary" | "giving" | "savings";
  color: string;
  is_default: number;
  monthly_budget: number | null;
  notes: string | null;
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

export async function listCategories(): Promise<Category[]> {
  const db = await getDb();
  const result = await db.execute("SELECT * FROM categories ORDER BY type, name");
  return toRows<Category>(result);
}

export async function getCategoryByName(name: string): Promise<Category | undefined> {
  const db = await getDb();
  const result = await db.execute({ sql: "SELECT * FROM categories WHERE name = ?", args: [name] });
  return toRows<Category>(result)[0];
}

export interface TransactionFilters {
  categoryId?: number | null;
  month?: string; // YYYY-MM
  search?: string;
  limit?: number;
}

export async function listTransactions(filters: TransactionFilters = {}): Promise<Transaction[]> {
  const db = await getDb();
  const clauses: string[] = [];
  const args: (string | number)[] = [];

  if (filters.categoryId === null) {
    clauses.push("t.category_id IS NULL");
  } else if (filters.categoryId != null) {
    clauses.push("t.category_id = ?");
    args.push(filters.categoryId);
  }
  if (filters.month) {
    clauses.push("t.date LIKE ?");
    args.push(`${filters.month}%`);
  }
  if (filters.search) {
    clauses.push("LOWER(t.description) LIKE ?");
    args.push(`%${filters.search.toLowerCase()}%`);
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

  const result = await db.execute({ sql, args });
  return toRows<Transaction>(result);
}

export async function getMonthsWithData(): Promise<string[]> {
  const db = await getDb();
  const result = await db.execute(
    `SELECT DISTINCT substr(date, 1, 7) as month FROM transactions ORDER BY month DESC`
  );
  return toRows<{ month: string }>(result).map((r) => r.month);
}

export interface CategoryTotal {
  category_id: number | null;
  category_name: string;
  category_color: string;
  category_type: string;
  total: number;
  count: number;
}

export async function getCategoryTotals(month?: string): Promise<CategoryTotal[]> {
  const db = await getDb();
  const where = month ? "WHERE t.date LIKE ? AND t.amount < 0" : "WHERE t.amount < 0";
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
  const args = month ? [`${month}%`] : [];
  const result = await db.execute({ sql, args });
  return toRows<CategoryTotal>(result);
}

export interface MonthlySummary {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export async function getMonthlySummaries(): Promise<MonthlySummary[]> {
  const db = await getDb();
  const sql = `
    SELECT
      substr(date, 1, 7) as month,
      SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as income,
      SUM(CASE WHEN amount < 0 THEN -amount ELSE 0 END) as expenses
    FROM transactions
    GROUP BY month
    ORDER BY month ASC
  `;
  const result = await db.execute(sql);
  const rows = toRows<{ month: string; income: number; expenses: number }>(result);
  return rows.map((r) => ({ ...r, net: r.income - r.expenses }));
}

export async function getMonthlyCategoryTrend(
  categoryId: number | null
): Promise<{ month: string; total: number }[]> {
  const db = await getDb();
  const sql =
    categoryId != null
      ? `SELECT substr(date,1,7) as month, SUM(-amount) as total FROM transactions WHERE category_id = ? AND amount < 0 GROUP BY month ORDER BY month ASC`
      : `SELECT substr(date,1,7) as month, SUM(-amount) as total FROM transactions WHERE category_id IS NULL AND amount < 0 GROUP BY month ORDER BY month ASC`;
  const args = categoryId != null ? [categoryId] : [];
  const result = await db.execute({ sql, args });
  return toRows<{ month: string; total: number }>(result);
}

export interface Statement {
  id: number;
  filename: string;
  uploaded_at: string;
  transaction_count: number;
}

export async function listStatements(): Promise<Statement[]> {
  const db = await getDb();
  const result = await db.execute("SELECT * FROM statements ORDER BY uploaded_at DESC");
  return toRows<Statement>(result);
}
