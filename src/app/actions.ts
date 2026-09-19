"use server";

import { revalidatePath } from "next/cache";
import { getDb, toRows } from "@/lib/db";
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

  const db = await getDb();

  const categoriesResult = await db.execute("SELECT id, name FROM categories");
  const categories = toRows<{ id: number; name: string }>(categoriesResult);
  const categoryIdByName = new Map<string, number>();
  for (const c of categories) categoryIdByName.set(c.name, c.id);
  const otherId = categoryIdByName.get("Other") ?? null;

  const stmtInfo = await db.execute({
    sql: "INSERT INTO statements (filename, uploaded_at, transaction_count) VALUES (?, datetime('now'), ?)",
    args: [file.name, transactions.length],
  });
  const statementId = Number(stmtInfo.lastInsertRowid);

  await db.batch(
    transactions.map((tx) => {
      const guessedName = guessCategory(tx.description);
      const categoryId = categoryIdByName.get(guessedName) ?? otherId;
      return {
        sql: `INSERT INTO transactions (date, description, amount, category_id, statement_id, account)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [tx.date, tx.description, tx.amount, categoryId, statementId, file.name],
      };
    }),
    "write"
  );

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
  const db = await getDb();
  await db.execute({
    sql: "UPDATE transactions SET category_id = ? WHERE id = ?",
    args: [categoryId, transactionId],
  });
  revalidatePath("/");
  revalidatePath("/transactions");
}

export async function deleteTransaction(transactionId: number) {
  const db = await getDb();
  await db.execute({ sql: "DELETE FROM transactions WHERE id = ?", args: [transactionId] });
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

  const db = await getDb();
  const existing = await db.execute({ sql: "SELECT id FROM categories WHERE name = ?", args: [name] });
  if (existing.rows.length > 0) {
    return { success: false, message: `A category named "${name}" already exists.` };
  }

  await db.execute({
    sql: "INSERT INTO categories (name, type, color, is_default) VALUES (?, ?, ?, 0)",
    args: [name, type, color],
  });

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

  const db = await getDb();
  await db.execute({
    sql: "UPDATE categories SET name = ?, type = ?, color = ? WHERE id = ?",
    args: [name, type, color, categoryId],
  });

  revalidatePath("/categories");
  revalidatePath("/");
  revalidatePath("/transactions");
  return { success: true, message: `Updated category "${name}".` };
}

export async function deleteCategory(categoryId: number): Promise<CategoryFormResult> {
  const db = await getDb();
  const result = await db.execute({ sql: "SELECT name FROM categories WHERE id = ?", args: [categoryId] });
  const category = toRows<{ name: string }>(result)[0];
  if (!category) return { success: false, message: "Category not found." };

  await db.batch(
    [
      { sql: "UPDATE transactions SET category_id = NULL WHERE category_id = ?", args: [categoryId] },
      { sql: "DELETE FROM categories WHERE id = ?", args: [categoryId] },
    ],
    "write"
  );

  revalidatePath("/categories");
  revalidatePath("/");
  revalidatePath("/transactions");
  return { success: true, message: `Deleted category "${category.name}". Its transactions are now uncategorized.` };
}

export async function deleteStatement(statementId: number) {
  const db = await getDb();
  await db.batch(
    [
      { sql: "DELETE FROM transactions WHERE statement_id = ?", args: [statementId] },
      { sql: "DELETE FROM statements WHERE id = ?", args: [statementId] },
    ],
    "write"
  );
  revalidatePath("/");
  revalidatePath("/transactions");
  revalidatePath("/upload");
}
