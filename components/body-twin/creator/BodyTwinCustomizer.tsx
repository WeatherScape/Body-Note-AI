import type { BodyTwinAppearance, TwinBaseType, TwinBodyStyle, TwinColorTheme, TwinEyeType, TwinHairStyle } from "@/types/bodyTwin";
import { cn } from "@/lib/utils";

type BodyTwinCustomizerProps = {
  appearance: BodyTwinAppearance;
  onChange: (appearance: BodyTwinAppearance) => void;
  step: number;
};

const baseOptions: { value: TwinBaseType; label: string; description: string }[] = [
  { value: "natural", label: "まめバディ", description: "丸くてやさしい相棒" },
  { value: "active", label: "おさんぽバディ", description: "元気でしっぽが弾む相棒" },
  { value: "cool", label: "ミライバディ", description: "少し未来感のある相棒" }
];

const muzzleTones = ["#fff7ed", "#ffedd5", "#fde68a", "#e2e8f0", "#f5d0fe"];
const furColors = ["#f8fafc", "#d6a85f", "#8b5e3c", "#111827", "#94a3b8"];
const collarColors = ["#bfdbfe", "#bbf7d0", "#ddd6fe", "#fecdd3", "#e2e8f0"];
const coreOptions: { value: TwinColorTheme; color: string; label: string }[] = [
  { value: "mint", color: "#34d399", label: "Mint" },
  { value: "blue", color: "#60a5fa", label: "Blue" },
  { value: "violet", color: "#a78bfa", label: "Violet" },
  { value: "peach", color: "#fb7185", label: "Peach" },
  { value: "neutral", color: "#94a3b8", label: "Neutral" }
];
const hairStyles: { value: TwinHairStyle; label: string }[] = [
  { value: "short", label: "ピン耳" },
  { value: "medium", label: "たれ耳" },
  { value: "soft-bob", label: "まる耳" },
  { value: "wave", label: "ふわ耳" },
  { value: "none", label: "ちび耳" }
];
const eyeTypes: { value: TwinEyeType; label: string }[] = [
  { value: "round", label: "丸目" },
  { value: "soft", label: "やさしい" },
  { value: "calm", label: "落ち着き" },
  { value: "smile", label: "笑顔" }
];
const bodyStyles: { value: TwinBodyStyle; label: string }[] = [
  { value: "soft", label: "もふもふ" },
  { value: "clean", label: "すっきり" },
  { value: "energetic", label: "元気系" }
];

function OptionButton({ active, label, description, onClick }: { active: boolean; label: string; description?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("rounded-3xl border p-4 text-left transition active:scale-[0.98]", active ? "border-slate-950 bg-slate-950 text-white shadow-card" : "border-slate-200 bg-white text-slate-950 shadow-sm")}>
      <p className="font-black">{label}</p>
      {description && <p className={cn("mt-1 text-xs font-bold leading-5", active ? "text-white/65" : "text-slate-500")}>{description}</p>}
    </button>
  );
}

function ColorPicker({ label, colors, value, onChange }: { label: string; colors: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <p className="mb-2 text-xs font-black text-slate-500">{label}</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {colors.map((color) => (
          <button
            key={color}
            aria-label={`${label} ${color}`}
            onClick={() => onChange(color)}
            className={cn("h-10 w-10 shrink-0 rounded-full border-4 transition", value === color ? "border-slate-950" : "border-white shadow-sm")}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  );
}

export function BodyTwinCustomizer({ appearance, onChange, step }: BodyTwinCustomizerProps) {
  const update = <K extends keyof BodyTwinAppearance>(key: K, value: BodyTwinAppearance[K]) => onChange({ ...appearance, [key]: value });

  if (step === 0) {
    return (
      <div className="grid gap-3">
        {baseOptions.map((option) => (
          <OptionButton
            key={option.value}
            active={appearance.baseType === option.value}
            label={option.label}
            description={option.description}
            onClick={() => update("baseType", option.value)}
          />
        ))}
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="space-y-4">
        <ColorPicker label="口まわり" colors={muzzleTones} value={appearance.skinTone} onChange={(value) => update("skinTone", value)} />
        <ColorPicker label="毛色" colors={furColors} value={appearance.hairColor} onChange={(value) => update("hairColor", value)} />
        <ColorPicker label="首輪カラー" colors={collarColors} value={appearance.outfitColor} onChange={(value) => update("outfitColor", value)} />
        <div>
          <p className="mb-2 text-xs font-black text-slate-500">チャームカラー</p>
          <div className="grid grid-cols-5 gap-2">
            {coreOptions.map((option) => (
              <button key={option.value} onClick={() => update("coreColor", option.value)} className={cn("rounded-2xl p-2 text-[10px] font-black", appearance.coreColor === option.value ? "bg-slate-950 text-white" : "bg-white text-slate-500 shadow-sm")}>
                <span className="mx-auto mb-1 block h-6 w-6 rounded-full" style={{ backgroundColor: option.color }} />
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {hairStyles.map((option) => <OptionButton key={option.value} active={appearance.hairStyle === option.value} label={option.label} onClick={() => update("hairStyle", option.value)} />)}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {eyeTypes.map((option) => <OptionButton key={option.value} active={appearance.eyeType === option.value} label={option.label} onClick={() => update("eyeType", option.value)} />)}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {bodyStyles.map((option) => <OptionButton key={option.value} active={appearance.bodyStyle === option.value} label={option.label} onClick={() => update("bodyStyle", option.value)} />)}
        </div>
      </div>
    );
  }

  return null;
}
