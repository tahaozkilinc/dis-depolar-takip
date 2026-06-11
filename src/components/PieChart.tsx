interface PieChartSegment {
  label: string;
  value: number;
  color: string;
}

export const PIE_COLORS = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
  "#db2777",
  "#65a30d",
];

export default function PieChart({
  segments,
  formatValue,
  emptyText = "Veri bulunamadı.",
}: {
  segments: PieChartSegment[];
  formatValue: (value: number) => string;
  emptyText?: string;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  if (total <= 0) {
    return <p className="text-sm text-gray-500">{emptyText}</p>;
  }

  const gradientParts = segments.reduce<{ parts: string[]; cumulative: number }>(
    (acc, seg) => {
      const start = (acc.cumulative / total) * 360;
      const cumulative = acc.cumulative + seg.value;
      const end = (cumulative / total) * 360;
      acc.parts.push(`${seg.color} ${start}deg ${end}deg`);
      return { parts: acc.parts, cumulative };
    },
    { parts: [], cumulative: 0 }
  ).parts;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div
        className="h-40 w-40 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${gradientParts.join(", ")})` }}
      />
      <ul className="flex flex-col gap-1.5 text-sm">
        {segments.map((seg) => (
          <li key={seg.label} className="flex items-center gap-2">
            <span
              className="h-3 w-3 shrink-0 rounded-sm"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-gray-700">{seg.label}</span>
            <span className="font-medium text-gray-900">
              {formatValue(seg.value)}
            </span>
            <span className="text-xs text-gray-400">
              (%{((seg.value / total) * 100).toFixed(1)})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
