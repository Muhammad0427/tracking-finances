import Link from "next/link";
import StatTile from "@/components/StatTile";
import CategoryBreakdownChart from "@/components/charts/CategoryBreakdownChart";
import MonthlyTrendChart from "@/components/charts/MonthlyTrendChart";
import {
  getCategoryTotals,
  getMonthlySummaries,
  getMonthsWithData,
} from "@/lib/queries";
import { detectRecurringCharges, detectSpendingSpikes, getDiscretionaryInsight } from "@/lib/insights";
import { formatCurrency, formatMonthLabel, formatPercent } from "@/lib/format";

export default async function DashboardPage(props: PageProps<"/">) {
  const params = await props.searchParams;
  const months = await getMonthsWithData();
  const requestedMonth = typeof params.month === "string" ? params.month : undefined;
  const selectedMonth = requestedMonth && months.includes(requestedMonth) ? requestedMonth : undefined;

  const [categoryTotals, monthlySummaries, discretionary, recurring, spikes] = await Promise.all([
    getCategoryTotals(selectedMonth),
    getMonthlySummaries(),
    getDiscretionaryInsight(selectedMonth),
    detectRecurringCharges(),
    detectSpendingSpikes(),
  ]);

  const currentSummary = selectedMonth
    ? monthlySummaries.find((m) => m.month === selectedMonth)
    : monthlySummaries.reduce(
        (acc, m) => ({ month: "all", income: acc.income + m.income, expenses: acc.expenses + m.expenses, net: 0 }),
        { month: "all", income: 0, expenses: 0, net: 0 }
      );
  const net = (currentSummary?.income ?? 0) - (currentSummary?.expenses ?? 0);

  const zakatCategory = categoryTotals.find((c) => c.category_name === "Zakat & Sadaqa");

  if (months.length === 0) {
    return (
      <div className="mx-auto max-w-lg py-24 text-center">
        <h1 className="text-xl font-semibold">Welcome to Tracking Finances</h1>
        <p className="mt-2 text-text-secondary">
          Upload a bank statement to start tracking your spending, trends, and giving.
        </p>
        <Link
          href="/upload"
          className="mt-6 inline-block rounded-md bg-[#2a78d6] px-4 py-2 text-sm font-medium text-white hover:bg-[#1c5cab]"
        >
          Upload your first statement
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <div className="flex items-center gap-1 overflow-x-auto">
          <Link
            href="/"
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${
              !selectedMonth ? "bg-[#2a78d6]/10 font-medium text-[#2a78d6]" : "text-text-secondary hover:bg-surface-secondary"
            }`}
          >
            All time
          </Link>
          {months.map((m) => (
            <Link
              key={m}
              href={`/?month=${m}`}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${
                selectedMonth === m ? "bg-[#2a78d6]/10 font-medium text-[#2a78d6]" : "text-text-secondary hover:bg-surface-secondary"
              }`}
            >
              {formatMonthLabel(m)}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Income" value={formatCurrency(currentSummary?.income ?? 0)} tone="good" />
        <StatTile label="Expenses" value={formatCurrency(currentSummary?.expenses ?? 0)} tone="critical" />
        <StatTile
          label="Net"
          value={formatCurrency(net)}
          tone={net >= 0 ? "good" : "critical"}
        />
        <StatTile
          label="Zakat & Sadaqa"
          value={formatCurrency(zakatCategory?.total ?? 0)}
          sublabel="Given this period"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-border-hairline bg-surface p-4">
          <h2 className="text-sm font-medium text-text-secondary">Spending by category</h2>
          <div className="mt-3">
            <CategoryBreakdownChart
              data={categoryTotals.map((c) => ({
                name: c.category_name,
                total: c.total,
                color: c.category_color,
              }))}
            />
          </div>
        </section>

        <section className="rounded-lg border border-border-hairline bg-surface p-4">
          <h2 className="text-sm font-medium text-text-secondary">Income vs. expenses over time</h2>
          <div className="mt-3">
            <MonthlyTrendChart data={monthlySummaries} />
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-border-hairline bg-surface p-4">
        <h2 className="text-sm font-medium text-text-secondary">Unnecessary spending &amp; things to review</h2>

        <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-medium">Discretionary spending</h3>
              <span className="text-sm tabular-nums text-text-secondary">
                {formatPercent(discretionary.discretionaryShare)} of expenses
              </span>
            </div>
            {discretionary.topDiscretionaryCategories.length === 0 ? (
              <p className="mt-2 text-sm text-text-muted">No discretionary spending recorded.</p>
            ) : (
              <ul className="mt-2 space-y-1.5">
                {discretionary.topDiscretionaryCategories.map((c) => (
                  <li key={c.name} className="flex items-center gap-2 text-sm">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="text-text-secondary">{c.name}</span>
                    <span className="ml-auto font-medium tabular-nums">{formatCurrency(c.total)}</span>
                  </li>
                ))}
              </ul>
            )}

            {spikes.length > 0 && (
              <div className="mt-4 rounded-md border border-[#fab219]/40 bg-[#fab219]/10 p-3">
                <p className="text-sm font-medium">Spending spikes vs. your average</p>
                <ul className="mt-1.5 space-y-1 text-sm text-text-secondary">
                  {spikes.slice(0, 4).map((s) => (
                    <li key={s.categoryName}>
                      <span className="font-medium text-foreground">{s.categoryName}</span> is up{" "}
                      {formatPercent(s.percentIncrease)} in {formatMonthLabel(s.currentMonth)} (
                      {formatCurrency(s.currentTotal)} vs. usual {formatCurrency(s.averagePriorTotal)})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium">Recurring charges &amp; subscriptions to review</h3>
            {recurring.length === 0 ? (
              <p className="mt-2 text-sm text-text-muted">
                No recurring charges detected yet. This needs at least two months of statements.
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-border-hairline">
                {recurring.slice(0, 8).map((r) => (
                  <li key={r.description} className="flex items-center gap-2 py-1.5 text-sm">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: r.categoryColor ?? "#9ca3af" }}
                    />
                    <span className="truncate text-text-secondary" title={r.description}>
                      {r.description}
                    </span>
                    <span className="ml-auto shrink-0 text-xs text-text-muted">
                      {r.occurrences}&times;
                    </span>
                    <span className="shrink-0 font-medium tabular-nums">
                      {formatCurrency(r.monthlyTotal)}/mo
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
