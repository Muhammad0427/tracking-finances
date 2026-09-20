import type { BudgetSuggestion } from "@/lib/budget";

export default function SmartSuggestions({ suggestions }: { suggestions: BudgetSuggestion[] }) {
  if (suggestions.length === 0) return null;

  return (
    <section className="rounded-lg border border-border-hairline bg-surface p-4">
      <h2 className="text-sm font-medium text-text-secondary">Smart suggestions</h2>
      <ul className="mt-2 space-y-2">
        {suggestions.map((s) => (
          <li
            key={s.categoryName}
            className={`flex items-start gap-2 rounded-md border p-2.5 text-sm ${
              s.severity === "over"
                ? "border-[#d03b3b]/30 bg-[#d03b3b]/10"
                : "border-[#fab219]/40 bg-[#fab219]/10"
            }`}
          >
            <span
              className="mt-1 h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-foreground">{s.message}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
