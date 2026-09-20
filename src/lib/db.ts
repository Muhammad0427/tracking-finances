import { createClient, type Client, type ResultSet } from "@libsql/client";
import fs from "fs";
import path from "path";
import { DEFAULT_CATEGORIES } from "./categories";

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");

declare global {
  var __financesDb: Client | undefined;
  var __financesDbReady: Promise<void> | undefined;
}

function createConnection(): Client {
  const url = process.env.TURSO_DATABASE_URL;
  if (url) {
    return createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  }

  if (!fs.existsSync(/* turbopackIgnore: true */ DATA_DIR)) {
    fs.mkdirSync(/* turbopackIgnore: true */ DATA_DIR, { recursive: true });
  }
  return createClient({ url: `file:${path.join(DATA_DIR, "finances.db")}` });
}

async function initSchema(db: Client): Promise<void> {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL CHECK (type IN ('income', 'essential', 'discretionary', 'giving', 'savings')),
      color TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      monthly_budget REAL,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS statements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      uploaded_at TEXT NOT NULL,
      transaction_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      statement_id INTEGER REFERENCES statements(id) ON DELETE SET NULL,
      account TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
    CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
  `);

  // Safety net for a database created before monthly_budget/notes existed.
  const columnInfo = await db.execute("PRAGMA table_info(categories)");
  const existingColumns = new Set(toRows<{ name: string }>(columnInfo).map((c) => c.name));
  if (!existingColumns.has("monthly_budget")) {
    await db.execute("ALTER TABLE categories ADD COLUMN monthly_budget REAL");
  }
  if (!existingColumns.has("notes")) {
    await db.execute("ALTER TABLE categories ADD COLUMN notes TEXT");
  }

  await migrateCategories(db);
}

// Old default category names renamed to match the current, more specific
// naming (e.g. "Dining & Takeout" -> "Restaurants / Uber Eats"). Renaming in
// place (rather than adding a new row) keeps the category's id, color,
// budget, and every transaction already linked to it.
const CATEGORY_RENAMES: Array<[oldName: string, newName: string]> = [
  ["Dining & Takeout", "Restaurants / Uber Eats"],
  ["Shopping", "Shopping / Online Purchases"],
  ["Personal Care", "Hair & Maintenance"],
  ["Health & Medical", "Health / Medical"],
  ["Other", "Other / Miscellaneous"],
];

// Firm budget caps that should apply even to a category that already existed
// (e.g. from before the Budget feature shipped) and hasn't had a budget set yet.
const BUDGET_BACKFILL: Record<string, number> = {
  Groceries: 600,
  "Shopping / Online Purchases": 250,
  "Hair & Maintenance": 300,
};

// Runs on every startup, on both a brand-new database and one already
// populated from an earlier version of DEFAULT_CATEGORIES, so the category
// list stays current without ever duplicating or clobbering user data:
// - renames old category names in place (only if the new name doesn't
//   already exist, so it can't collide with a category the user made)
// - adds any category from DEFAULT_CATEGORIES that isn't present yet, by name
// - backfills the three firm budget caps onto matching categories that don't
//   already have a budget set (never overwrites one the user set themselves)
async function migrateCategories(db: Client): Promise<void> {
  for (const [oldName, newName] of CATEGORY_RENAMES) {
    await db.execute({
      sql: `UPDATE categories SET name = ?
            WHERE name = ? AND NOT EXISTS (SELECT 1 FROM categories WHERE name = ?)`,
      args: [newName, oldName, newName],
    });
  }

  await db.batch(
    DEFAULT_CATEGORIES.map((cat) => ({
      sql: `INSERT INTO categories (name, type, color, is_default, monthly_budget)
            SELECT ?, ?, ?, 1, ? WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = ?)`,
      args: [cat.name, cat.type, cat.color, cat.monthlyBudget ?? null, cat.name],
    })),
    "write"
  );

  for (const [name, cap] of Object.entries(BUDGET_BACKFILL)) {
    await db.execute({
      sql: "UPDATE categories SET monthly_budget = ? WHERE name = ? AND monthly_budget IS NULL",
      args: [cap, name],
    });
  }
}

// libsql's Row is a Proxy-like object (array + named access), not a plain
// object, so it can't be passed straight from a Server Component to a
// Client Component (or safely spread/serialized). Convert to plain objects.
export function toRows<T>(result: ResultSet): T[] {
  return result.rows.map((row) => {
    const obj: Record<string, unknown> = {};
    for (const col of result.columns) obj[col] = row[col];
    return obj as T;
  });
}

// Splits a batch of statements into smaller groups. Turso/libsql's HTTP
// transport has practical limits on how much a single batched request can
// carry; a large "recategorize everything" or "import a big statement"
// batch is exactly the kind of write that can hit that ceiling, and an
// unhandled failure there crashes the whole page (Next.js's generic error
// screen) rather than showing a normal in-app message.
export function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export async function getDb(): Promise<Client> {
  if (!global.__financesDb) {
    global.__financesDb = createConnection();
    global.__financesDbReady = initSchema(global.__financesDb);
  }
  await global.__financesDbReady;
  return global.__financesDb;
}
