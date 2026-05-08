import type { BodyLog } from "@/lib/types";

type ProgressChartProps = {
  logs: BodyLog[];
  targetWeight?: number;
};

export function ProgressChart({ logs, targetWeight }: ProgressChartProps) {
  const points = logs.slice(-14);
  if (points.length === 0) {
    return <div className="rounded-3xl bg-gray-50 p-6 text-center text-sm font-semibold text-muted">体重を記録すると推移が表示されます</div>;
  }

  const weights = points.map((point) => point.weight);
  const rangeValues = targetWeight ? [...weights, targetWeight] : weights;
  const min = Math.min(...rangeValues) - 0.5;
  const max = Math.max(...rangeValues) + 0.5;
  const width = 320;
  const height = 150;
  const chartTop = 16;
  const chartBottom = 112;
  const xFor = (index: number) => (points.length === 1 ? width / 2 : 18 + (index / (points.length - 1)) * (width - 36));
  const yFor = (weight: number) => chartBottom - ((weight - min) / Math.max(max - min, 1)) * (chartBottom - chartTop);
  const path = points.map((point, index) => `${xFor(index)},${yFor(point.weight)}`).join(" ");
  const areaPath = `M ${points.map((point, index) => `${xFor(index)},${yFor(point.weight)}`).join(" L ")} L ${xFor(points.length - 1)},${chartBottom} L ${xFor(0)},${chartBottom} Z`;
  const targetY = targetWeight ? yFor(targetWeight) : undefined;

  return (
    <div className="rounded-3xl bg-gray-50 p-4">
      <div className="mb-2 flex items-center justify-between text-xs font-black text-muted">
        <span>{points[0].date.slice(5).replace("-", "/")}</span>
        <span>{points.at(-1)?.date.slice(5).replace("-", "/")}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="体重推移グラフ" className="h-40 w-full overflow-visible">
        <path d={areaPath} fill="#dff7ef" />
        {targetY !== undefined && (
          <>
            <line x1="18" x2={width - 18} y1={targetY} y2={targetY} stroke="#0ea5e9" strokeDasharray="5 6" strokeWidth="2" />
            <text x={width - 18} y={Math.max(12, targetY - 6)} textAnchor="end" className="fill-slate-500 text-[10px] font-black">
              目標 {targetWeight}kg
            </text>
          </>
        )}
        <polyline points={path} fill="none" stroke="#111827" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
        {points.map((point, index) => (
          <g key={point.id}>
            <circle cx={xFor(index)} cy={yFor(point.weight)} r="5" fill="#111827" />
            {(index === 0 || index === points.length - 1) && (
              <text x={xFor(index)} y={Math.min(height - 8, yFor(point.weight) + 20)} textAnchor={index === 0 ? "start" : "end"} className="fill-slate-500 text-[10px] font-black">
                {point.weight}kg
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
