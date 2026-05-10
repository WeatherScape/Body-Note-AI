import { cn } from "@/lib/utils";

type BodyTwinGaugeProps = {
  label: string;
  value: number;
  tone: "burn" | "muscle" | "recovery" | "consistency";
};

const toneClass = {
  burn: "from-amber-300 to-orange-500",
  muscle: "from-indigo-300 to-blue-500",
  recovery: "from-emerald-300 to-cyan-500",
  consistency: "from-sky-300 to-violet-500"
};

export function BodyTwinGauge({ label, value, tone }: BodyTwinGaugeProps) {
  return (
    <div className="space-y-2 rounded-3xl bg-white/72 p-3 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-black text-slate-500">{label}</p>
        <p className="text-sm font-black text-slate-950">{value}</p>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
        <div className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700", toneClass[tone])} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
