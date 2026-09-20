"use client";

import { useState, useTransition } from "react";
import { updateCategoryBudget } from "@/app/actions";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { CategoryBudget } from "@/lib/budget";

function barColor(pctUsed: number | null): string {
  if (pctUsed == null) return "#c3c2b7";
  if (pctUsed >= 1) return "#d03b3b";
  if (pctUsed >= 0.85) return "#fab219";
  return "#0ca30c";
}

export default function BudgetCard({ category }: { category: CategoryBudget }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const hasBudget = category.monthlyBudget != null;
  const pct = category.pctUsed;

  return (
    <div className="rounded-lg border border-border-hairline bg-surface p-4">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
        <span className="truncate font-medium">{category.name}</span>
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
              await updateCategoryBudget(category.id, formData);
              setEditing(false);
            });
          }}
          className="mt-3 space-y-2"
        >
          <label className="block text-xs text-text-muted">
            Monthly budget
            <input
              name="monthlyBudget"
              type="number"
              min="0"
              step="1"
              defaultValue={category.monthlyBudget ?? ""}
              placeholder="No limit set"
              className="mt-1 w-full rounded-md border border-border-hairline bg-surface px-2 py-1.5 text-sm"
            />
          </label>
          <label className="block text-xs text-text-muted">
            Notes
            <textarea
              name="notes"
              defaultValue={category.notes ?? ""}
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
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex items-baseline justify-between">
            <span className="text-text-muted">Monthly Budget</span>
            <span className="font-medium tabular-nums">
              {hasBudget ? formatCurrency(category.monthlyBudget as number) : "Not set"}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-text-muted">Amount Spent</span>
            <span className="font-medium tabular-nums">{formatCurrency(category.spent)}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-text-muted">Amount Remaining</span>
            <span
              className={`font-medium tabular-nums ${
                hasBudget && (category.remaining ?? 0) < 0 ? "text-[#d03b3b]" : ""
              }`}
            >
              {hasBudget ? formatCurrency(category.remaining as number) : "—"}
            </span>
          </div>

          {hasBudget && (
            <div>
              <div className="flex items-baseline justify-between text-xs text-text-muted">
                <span>% of Budget Used</span>
                <span className="tabular-nums">{formatPercent(pct ?? 0)}</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-secondary">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, Math.round((pct ?? 0) * 100))}%`,
                    backgroundColor: barColor(pct),
                  }}
                />
              </div>
            </div>
          )}

          {category.notes && (
            <p className="border-t border-border-hairline pt-2 text-xs text-text-secondary">
              {category.notes}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
