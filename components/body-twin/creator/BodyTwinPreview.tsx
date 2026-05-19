import type { BodyTwinAppearance } from "@/types/bodyTwin";
import { BodyTwinAvatar } from "@/components/body-twin/BodyTwinAvatar";

type BodyTwinPreviewProps = {
  appearance: BodyTwinAppearance;
};

export function BodyTwinPreview({ appearance }: BodyTwinPreviewProps) {
  return (
    <div className="rounded-[2rem] bg-gradient-to-br from-white via-blue-50 to-emerald-50 p-4 shadow-card">
      <BodyTwinAvatar
        appearance={appearance}
        variant="balanced"
        status="good"
        level={1}
        fatBurnScore={66}
        muscleScore={62}
        recoveryScore={70}
        consistencyScore={58}
      />
      <div className="mt-3 text-center">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">Your Body Buddy</p>
        <h2 className="mt-1 text-2xl font-black tracking-normal text-slate-950">{appearance.name || "My Twin"}</h2>
      </div>
    </div>
  );
}
