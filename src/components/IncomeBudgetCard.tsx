"use client";

import { useState, useTransition } from "react";
import { updateCategoryBudget } from "@/app/actions";
import { formatCurrency } from "@/lib/format";
import type { IncomeBudget } from "@/lib/budget";

export default function IncomeBudgetCard({ income }: { income: IncomeBudget }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const diffGood = income.difference == null || income.difference >= 0;

  return (
    <div className="rounded-lg border border-border-hairline bg-surface p-4">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#2a78d6]" />
        <span className="font-medium">Income</span>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="ml-auto shrink-0 text-xs text-text-secondary hover:text-foreground"
        >
          {editing ? "Cancel" : "Edit"}
        </button>
      </div>

      {editing ? (
        <form
          action={(formData) => {
            startTransition(async () => {
              await updateCategoryBudget(income.id, formData);
              setEditing(false);
            });
          }}
          className="mt-3 space-y-2"
        >
          <label className="block text-xs text-text-muted">
            Expected income
            <input
              name="monthlyBudget"
              type="number"
              min="0"
              step="1"
              defaultValue={income.expected ?? ""}
              placeholder="Not set"
              className="mt-1 w-full rounded-md border border-border-hairline bg-surface px-2 py-1.5 text-sm"
            />
          </label>
          <label className="block text-xs text-text-muted">
            Notes
            <textarea
              name="notes"
              defaultValue={income.notes ?? ""}
              rows={2}
              className="mt-1 w-full resize-none rounded-md border border-border-hairline bg-surface px-2 py-1.5 text-sm"
            />
          </label>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-[#2a78d6] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
          >
            Save
          </button>
        </form>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <div>
            <div className="text-text-muted">Expected Income</div>
            <div className="mt-0.5 font-medium tabular-nums">
              {income.expected != null ? formatCurrency(income.expected) : "Not set"}
            </div>
          </div>
          <div>
            <div className="text-text-muted">Actual Income</div>
            <div className="mt-0.5 font-medium tabular-nums text-[#0ca30c]">
              {formatCurrency(income.actual)}
            </div>
          </div>
          <div>
            <div className="text-text-muted">Difference</div>
            <div className={`mt-0.5 font-medium tabular-nums ${diffGood ? "text-[#0ca30c]" : "text-[#d03b3b]"}`}>
              {income.difference != null ? formatCurrency(income.difference) : "—"}
            </div>
          </div>
          {income.notes && (
            <p className="col-span-full border-t border-border-hairline pt-2 text-xs text-text-secondary">
              {income.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
