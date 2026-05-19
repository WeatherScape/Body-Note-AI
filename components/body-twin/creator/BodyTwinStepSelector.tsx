import { cn } from "@/lib/utils";

type BodyTwinStepSelectorProps = {
  step: number;
  onStepChange: (step: number) => void;
};

const steps = ["ベース", "見た目", "名前"];

export function BodyTwinStepSelector({ step, onStepChange }: BodyTwinStepSelectorProps) {
  return (
    <div className="grid grid-cols-3 gap-2 rounded-3xl bg-slate-100 p-1">
      {steps.map((label, index) => (
        <button
          key={label}
          onClick={() => onStepChange(index)}
          className={cn(
            "h-11 rounded-2xl text-xs font-black transition",
            step === index ? "bg-slate-950 text-white shadow-sm" : "text-slate-500"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
