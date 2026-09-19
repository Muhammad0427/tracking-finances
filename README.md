# Tracking Finances

A personal finance tracker: upload bank/credit card statements, automatically
categorize spending, follow trends over time, and surface unnecessary or
unusual expenses. Includes a dedicated **Zakat & Sadaqa** category so giving
is tracked separately from other spending.

## Features

- **Upload statements** — import a CSV export from your bank or credit card.
  Handles common formats (a single amount column, or separate debit/credit
  columns) and auto-detects date/description/amount columns.
- **Auto-categorization** — transactions are matched against keyword rules
  into categories like Groceries, Dining & Takeout, Housing & Rent,
  Subscriptions, and **Zakat & Sadaqa**. Categories can be edited, recolored,
  added, or removed, and any transaction can be manually recategorized.
- **Trends** — income vs. expenses over time, and a spending-by-category
  breakdown, filterable by month or all-time.
- **Unnecessary spending detection**:
  - Discretionary spending share of total expenses, with a breakdown of the
    top discretionary categories.
  - Recurring charge / subscription detection — merchants billing a similar
    amount across two or more months.
  - Spending spikes — categories running well above their usual monthly
    average.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), then go to **Upload
Statement** to import a CSV.

Data is stored locally in a SQLite database at `data/finances.db` (created
automatically on first run, and git-ignored).

## CSV format

Any of these column layouts work:

- `Date, Description, Amount` (negative = expense, positive = income)
- `Date, Description, Debit, Credit`
- `Date, Description, Withdrawal, Deposit`

Column names are matched case-insensitively and don't need to match exactly.

## Tech stack

Next.js (App Router, Server Actions) + TypeScript + Tailwind CSS +
better-sqlite3 + Recharts.
