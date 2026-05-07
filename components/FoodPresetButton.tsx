import { Pencil, Plus, Trash2 } from "lucide-react";
import type { FoodPreset } from "@/lib/types";
import { cn } from "@/lib/utils";

type FoodPresetButtonProps = {
  food: FoodPreset;
  onAdd: (food: FoodPreset) => void;
  onEdit?: (food: FoodPreset) => void;
  onDelete?: (id: string) => void;
  badge?: string;
  accent?: boolean;
};

export function FoodPresetButton({ food, onAdd, onEdit, onDelete, badge, accent = false }: FoodPresetButtonProps) {
  return (
    <div
      className={cn(
        "relative min-h-28 rounded-3xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-card",
        accent ? "border-emerald-100 ring-4 ring-emerald-50" : "border-line"
      )}
    >
      <button onClick={() => onAdd(food)} className="flex h-full min-h-20 w-full flex-col justify-between pr-10 text-left active:scale-[0.99]">
        <span className="text-sm font-black leading-snug text-ink">{food.name}</span>
        <span className="mt-3 text-xs font-semibold text-muted">
          {food.calories}kcal / P{food.protein}g
        </span>
        {badge && <span className="mt-2 text-xs font-black text-emerald-700">{badge}</span>}
      </button>
      <button
        aria-label={`${food.name}を追加`}
        onClick={() => onAdd(food)}
        className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-ink text-white transition active:scale-95"
      >
        <Plus className="h-5 w-5" />
      </button>
      {(onEdit || onDelete) && (
        <div className="absolute bottom-3 right-3 flex gap-1">
          {onEdit && (
            <button
              aria-label={`${food.name}を編集`}
              onClick={() => onEdit(food)}
              className="grid h-8 w-8 place-items-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-blue-50 hover:text-apple"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              aria-label={`${food.name}を削除`}
              onClick={() => onDelete(food.id)}
              className="grid h-8 w-8 place-items-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
