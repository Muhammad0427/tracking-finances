# Tracking Finances

A personal finance tracker: upload bank/credit card statements, automatically
categorize spending, set monthly budgets per category, follow trends over
time, and surface unnecessary or unusual expenses. Includes dedicated
**Zakat & Sadaqa** and **Quran** categories so giving and religious spending
are tracked separately from everything else.

## Features

- **Upload statements** — import a CSV or PDF export from your bank or
  credit card. CSV handles common formats (a single amount column, or
  separate debit/credit columns) and auto-detects date/description/amount
  columns; PDF uses a best-effort line-based text parser (see below).
- **Auto-categorization** — transactions are matched against keyword rules
  into a full household budget category list (Groceries, DTE Energy,
  Detroit Water, Comcast Internet, separate phone lines, vehicle upkeep,
  Zakat & Sadaqa, Quran, and more). Categories can be edited, recolored,
  added, or removed, and any transaction can be manually recategorized.
- **Budget** — set a monthly limit and notes on any category, and track
  Monthly Budget / Amount Spent / Amount Remaining / % of Budget Used for
  each, plus Expected vs. Actual income, browsable by month. A smart
  suggestions panel flags categories over or near their limit with a
  concrete way to cut back.
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
Statement** to import a CSV or PDF.

Data lives in SQLite via [Turso](https://turso.tech) (libSQL). With no
`TURSO_DATABASE_URL` set, it falls back to a local file at
`data/finances.db` (created automatically, git-ignored) — no setup needed
for local development. Set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` (see
`.env.local`) to use a hosted database, which is required for deployment to
a serverless/ephemeral-filesystem host like Vercel.

## CSV format

Any of these column layouts work:

- `Date, Description, Amount` (negative = expense, positive = income)
- `Date, Description, Debit, Credit`
- `Date, Description, Withdrawal, Deposit`

Column names are matched case-insensitively and don't need to match exactly.

## PDF format

PDF parsing is best-effort: it reads each line looking for a leading date
followed by a description and a trailing dollar amount (optionally followed
by a running balance, or a `CR`/`DR` marker). It works well for statements
that print one transaction per line in that shape. It will not work well
for scanned/image-only PDFs (no text layer) or multi-column/multi-line
layouts — CSV is more reliable when your bank offers it. Always review
imported amounts and income/expense signs after a PDF import.

## Tech stack

Next.js (App Router, Server Actions) + TypeScript + Tailwind CSS +
Turso/libSQL (`@libsql/client`) + Recharts + `pdf-parse`.
