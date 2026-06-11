interface BarSegment {
  label: string;
  value: number;
  color: string;
}

interface BarRow {
  label: string;
  segments: BarSegment[];
}

export default function StackedBarChart({
  rows,
  formatValue,
  emptyText = "Veri bulunamadı.",
}: {
  rows: BarRow[];
  formatValue: (value: number) => string;
  emptyText?: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-gray-500">{emptyText}</p>;
  }

  const max = Math.max(
    ...rows.map((row) => row.segments.reduce((sum, seg) => sum + seg.value, 0)),
    1
  );

  return (
    <div className="flex flex-col gap-4">
      {rows.map((row) => {
        const total = row.segments.reduce((sum, seg) => sum + seg.value, 0);
        return (
          <div key={row.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">{row.label}</span>
              <span className="text-gray-500">{formatValue(total)}</span>
            </div>
            <div className="flex h-7 w-full overflow-hidden rounded-full bg-gray-100">
              {row.segments.map((seg) => (
                <div
                  key={seg.label}
                  title={`${seg.label}: ${formatValue(seg.value)}`}
                  className="flex items-center justify-center overflow-hidden whitespace-nowrap text-xs font-medium text-white"
                  style={{
                    width: `${(seg.value / max) * 100}%`,
                    backgroundColor: seg.color,
                  }}
                >
                  {seg.value > 0 ? formatValue(seg.value) : ""}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
