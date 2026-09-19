"use client";

import { useTransition } from "react";
import { deleteTransaction, updateTransactionCategory } from "@/app/actions";
import { formatCurrency, formatDateLabel } from "@/lib/format";
import type { Category, Transaction } from "@/lib/queries";

export default function TransactionsTable({
  transactions,
  categories,
}: {
  transactions: Transaction[];
  categories: Category[];
}) {
  const [isPending, startTransition] = useTransition();

  if (transactions.length === 0) {
    return <p className="text-sm text-text-muted">No transactions match these filters.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border-hairline bg-surface">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-border-hairline text-left text-xs uppercase tracking-wide text-text-muted">
            <th className="px-4 py-2 font-medium">Date</th>
            <th className="px-4 py-2 font-medium">Description</th>
            <th className="px-4 py-2 font-medium">Category</th>
            <th className="px-4 py-2 text-right font-medium">Amount</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border-hairline">
          {transactions.map((tx) => (
            <tr key={tx.id} className={isPending ? "opacity-60" : undefined}>
              <td className="whitespace-nowrap px-4 py-2 text-text-secondary">
                {formatDateLabel(tx.date)}
              </td>
              <td className="max-w-[320px] truncate px-4 py-2" title={tx.description}>
                {tx.description}
              </td>
              <td className="px-4 py-2">
                <select
                  defaultValue={tx.category_id ?? ""}
                  onChange={(e) => {
                    const value = e.target.value ? Number(e.target.value) : null;
                    startTransition(() => updateTransactionCategory(tx.id, value));
                  }}
                  className="rounded-md border border-border-hairline bg-surface px-2 py-1 text-xs"
                  style={{ color: tx.category_color ?? undefined }}
                >
                  <option value="">Uncategorized</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} style={{ color: c.color }}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </td>
              <td
                className={`whitespace-nowrap px-4 py-2 text-right font-medium tabular-nums ${
                  tx.amount < 0 ? "text-foreground" : "text-[#0ca30c]"
                }`}
              >
                {formatCurrency(tx.amount)}
              </td>
              <td className="whitespace-nowrap px-4 py-2 text-right">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Delete this transaction?")) {
                      startTransition(() => deleteTransaction(tx.id));
                    }
                  }}
                  className="text-xs text-text-muted hover:text-[#d03b3b]"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
