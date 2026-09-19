import { getDb } from "./db";

function normalizeDescription(desc: string): string {
  return desc
    .toLowerCase()
    .replace(/\d+/g, "") // strip numbers (dates, card digits, invoice ids)
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface RecurringCharge {
  description: string;
  averageAmount: number;
  occurrences: number;
  months: string[];
  categoryName: string | null;
  categoryColor: string | null;
  monthlyTotal: number;
}

interface RawTxRow {
  date: string;
  description: string;
  amount: number;
  category_name: string | null;
  category_color: string | null;
}

// Detects likely recurring subscriptions/charges: same merchant, similar amount,
// appearing in two or more distinct months.
export function detectRecurringCharges(): RecurringCharge[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT t.date, t.description, t.amount, c.name as category_name, c.color as category_color
       FROM transactions t LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.amount < 0`
    )
    .all() as RawTxRow[];

  const groups = new Map<string, RawTxRow[]>();
  for (const row of rows) {
    const key = normalizeDescription(row.description);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  const recurring: RecurringCharge[] = [];
  for (const [, txs] of groups) {
    const months = new Set(txs.map((t) => t.date.slice(0, 7)));
    if (months.size < 2) continue;

    const amounts = txs.map((t) => Math.abs(t.amount));
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const withinTolerance = amounts.every((a) => Math.abs(a - avg) / avg <= 0.15);
    if (!withinTolerance) continue;

    recurring.push({
      description: txs[0].description,
      averageAmount: avg,
      occurrences: txs.length,
      months: Array.from(months).sort(),
      categoryName: txs[0].category_name,
      categoryColor: txs[0].category_color,
      monthlyTotal: avg,
    });
  }

  return recurring.sort((a, b) => b.monthlyTotal - a.monthlyTotal);
}

export interface DiscretionaryInsight {
  totalExpenses: number;
  discretionaryTotal: number;
  discretionaryShare: number;
  givingTotal: number;
  topDiscretionaryCategories: { name: string; color: string; total: number }[];
}

export function getDiscretionaryInsight(month?: string): DiscretionaryInsight {
  const db = getDb();
  const where = month ? "WHERE t.date LIKE @month AND t.amount < 0" : "WHERE t.amount < 0";
  const rows = db
    .prepare(
      `SELECT COALESCE(c.name,'Uncategorized') as name, COALESCE(c.color,'#9ca3af') as color,
              COALESCE(c.type,'discretionary') as type, SUM(-t.amount) as total
       FROM transactions t LEFT JOIN categories c ON c.id = t.category_id
       ${where}
       GROUP BY c.id`
    )
    .all(month ? { month: `${month}%` } : {}) as {
    name: string;
    color: string;
    type: string;
    total: number;
  }[];

  const totalExpenses = rows.reduce((sum, r) => sum + r.total, 0);
  const discretionaryRows = rows.filter((r) => r.type === "discretionary");
  const discretionaryTotal = discretionaryRows.reduce((sum, r) => sum + r.total, 0);
  const givingTotal = rows.filter((r) => r.type === "giving").reduce((s, r) => s + r.total, 0);

  return {
    totalExpenses,
    discretionaryTotal,
    discretionaryShare: totalExpenses > 0 ? discretionaryTotal / totalExpenses : 0,
    givingTotal,
    topDiscretionaryCategories: discretionaryRows
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map((r) => ({ name: r.name, color: r.color, total: r.total })),
  };
}

export interface CategorySpike {
  categoryName: string;
  categoryColor: string;
  currentMonth: string;
  currentTotal: number;
  averagePriorTotal: number;
  percentIncrease: number;
}

// Flags categories where the latest month's spend is significantly above
// the trailing average for that category (a signal of unusual/unnecessary spending).
export function detectSpendingSpikes(): CategorySpike[] {
  const db = getDb();
  const months = db
    .prepare(`SELECT DISTINCT substr(date,1,7) as month FROM transactions ORDER BY month ASC`)
    .all() as { month: string }[];
  if (months.length < 2) return [];

  const latestMonth = months[months.length - 1].month;
  const priorMonths = months.slice(0, -1).map((m) => m.month);

  const rows = db
    .prepare(
      `SELECT COALESCE(c.id, -1) as category_id, COALESCE(c.name,'Uncategorized') as name,
              COALESCE(c.color,'#9ca3af') as color, COALESCE(c.type,'discretionary') as type,
              substr(t.date,1,7) as month, SUM(-t.amount) as total
       FROM transactions t LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.amount < 0
       GROUP BY category_id, month`
    )
    .all() as { category_id: number; name: string; color: string; type: string; month: string; total: number }[];

  // Only essential/discretionary spending is "unnecessary spending" territory;
  // a jump in giving or savings is not a problem to flag here.
  const trackedRows = rows.filter((r) => r.type === "essential" || r.type === "discretionary");

  const byCategory = new Map<number, { name: string; color: string; byMonth: Map<string, number> }>();
  for (const row of trackedRows) {
    if (!byCategory.has(row.category_id)) {
      byCategory.set(row.category_id, { name: row.name, color: row.color, byMonth: new Map() });
    }
    byCategory.get(row.category_id)!.byMonth.set(row.month, row.total);
  }

  const spikes: CategorySpike[] = [];
  for (const [, cat] of byCategory) {
    const currentTotal = cat.byMonth.get(latestMonth) ?? 0;
    const priorTotals = priorMonths.map((m) => cat.byMonth.get(m) ?? 0);
    const priorWithData = priorTotals.filter((t) => t > 0);
    if (priorWithData.length === 0 || currentTotal === 0) continue;

    const avgPrior = priorWithData.reduce((a, b) => a + b, 0) / priorWithData.length;
    if (avgPrior <= 0) continue;
    const percentIncrease = (currentTotal - avgPrior) / avgPrior;

    if (percentIncrease >= 0.25 && currentTotal - avgPrior >= 20) {
      spikes.push({
        categoryName: cat.name,
        categoryColor: cat.color,
        currentMonth: latestMonth,
        currentTotal,
        averagePriorTotal: avgPrior,
        percentIncrease,
      });
    }
  }

  return spikes.sort((a, b) => b.percentIncrease - a.percentIncrease);
}
