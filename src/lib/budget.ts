import { getDb, toRows } from "./db";
import { formatCurrency } from "./format";
import type { CategoryType } from "./categories";

export interface CategoryBudget {
  id: number;
  name: string;
  type: CategoryType;
  color: string;
  monthlyBudget: number | null;
  spent: number;
  remaining: number | null;
  pctUsed: number | null;
  notes: string | null;
}

export interface IncomeBudget {
  id: number;
  expected: number | null;
  actual: number;
  difference: number | null;
  notes: string | null;
}

export interface BudgetOverview {
  income: IncomeBudget | null;
  categories: CategoryBudget[];
}

export async function getBudgetOverview(month: string): Promise<BudgetOverview> {
  const db = await getDb();

  const categoriesResult = await db.execute(
    "SELECT id, name, type, color, monthly_budget, notes FROM categories ORDER BY type, name"
  );
  const categories = toRows<{
    id: number;
    name: string;
    type: CategoryType;
    color: string;
    monthly_budget: number | null;
    notes: string | null;
  }>(categoriesResult);

  const spentResult = await db.execute({
    sql: `SELECT category_id,
                 SUM(CASE WHEN amount < 0 THEN -amount ELSE amount END) as total
          FROM transactions
          WHERE date LIKE ?
          GROUP BY category_id`,
    args: [`${month}%`],
  });
  const spentRows = toRows<{ category_id: number | null; total: number }>(spentResult);
  const spentByCategory = new Map(spentRows.map((r) => [r.category_id, r.total]));

  const incomeRow = categories.find((c) => c.type === "income");
  const income: IncomeBudget | null = incomeRow
    ? {
        id: incomeRow.id,
        expected: incomeRow.monthly_budget,
        actual: spentByCategory.get(incomeRow.id) ?? 0,
        difference:
          incomeRow.monthly_budget != null
            ? (spentByCategory.get(incomeRow.id) ?? 0) - incomeRow.monthly_budget
            : null,
        notes: incomeRow.notes,
      }
    : null;

  const expenseCategories: CategoryBudget[] = categories
    .filter((c) => c.type !== "income")
    .map((c) => {
      const spent = spentByCategory.get(c.id) ?? 0;
      const budget = c.monthly_budget;
      return {
        id: c.id,
        name: c.name,
        type: c.type,
        color: c.color,
        monthlyBudget: budget,
        spent,
        remaining: budget != null ? budget - spent : null,
        pctUsed: budget != null && budget > 0 ? spent / budget : null,
        notes: c.notes,
      };
    });

  return { income, categories: expenseCategories };
}

export interface BudgetSuggestion {
  categoryName: string;
  color: string;
  severity: "over" | "near";
  message: string;
}

// Canned, category-specific cut suggestions. Generic categories without a
// specific tip still get a suggestion, just without the tailored second half.
const CATEGORY_TIPS: Record<string, string> = {
  Groceries: "try meal planning, store-brand swaps, or shopping sales to bring this back down",
  "Shopping / Online Purchases": "pausing non-essential online orders for the rest of the month would help",
  "Restaurants / Uber Eats": "cooking a few more meals at home this week can close the gap quickly",
  "Hair & Maintenance": "spacing out your next appointment by a couple of weeks would help stay in range",
  "Gas – Car": "combining errands into fewer trips can cut down on fuel spend",
  Toiletries: "buying in bulk or switching to a store brand can help here",
  "Household Supplies": "stocking up during sales instead of as-needed can reduce this",
  Entertainment: "trimming one subscription or outing this month would help offset this",
  Subscriptions: "canceling or pausing a rarely-used subscription would help offset this",
};

const NEAR_LIMIT_THRESHOLD = 0.85;

export function getBudgetSuggestions(categories: CategoryBudget[]): BudgetSuggestion[] {
  const budgeted = categories.filter((c) => c.monthlyBudget != null && c.monthlyBudget > 0);

  // Discretionary categories with room left, ranked by how much slack they have —
  // used to suggest a concrete place to offset an overage.
  const withSlack = budgeted
    .filter((c) => c.type === "discretionary" && (c.remaining ?? 0) > 0)
    .sort((a, b) => (b.remaining ?? 0) - (a.remaining ?? 0));

  const suggestions: BudgetSuggestion[] = [];

  for (const c of budgeted) {
    const pct = c.pctUsed ?? 0;
    if (pct >= 1) {
      const overage = c.spent - (c.monthlyBudget ?? 0);
      const tip = CATEGORY_TIPS[c.name];
      const offset = withSlack.find((s) => s.name !== c.name);
      const offsetText = offset
        ? ` You have ${formatCurrency(offset.remaining ?? 0)} of slack left in ${offset.name} this month if you want to offset it there.`
        : "";
      suggestions.push({
        categoryName: c.name,
        color: c.color,
        severity: "over",
        message: `${c.name} is ${formatCurrency(overage)} over its ${formatCurrency(c.monthlyBudget ?? 0)} budget.${
          tip ? ` Try: ${tip}.` : ""
        }${offsetText}`,
      });
    } else if (pct >= NEAR_LIMIT_THRESHOLD) {
      suggestions.push({
        categoryName: c.name,
        color: c.color,
        severity: "near",
        message: `${c.name} is at ${Math.round(pct * 100)}% of its ${formatCurrency(
          c.monthlyBudget ?? 0
        )} budget, with ${formatCurrency(c.remaining ?? 0)} left this month.`,
      });
    }
  }

  return suggestions.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "over" ? -1 : 1));
}
