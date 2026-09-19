"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { parseStatementCsv } from "@/lib/parseStatement";
import { guessCategory } from "@/lib/categories";

export interface UploadResult {
  success: boolean;
  message: string;
  imported?: number;
  skipped?: number;
}

export async function uploadStatement(formData: FormData): Promise<UploadResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, message: "Please choose a CSV file to upload." };
  }
  if (!file.name.toLowerCase().endsWith(".csv")) {
    return {
      success: false,
      message: "Only CSV files are supported right now. Export your statement as CSV from your bank and try again.",
    };
  }

  const text = await file.text();
  const { transactions, skippedRows, errors } = parseStatementCsv(text);

  if (transactions.length === 0) {
    return {
      success: false,
      message: errors[0] ?? "No transactions could be read from this file.",
    };
  }

  const db = getDb();

  const categoryIdByName = new Map<string, number>();
  const categories = db.prepare("SELECT id, name FROM categories").all() as {
    id: number;
    name: string;
  }[];
  for (const c of categories) categoryIdByName.set(c.name, c.id);
  const otherId = categoryIdByName.get("Other") ?? null;

  const insertStatement = db.prepare(
    "INSERT INTO statements (filename, uploaded_at, transaction_count) VALUES (?, datetime('now'), ?)"
  );
  const insertTx = db.prepare(
    `INSERT INTO transactions (date, description, amount, category_id, statement_id, account)
     VALUES (@date, @description, @amount, @categoryId, @statementId, @account)`
  );

  const runImport = db.transaction(() => {
    const stmtInfo = insertStatement.run(file.name, transactions.length);
    const statementId = stmtInfo.lastInsertRowid as number;

    for (const tx of transactions) {
      const guessedName = guessCategory(tx.description);
      const categoryId = categoryIdByName.get(guessedName) ?? otherId;
      insertTx.run({
        date: tx.date,
        description: tx.description,
        amount: tx.amount,
        categoryId,
        statementId,
        account: file.name,
      });
    }
  });

  runImport();

  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/upload");

  return {
    success: true,
    message: `Imported ${transactions.length} transaction${transactions.length === 1 ? "" : "s"} from "${file.name}".${
      skippedRows > 0 ? ` Skipped ${skippedRows} row(s) that couldn't be read.` : ""
    }`,
    imported: transactions.length,
    skipped: skippedRows,
  };
}

export async function updateTransactionCategory(transactionId: number, categoryId: number | null) {
  const db = getDb();
  db.prepare("UPDATE transactions SET category_id = ? WHERE id = ?").run(categoryId, transactionId);
  revalidatePath("/");
  revalidatePath("/transactions");
}

export async function deleteTransaction(transactionId: number) {
  const db = getDb();
  db.prepare("DELETE FROM transactions WHERE id = ?").run(transactionId);
  revalidatePath("/");
  revalidatePath("/transactions");
}

export interface CategoryFormResult {
  success: boolean;
  message: string;
}

const VALID_TYPES = ["income", "essential", "discretionary", "giving", "savings"];

export async function addCategory(formData: FormData): Promise<CategoryFormResult> {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const color = String(formData.get("color") ?? "#6b7280");

  if (!name) return { success: false, message: "Category name is required." };
  if (!VALID_TYPES.includes(type)) return { success: false, message: "Invalid category type." };

  const db = getDb();
  const existing = db.prepare("SELECT id FROM categories WHERE name = ?").get(name);
  if (existing) return { success: false, message: `A category named "${name}" already exists.` };

  db.prepare("INSERT INTO categories (name, type, color, is_default) VALUES (?, ?, ?, 0)").run(
    name,
    type,
    color
  );

  revalidatePath("/categories");
  revalidatePath("/");
  revalidatePath("/transactions");
  return { success: true, message: `Added category "${name}".` };
}

export async function updateCategory(
  categoryId: number,
  formData: FormData
): Promise<CategoryFormResult> {
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const color = String(formData.get("color") ?? "#6b7280");

  if (!name) return { success: false, message: "Category name is required." };
  if (!VALID_TYPES.includes(type)) return { success: false, message: "Invalid category type." };

  const db = getDb();
  db.prepare("UPDATE categories SET name = ?, type = ?, color = ? WHERE id = ?").run(
    name,
    type,
    color,
    categoryId
  );

  revalidatePath("/categories");
  revalidatePath("/");
  revalidatePath("/transactions");
  return { success: true, message: `Updated category "${name}".` };
}

export async function deleteCategory(categoryId: number): Promise<CategoryFormResult> {
  const db = getDb();
  const category = db.prepare("SELECT name FROM categories WHERE id = ?").get(categoryId) as
    | { name: string }
    | undefined;
  if (!category) return { success: false, message: "Category not found." };

  db.prepare("UPDATE transactions SET category_id = NULL WHERE category_id = ?").run(categoryId);
  db.prepare("DELETE FROM categories WHERE id = ?").run(categoryId);

  revalidatePath("/categories");
  revalidatePath("/");
  revalidatePath("/transactions");
  return { success: true, message: `Deleted category "${category.name}". Its transactions are now uncategorized.` };
}

export async function deleteStatement(statementId: number) {
  const db = getDb();
  db.prepare("DELETE FROM transactions WHERE statement_id = ?").run(statementId);
  db.prepare("DELETE FROM statements WHERE id = ?").run(statementId);
  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/upload");
}
