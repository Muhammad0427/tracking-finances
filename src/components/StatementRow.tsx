"use client";

import { useTransition } from "react";
import { deleteStatement } from "@/app/actions";

export default function StatementRow({
  statement,
}: {
  statement: { id: number; filename: string; uploaded_at: string; transaction_count: number };
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <li className="flex items-center gap-3 px-4 py-3 text-sm">
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{statement.filename}</div>
        <div className="text-xs text-text-muted">
          {new Date(statement.uploaded_at).toLocaleString()} &middot; {statement.transaction_count}{" "}
          transactions
        </div>
      </div>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (confirm(`Remove "${statement.filename}" and its ${statement.transaction_count} transactions?`)) {
            startTransition(() => deleteStatement(statement.id));
          }
        }}
        className="shrink-0 rounded-md px-2 py-1 text-xs text-[#d03b3b] hover:bg-[#d03b3b]/10 disabled:opacity-50"
      >
        Remove
      </button>
    </li>
  );
}
