import { Share2 } from "lucide-react";
import type { BodyTwinAppearance, BodyTwinState } from "@/types/bodyTwin";
import { BodyTwinAvatar } from "@/components/body-twin/BodyTwinAvatar";
import { BodyTwinGauge } from "@/components/body-twin/BodyTwinGauge";
import { BodyTwinShareCard } from "@/components/body-twin/BodyTwinShareCard";
import { BodyTwinStatusBadge } from "@/components/body-twin/BodyTwinStatusBadge";
import { BodyTwinUnlocks } from "@/components/body-twin/BodyTwinUnlocks";
import { BodyTwinWeeklySummary } from "@/components/body-twin/BodyTwinWeeklySummary";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type BodyTwinCardProps = {
  state: BodyTwinState;
  appearance: BodyTwinAppearance;
  onEdit?: () => void;
  onShare?: () => void;
};

export function BodyTwinCard({ state, appearance, onEdit, onShare }: BodyTwinCardProps) {
  return (
    <Card className="overflow-hidden border-slate-200 bg-gradient-to-br from-white via-slate-50 to-blue-50">
      <CardContent className="space-y-5 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-600">Body Buddy</p>
            <h2 className="text-3xl font-black tracking-normal text-slate-950">今日の相棒</h2>
            <p className="text-sm font-semibold leading-6 text-slate-500">今日の習慣で、相棒がごきげんに育っていく。</p>
          </div>
          <button onClick={onEdit} className="shrink-0 rounded-full bg-white px-3 py-2 text-xs font-black text-slate-600 shadow-sm">
            編集
          </button>
        </div>

        <BodyTwinAvatar
          appearance={appearance}
          variant={state.avatarVariant}
          status={state.status}
          level={state.level}
          fatBurnScore={state.fatBurnScore}
          muscleScore={state.muscleScore}
          recoveryScore={state.recoveryScore}
          consistencyScore={state.consistencyScore}
        />

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <BodyTwinStatusBadge status={state.status} label={state.label} level={state.level} streakDays={state.streakDays} />
            <div className="grid h-16 w-16 place-items-center rounded-full bg-slate-950 text-white shadow-card">
              <span className="text-2xl font-black">{state.overallScore}</span>
            </div>
          </div>
          <p className="rounded-3xl bg-white p-4 text-sm font-black leading-6 text-slate-950 shadow-sm">{state.message}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <BodyTwinGauge label="Fat Burn" value={state.fatBurnScore} tone="burn" />
          <BodyTwinGauge label="Muscle" value={state.muscleScore} tone="muscle" />
          <BodyTwinGauge label="Recovery" value={state.recoveryScore} tone="recovery" />
          <BodyTwinGauge label="Consistency" value={state.consistencyScore} tone="consistency" />
        </div>

        <BodyTwinWeeklySummary weekly={state.weekly} />
        <BodyTwinUnlocks state={state} />

        <BodyTwinShareCard state={state} appearance={appearance} />
        <Button className="w-full" onClick={onShare}>
          <Share2 className="h-4 w-4" />
          今日の相棒をシェア
        </Button>
      </CardContent>
    </Card>
  );
}
