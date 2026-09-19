"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, formatMonthLabel } from "@/lib/format";
import type { MonthlySummary } from "@/lib/queries";

const INCOME_COLOR = "#2a78d6";
const EXPENSE_COLOR = "#eb6834";

function TooltipContent({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; dataKey: string; name?: string; color: string }[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-md border border-border-hairline bg-surface px-3 py-2 text-sm shadow-sm">
      <div className="font-medium">{label ? formatMonthLabel(label) : ""}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="mt-1 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-text-secondary">{p.name ?? p.dataKey}</span>
          <span className="ml-auto font-medium">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function MonthlyTrendChart({ data }: { data: MonthlySummary[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-text-muted">
        No trend data yet. Upload a statement to see spending over time.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 4, bottom: 4 }}>
        <CartesianGrid vertical={false} stroke="var(--border-hairline)" />
        <XAxis
          dataKey="month"
          tickFormatter={formatMonthLabel}
          tick={{ fontSize: 12, fill: "var(--text-muted)" }}
          axisLine={{ stroke: "var(--border-hairline)" }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v) => formatCurrency(v)}
          tick={{ fontSize: 12, fill: "var(--text-muted)" }}
          axisLine={{ stroke: "var(--border-hairline)" }}
          tickLine={false}
          width={80}
        />
        <Tooltip content={<TooltipContent />} />
        <Legend wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }} />
        <Line
          type="monotone"
          dataKey="income"
          stroke={INCOME_COLOR}
          strokeWidth={2}
          dot={{ r: 3 }}
          name="Income"
        />
        <Line
          type="monotone"
          dataKey="expenses"
          stroke={EXPENSE_COLOR}
          strokeWidth={2}
          dot={{ r: 3 }}
          name="Expenses"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
