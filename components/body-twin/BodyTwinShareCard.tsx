import type { BodyTwinState } from "@/types/bodyTwin";
import { BodyTwinGauge } from "@/components/body-twin/BodyTwinGauge";
import { BodyTwinStatusBadge } from "@/components/body-twin/BodyTwinStatusBadge";

type BodyTwinShareCardProps = {
  state: BodyTwinState;
};

export function BodyTwinShareCard({ state }: BodyTwinShareCardProps) {
  return (
    <div className="rounded-[2rem] bg-slate-950 p-5 text-white shadow-card">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/50">BodyNote AI</p>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-2xl font-black tracking-normal">今日のBody Twin</h3>
          <p className="mt-2 text-sm font-bold leading-6 text-white/70">数字だけじゃない。今日の習慣が、あなたの分身を変えていく。</p>
        </div>
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-white text-2xl font-black text-slate-950">{state.overallScore}</div>
      </div>
      <div className="mt-4">
        <BodyTwinStatusBadge status={state.status} label={state.label} level={state.level} streakDays={state.streakDays} />
      </div>
      <p className="mt-4 rounded-3xl bg-white p-4 text-sm font-black leading-6 text-slate-950">{state.message}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <BodyTwinGauge label="Fat Burn" value={state.fatBurnScore} tone="burn" />
        <BodyTwinGauge label="Muscle" value={state.muscleScore} tone="muscle" />
        <BodyTwinGauge label="Recovery" value={state.recoveryScore} tone="recovery" />
        <BodyTwinGauge label="Consistency" value={state.consistencyScore} tone="consistency" />
      </div>
    </div>
  );
}
