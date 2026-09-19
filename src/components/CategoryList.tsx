"use client";

import { useState, useTransition } from "react";
import { deleteCategory, updateCategory } from "@/app/actions";
import type { Category } from "@/lib/queries";

const TYPE_LABELS: Record<string, string> = {
  income: "Income",
  essential: "Essential",
  discretionary: "Discretionary",
  giving: "Giving",
  savings: "Savings",
};

const TYPE_ORDER = ["income", "essential", "discretionary", "giving", "savings"];

function CategoryRow({ category }: { category: Category }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (editing) {
    return (
      <li className="flex flex-wrap items-center gap-2 px-4 py-2">
        <form
          action={(formData) => {
            startTransition(async () => {
              await updateCategory(category.id, formData);
              setEditing(false);
            });
          }}
          className="flex flex-1 flex-wrap items-center gap-2"
        >
          <input
            name="name"
            defaultValue={category.name}
            required
            className="min-w-[140px] flex-1 rounded-md border border-border-hairline bg-surface px-2 py-1 text-sm"
          />
          <select
            name="type"
            defaultValue={category.type}
            className="rounded-md border border-border-hairline bg-surface px-2 py-1 text-sm"
          >
            {TYPE_ORDER.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <input
            name="color"
            type="color"
            defaultValue={category.color}
            className="h-8 w-12 rounded-md border border-border-hairline bg-surface p-1"
          />
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-[#2a78d6] px-2 py-1 text-xs font-medium text-white"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-md px-2 py-1 text-xs text-text-secondary hover:bg-surface-secondary"
          >
            Cancel
          </button>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 px-4 py-2 text-sm">
      <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: category.color }} />
      <span className="font-medium">{category.name}</span>
      <span className="ml-auto flex items-center gap-3">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-xs text-text-secondary hover:text-foreground"
        >
          Edit
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            if (confirm(`Delete "${category.name}"? Its transactions will become uncategorized.`)) {
              startTransition(() => {
                void deleteCategory(category.id);
              });
            }
          }}
          className="text-xs text-text-muted hover:text-[#d03b3b]"
        >
          Delete
        </button>
      </span>
    </li>
  );
}

export default function CategoryList({ categories }: { categories: Category[] }) {
  return (
    <div className="space-y-6">
      {TYPE_ORDER.map((type) => {
        const items = categories.filter((c) => c.type === type);
        if (items.length === 0) return null;
        return (
          <section key={type}>
            <h2 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-text-muted">
              {TYPE_LABELS[type]}
            </h2>
            <ul className="divide-y divide-border-hairline rounded-lg border border-border-hairline bg-surface">
              {items.map((c) => (
                <CategoryRow key={c.id} category={c} />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
