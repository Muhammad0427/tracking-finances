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
      is_default INTEGER NOT NULL DEFAULT 0
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

  const result = await db.execute("SELECT COUNT(*) as count FROM categories");
  const count = Number(result.rows[0].count);

  if (count === 0) {
    await db.batch(
      DEFAULT_CATEGORIES.map((cat) => ({
        sql: "INSERT INTO categories (name, type, color, is_default) VALUES (?, ?, ?, 1)",
        args: [cat.name, cat.type, cat.color],
      })),
      "write"
    );
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

export async function getDb(): Promise<Client> {
  if (!global.__financesDb) {
    global.__financesDb = createConnection();
    global.__financesDbReady = initSchema(global.__financesDb);
  }
  await global.__financesDbReady;
  return global.__financesDb;
}
