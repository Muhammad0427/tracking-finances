export default function StatTile({
  label,
  value,
  sublabel,
  tone = "default",
}: {
  label: string;
  value: string;
  sublabel?: string;
  tone?: "default" | "good" | "critical";
}) {
  const valueColor =
    tone === "good" ? "text-[#0ca30c]" : tone === "critical" ? "text-[#d03b3b]" : "text-foreground";

  return (
    <div className="rounded-lg border border-border-hairline bg-surface p-4">
      <div className="text-sm text-text-muted">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${valueColor}`}>{value}</div>
      {sublabel && <div className="mt-1 text-xs text-text-secondary">{sublabel}</div>}
    </div>
  );
}
