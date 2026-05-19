import type { BodyTwinAppearance } from "@/types/bodyTwin";
import { Input } from "@/components/ui/input";

type BodyTwinNameInputProps = {
  appearance: BodyTwinAppearance;
  onChange: (appearance: BodyTwinAppearance) => void;
};

export function BodyTwinNameInput({ appearance, onChange }: BodyTwinNameInputProps) {
  return (
    <div className="space-y-3 rounded-3xl bg-white p-4 shadow-sm">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">Name</p>
        <h2 className="mt-1 text-xl font-black tracking-normal text-slate-950">相棒に名前をつける</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">スキップしてもOK。あとから「Buddy」として一緒に育てられます。</p>
      </div>
      <Input
        placeholder="例: Buddy"
        value={appearance.name}
        onChange={(event) => onChange({ ...appearance, name: event.target.value })}
      />
    </div>
  );
}
