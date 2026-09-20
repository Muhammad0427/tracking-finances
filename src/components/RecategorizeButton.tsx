"use client";

import { useState, useTransition } from "react";
import { recategorizeAllTransactions } from "@/app/actions";

export default function RecategorizeButton() {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="rounded-lg border border-border-hairline bg-surface p-4">
      <h2 className="text-sm font-medium">Re-run auto-categorization</h2>
      <p className="mt-1 text-sm text-text-secondary">
        Applies the current rules above to every existing transaction — useful after adding a
        category or fixing a rule so past imports catch up without re-uploading. This overwrites
        any category you&apos;ve picked by hand, including ones that differ from what the rules
        would choose.
      </p>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (
            confirm(
              "Re-categorize every transaction using the current rules? This will overwrite any manual category changes you've made."
            )
          ) {
            setMessage(null);
            startTransition(async () => {
              const res = await recategorizeAllTransactions();
              setMessage(res.message);
            });
          }
        }}
        className="mt-3 rounded-md bg-[#2a78d6] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#1c5cab] disabled:opacity-60"
      >
        {isPending ? "Recategorizing…" : "Re-run on all transactions"}
      </button>
      {message && <p className="mt-2 text-sm text-text-secondary">{message}</p>}
    </div>
  );
}
