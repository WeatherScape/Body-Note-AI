import type { BodyTwinStatus } from "@/types/bodyTwin";
import { cn } from "@/lib/utils";

type BodyTwinStatusBadgeProps = {
  status: BodyTwinStatus;
  label: string;
  level: number;
  streakDays: number;
};

const statusStyle = {
  excellent: "bg-emerald-50 text-emerald-700 border-emerald-100",
  good: "bg-blue-50 text-blue-700 border-blue-100",
  normal: "bg-slate-50 text-slate-700 border-slate-200",
  support: "bg-cyan-50 text-cyan-700 border-cyan-100"
};

export function BodyTwinStatusBadge({ status, label, level, streakDays }: BodyTwinStatusBadgeProps) {
  return (
    <div className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-black", statusStyle[status])}>
      <span>{label}</span>
      <span className="h-1 w-1 rounded-full bg-current opacity-40" />
      <span>Lv.{level}</span>
      <span className="h-1 w-1 rounded-full bg-current opacity-40" />
      <span>{streakDays}日継続</span>
    </div>
  );
}
