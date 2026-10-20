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

// Vivid, high-saturation palette used only for this chart (the softer,
// muted colors elsewhere — Budget cards, Transactions, Categories — are
// unchanged). Assigned by a stable hash of the category name rather than
// its sort position, so a category keeps the same bright color across
// different months/filters instead of repainting when the ranking shifts.
const BRIGHT_PALETTE = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#a855f7", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
];

function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function brightColorFor(name: string): string {
  return BRIGHT_PALETTE[hashString(name) % BRIGHT_PALETTE.length];
}

function foldToTop(data: CategoryDatum[]): CategoryDatum[] {
  const sorted = [...data].sort((a, b) => b.total - a.total);
  const limited = sorted.length <= MAX_SLICES + 1
    ? sorted
    : [
        ...sorted.slice(0, MAX_SLICES),
        {
          name: "Other",
          total: sorted.slice(MAX_SLICES).reduce((sum, r) => sum + r.total, 0),
          color: OTHER_COLOR,
        },
      ];

  // "Other" stays a muted, visually distinct gray (it's an aggregate, not a
  // real category); every real category gets a bright color keyed to its name.
  return limited.map((entry) => (entry.name === "Other" ? entry : { ...entry, color: brightColorFor(entry.name) }));
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
