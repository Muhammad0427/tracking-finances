import { formatCurrency } from "@/lib/format";
import type { SavingsTip } from "@/lib/budget";

export default function SavingsTips({ tips }: { tips: SavingsTip[] }) {
  if (tips.length === 0) return null;

  return (
    <section className="rounded-lg border border-border-hairline bg-surface p-4">
      <h2 className="text-sm font-medium text-text-secondary">Ways to save</h2>
      <p className="mt-0.5 text-xs text-text-muted">
        Based on this month&apos;s spending, regardless of whether a budget is set.
      </p>
      <ul className="mt-3 space-y-2">
        {tips.map((t) => (
          <li key={t.categoryName} className="flex items-start gap-2 rounded-md border border-border-hairline p-2.5 text-sm">
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: t.color }} />
            <span>
              <span className="font-medium">{t.categoryName}</span>
              <span className="text-text-muted"> ({formatCurrency(t.spent)} this month)</span>
              {" — "}
              {t.tip}.
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
