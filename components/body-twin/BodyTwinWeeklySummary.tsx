import type { BodyTwinWeeklySummary as WeeklySummary } from "@/types/bodyTwin";
import { formatSigned } from "@/lib/utils";

type BodyTwinWeeklySummaryProps = {
  weekly: WeeklySummary;
};

function trendLabel(trend: WeeklySummary["conditionTrend"]) {
  if (trend === "up") return "上向き";
  if (trend === "support") return "整え中";
  return "安定";
}

export function BodyTwinWeeklySummary({ weekly }: BodyTwinWeeklySummaryProps) {
  const items = [
    { label: "7日平均収支", value: formatSigned(weekly.averageCalorieBalance, "kcal") },
    { label: "筋トレ", value: `${weekly.workoutCount}回` },
    { label: "継続", value: `${weekly.streakDays}日` },
    { label: "傾向", value: trendLabel(weekly.conditionTrend) }
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item) => (
        <div key={item.label} className="rounded-3xl bg-white/72 p-3 shadow-sm backdrop-blur">
          <p className="text-[11px] font-black text-slate-500">{item.label}</p>
          <p className="mt-1 text-base font-black text-slate-950">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
