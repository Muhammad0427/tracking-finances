import { listCategories, listTransactions, getMonthsWithData } from "@/lib/queries";
import TransactionsTable from "@/components/TransactionsTable";

export default async function TransactionsPage(props: PageProps<"/transactions">) {
  const params = await props.searchParams;
  const month = typeof params.month === "string" ? params.month : undefined;
  const categoryParam = typeof params.category === "string" ? params.category : undefined;
  const search = typeof params.q === "string" ? params.q : undefined;

  const categoryId = categoryParam ? Number(categoryParam) : undefined;

  const [categories, months, transactions] = await Promise.all([
    listCategories(),
    getMonthsWithData(),
    listTransactions({
      month,
      categoryId: categoryParam === "uncategorized" ? null : categoryId,
      search,
      limit: 500,
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Transactions</h1>

      <form className="flex flex-wrap gap-3" method="get">
        <input
          type="search"
          name="q"
          defaultValue={search}
          placeholder="Search description…"
          className="rounded-md border border-border-hairline bg-surface px-3 py-1.5 text-sm outline-none focus:border-[#2a78d6]"
        />
        <select
          name="month"
          defaultValue={month ?? ""}
          className="rounded-md border border-border-hairline bg-surface px-3 py-1.5 text-sm"
        >
          <option value="">All months</option>
          {months.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          name="category"
          defaultValue={categoryParam ?? ""}
          className="rounded-md border border-border-hairline bg-surface px-3 py-1.5 text-sm"
        >
          <option value="">All categories</option>
          <option value="uncategorized">Uncategorized</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md bg-surface-secondary px-3 py-1.5 text-sm font-medium hover:bg-border-hairline"
        >
          Filter
        </button>
      </form>

      <TransactionsTable transactions={transactions} categories={categories} />
    </div>
  );
}
