"use client";

import { useRef, useState, useTransition } from "react";
import { addCategory, type CategoryFormResult } from "@/app/actions";

const TYPE_OPTIONS = [
  { value: "essential", label: "Essential" },
  { value: "discretionary", label: "Discretionary" },
  { value: "giving", label: "Giving" },
  { value: "savings", label: "Savings" },
  { value: "income", label: "Income" },
];

export default function AddCategoryForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [result, setResult] = useState<CategoryFormResult | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(formData) => {
        startTransition(async () => {
          const res = await addCategory(formData);
          setResult(res);
          if (res.success) formRef.current?.reset();
        });
      }}
      className="flex flex-wrap items-end gap-3 rounded-lg border border-border-hairline bg-surface p-4"
    >
      <div className="flex flex-col gap-1">
        <label className="text-xs text-text-muted" htmlFor="new-cat-name">
          Name
        </label>
        <input
          id="new-cat-name"
          name="name"
          required
          placeholder="e.g. Kids Activities"
          className="rounded-md border border-border-hairline bg-surface px-2 py-1.5 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-text-muted" htmlFor="new-cat-type">
          Type
        </label>
        <select
          id="new-cat-type"
          name="type"
          defaultValue="discretionary"
          className="rounded-md border border-border-hairline bg-surface px-2 py-1.5 text-sm"
        >
          {TYPE_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-text-muted" htmlFor="new-cat-color">
          Color
        </label>
        <input
          id="new-cat-color"
          name="color"
          type="color"
          defaultValue="#6b7280"
          className="h-9 w-14 rounded-md border border-border-hairline bg-surface p-1"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-[#2a78d6] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#1c5cab] disabled:opacity-60"
      >
        Add category
      </button>
      {result && !result.success && (
        <p className="w-full text-sm text-[#d03b3b]">{result.message}</p>
      )}
    </form>
  );
}
