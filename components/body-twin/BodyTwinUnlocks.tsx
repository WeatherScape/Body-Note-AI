import { Lock, Sparkles } from "lucide-react";
import type { BodyTwinState } from "@/types/bodyTwin";

type BodyTwinUnlocksProps = {
  state: BodyTwinState;
};

const rewards = [
  { days: 3, label: "Soft Light背景" },
  { days: 7, label: "ミントコア" },
  { days: 14, label: "新しい服カラー" },
  { days: 30, label: "限定リング" }
];

export function BodyTwinUnlocks({ state }: BodyTwinUnlocksProps) {
  return (
    <div className="rounded-3xl bg-white/72 p-4 shadow-sm backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-black text-slate-950">継続報酬</p>
        <p className="text-xs font-black text-slate-500">{state.streakDays}日継続</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {rewards.map((reward) => {
          const unlocked = state.streakDays >= reward.days;
          return (
            <div key={reward.label} className="flex items-center gap-2 rounded-2xl bg-slate-50 p-3">
              {unlocked ? <Sparkles className="h-4 w-4 text-amber-500" /> : <Lock className="h-4 w-4 text-slate-300" />}
              <div>
                <p className="text-xs font-black text-slate-950">{reward.label}</p>
                <p className="text-[10px] font-bold text-slate-500">{reward.days}日で解放</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
