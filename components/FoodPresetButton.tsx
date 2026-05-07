import { Plus } from "lucide-react";
import type { FoodPreset } from "@/lib/types";

type FoodPresetButtonProps = {
  food: FoodPreset;
  onAdd: (food: FoodPreset) => void;
};

export function FoodPresetButton({ food, onAdd }: FoodPresetButtonProps) {
  return (
    <button
      onClick={() => onAdd(food)}
      className="flex min-h-24 flex-col justify-between rounded-3xl border border-line bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-card active:scale-[0.98]"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-sm font-bold leading-snug text-ink">{food.name}</span>
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink text-white">
          <Plus className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 text-xs font-semibold text-muted">
        {food.calories}kcal / P{food.protein}g
      </div>
    </button>
  );
}
