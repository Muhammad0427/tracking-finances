import Link from "next/link";
import { getBudgetOverview, getBudgetSuggestions } from "@/lib/budget";
import { getMonthsWithData } from "@/lib/queries";
import { formatMonthLabel } from "@/lib/format";
import BudgetCard from "@/components/BudgetCard";
import IncomeBudgetCard from "@/components/IncomeBudgetCard";
import SmartSuggestions from "@/components/SmartSuggestions";

export const dynamic = "force-dynamic";

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default async function BudgetPage(props: PageProps<"/budget">) {
  const params = await props.searchParams;
  const thisMonth = currentMonth();
  const monthsWithData = await getMonthsWithData();
  const availableMonths = Array.from(new Set([thisMonth, ...monthsWithData])).sort().reverse();

  const requestedMonth = typeof params.month === "string" ? params.month : undefined;
  const month = requestedMonth && availableMonths.includes(requestedMonth) ? requestedMonth : thisMonth;

  const { income, categories } = await getBudgetOverview(month);
  const suggestions = getBudgetSuggestions(categories);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Budget</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Set a monthly limit on any category and track spend against it.
          </p>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto">
          {availableMonths.map((m) => (
            <Link
              key={m}
              href={`/budget?month=${m}`}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${
                month === m
                  ? "bg-[#2a78d6]/10 font-medium text-[#2a78d6]"
                  : "text-text-secondary hover:bg-surface-secondary"
              }`}
            >
              {m === thisMonth ? "This month" : formatMonthLabel(m)}
            </Link>
          ))}
        </div>
      </div>

      <SmartSuggestions suggestions={suggestions} />

      {income && <IncomeBudgetCard income={income} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((c) => (
          <BudgetCard key={c.id} category={c} />
        ))}
      </div>
    </div>
  );
}
