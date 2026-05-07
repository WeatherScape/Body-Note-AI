import type { DailySummary } from "@/lib/types";
import { round } from "@/lib/utils";

type MacroBarProps = {
  summary: DailySummary;
};

export function MacroBar({ summary }: MacroBarProps) {
  const total = Math.max(summary.protein + summary.fat + summary.carbs, 1);
  const proteinWidth = (summary.protein / total) * 100;
  const fatWidth = (summary.fat / total) * 100;
  const carbsWidth = (summary.carbs / total) * 100;

  return (
    <div className="space-y-3">
      <div className="flex h-3 overflow-hidden rounded-full bg-gray-100">
        <span className="bg-mint" style={{ width: `${proteinWidth}%` }} />
        <span className="bg-coral" style={{ width: `${fatWidth}%` }} />
        <span className="bg-apple" style={{ width: `${carbsWidth}%` }} />
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs font-bold text-muted">
        <span>たんぱく {round(summary.protein)}g</span>
        <span>脂質 {round(summary.fat)}g</span>
        <span>炭水化物 {round(summary.carbs)}g</span>
      </div>
    </div>
  );
}
