import { cn } from "@/lib/utils";

type ScoreRingProps = {
  score: number;
  label: string;
  className?: string;
};

export function ScoreRing({ score, label, className }: ScoreRingProps) {
  const angle = Math.max(0, Math.min(100, score)) * 3.6;

  return (
    <div
      className={cn("relative grid aspect-square w-40 place-items-center rounded-full", className)}
      style={{
        background: `conic-gradient(#111827 ${angle}deg, #E5E7EB ${angle}deg 360deg)`
      }}
    >
      <div className="grid h-[82%] w-[82%] place-items-center rounded-full bg-white text-center shadow-inner">
        <div>
          <div className="text-5xl font-black leading-none tracking-normal text-ink">{score}</div>
          <div className="mt-1 text-xs font-bold text-muted">{label}</div>
        </div>
      </div>
    </div>
  );
}
