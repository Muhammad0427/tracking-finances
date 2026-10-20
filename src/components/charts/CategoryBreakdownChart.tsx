"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, type PieLabelRenderProps } from "recharts";
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

const RADIAN = Math.PI / 180;

// Direct-labels only slices with a meaningfully large share; tiny slices would
// overlap and are better read from the legend + tooltip instead.
function renderSliceLabel(props: PieLabelRenderProps) {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
  if (
    percent == null ||
    percent < 0.05 ||
    cx == null ||
    cy == null ||
    midAngle == null ||
    innerRadius == null ||
    outerRadius == null
  ) {
    return null;
  }
  const numCx = Number(cx);
  const numCy = Number(cy);
  const radius = Number(innerRadius) + (Number(outerRadius) - Number(innerRadius)) * 0.6 + 14;
  const x = numCx + radius * Math.cos(-midAngle * RADIAN);
  const y = numCy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="var(--text-secondary)"
      fontSize={12}
      textAnchor={x > numCx ? "start" : "end"}
      dominantBaseline="central"
    >
      {Math.round(percent * 100)}%
    </text>
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

  return (
    <ResponsiveContainer width="100%" height={360}>
      <PieChart>
        <Pie
          data={folded}
          dataKey="total"
          nameKey="name"
          cx="50%"
          cy="46%"
          outerRadius={115}
          paddingAngle={folded.length > 1 ? 2 : 0}
          stroke="var(--surface)"
          strokeWidth={2}
          label={renderSliceLabel}
          labelLine={false}
          isAnimationActive={false}
        >
          {folded.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<TooltipContent />} />
        <Legend verticalAlign="bottom" height={48} wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
