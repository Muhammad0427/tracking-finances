"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/format";

export interface CategoryDatum {
  name: string;
  total: number;
  color: string;
}

const OTHER_COLOR = "#9ca3af";
const MAX_SLICES = 7;

function foldToTop(data: CategoryDatum[]): CategoryDatum[] {
  const sorted = [...data].sort((a, b) => b.total - a.total);
  if (sorted.length <= MAX_SLICES + 1) return sorted;

  const top = sorted.slice(0, MAX_SLICES);
  const rest = sorted.slice(MAX_SLICES);
  const otherTotal = rest.reduce((sum, r) => sum + r.total, 0);
  return [...top, { name: "Other", total: otherTotal, color: OTHER_COLOR }];
}

function TooltipContent({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: CategoryDatum }[];
}) {
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0].payload;
  return (
    <div className="rounded-md border border-border-hairline bg-surface px-3 py-2 text-sm shadow-sm">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: datum.color }} />
        <span className="font-medium">{datum.name}</span>
      </div>
      <div className="mt-1 text-text-secondary">{formatCurrency(datum.total)}</div>
    </div>
  );
}

export default function CategoryBreakdownChart({ data }: { data: CategoryDatum[] }) {
  const folded = foldToTop(data);

  if (folded.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-text-muted">
        No expense data yet. Upload a statement to see your breakdown.
      </div>
    );
  }

  const height = Math.max(220, folded.length * 40);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={folded} layout="vertical" margin={{ top: 4, right: 48, left: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke="var(--border-hairline)" />
        <XAxis
          type="number"
          tickFormatter={(v) => formatCurrency(v)}
          tick={{ fontSize: 12, fill: "var(--text-muted)" }}
          axisLine={{ stroke: "var(--border-hairline)" }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={140}
          tick={{ fontSize: 12, fill: "var(--text-secondary)" }}
          axisLine={{ stroke: "var(--border-hairline)" }}
          tickLine={false}
        />
        <Tooltip content={<TooltipContent />} cursor={{ fill: "var(--surface-secondary)" }} />
        <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={22}>
          {folded.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
          <LabelList
            dataKey="total"
            position="right"
            formatter={(v) => (typeof v === "number" ? formatCurrency(v) : "")}
            style={{ fill: "var(--text-secondary)", fontSize: 12 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
