import type { BodyLog } from "@/lib/types";

type ProgressChartProps = {
  logs: BodyLog[];
};

export function ProgressChart({ logs }: ProgressChartProps) {
  const points = logs.slice(-14);
  if (points.length === 0) {
    return <div className="rounded-3xl bg-gray-50 p-6 text-center text-sm font-semibold text-muted">体重を記録すると推移が表示されます</div>;
  }

  const weights = points.map((point) => point.weight);
  const min = Math.min(...weights) - 0.5;
  const max = Math.max(...weights) + 0.5;

  return (
    <div className="flex h-40 items-end gap-2 rounded-3xl bg-gray-50 p-4">
      {points.map((point) => {
        const height = ((point.weight - min) / Math.max(max - min, 1)) * 100;
        return (
          <div key={point.id} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-28 w-full items-end">
              <div className="w-full rounded-full bg-ink" style={{ height: `${Math.max(12, height)}%` }} />
            </div>
            <span className="text-[10px] font-bold text-muted">{point.date.slice(5).replace("-", "/")}</span>
          </div>
        );
      })}
    </div>
  );
}
