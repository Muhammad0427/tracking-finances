import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { DEFAULT_CATEGORIES } from "./categories";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "finances.db");

declare global {
  var __financesDb: Database.Database | undefined;
}

function createConnection(): Database.Database {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
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

  const categoryCount = db
    .prepare("SELECT COUNT(*) as count FROM categories")
    .get() as { count: number };

  if (categoryCount.count === 0) {
    const insert = db.prepare(
      "INSERT INTO categories (name, type, color, is_default) VALUES (?, ?, ?, 1)"
    );
    const insertMany = db.transaction((cats: typeof DEFAULT_CATEGORIES) => {
      for (const cat of cats) {
        insert.run(cat.name, cat.type, cat.color);
      }
    });
    insertMany(DEFAULT_CATEGORIES);
  }

  return db;
}

export function getDb(): Database.Database {
  if (!global.__financesDb) {
    global.__financesDb = createConnection();
  }
  return global.__financesDb;
}
