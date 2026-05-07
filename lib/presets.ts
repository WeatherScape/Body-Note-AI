import type { FoodPreset, MealTemplate, MealTiming } from "@/lib/types";

export const mealTimingLabels: Record<MealTiming, string> = {
  breakfast: "朝",
  lunch: "昼",
  dinner: "夜",
  snack: "間食",
  postWorkout: "トレ後"
};

export const foodPresets: FoodPreset[] = [
  { id: "chicken-breast-100", name: "鶏むね肉 100g", calories: 108, protein: 22, fat: 1.5, carbs: 0 },
  { id: "rice-150", name: "白米 150g", calories: 234, protein: 3.8, fat: 0.5, carbs: 55 },
  { id: "rice-200", name: "白米 200g", calories: 312, protein: 5, fat: 0.7, carbs: 74 },
  { id: "egg-1", name: "卵 1個", calories: 76, protein: 6.2, fat: 5.2, carbs: 0.2 },
  { id: "protein-1", name: "プロテイン 1杯", calories: 120, protein: 22, fat: 1.5, carbs: 4 },
  { id: "oikos-1", name: "オイコス 1個", calories: 92, protein: 10, fat: 0, carbs: 12 },
  { id: "banana-1", name: "バナナ 1本", calories: 86, protein: 1.1, fat: 0.2, carbs: 22.5 },
  { id: "salmon-100", name: "鮭 100g", calories: 139, protein: 22.3, fat: 4.1, carbs: 0.1 },
  { id: "soba-1", name: "そば 1人前", calories: 296, protein: 12, fat: 2, carbs: 57 },
  { id: "sasami-100", name: "ささみ 100g", calories: 98, protein: 23, fat: 0.8, carbs: 0 }
];

export const workoutPresets = [
  "ベンチプレス",
  "スクワット",
  "デッドリフト",
  "レッグプレス",
  "ペックフライ",
  "ラットプルダウン",
  "ローイング",
  "ショルダープレス",
  "アームカール",
  "腹筋",
  "有酸素"
];

export const initialMealTemplates: MealTemplate[] = [
  {
    id: "morning-set",
    name: "朝セット",
    items: [
      foodPresets.find((item) => item.id === "protein-1")!,
      foodPresets.find((item) => item.id === "banana-1")!,
      foodPresets.find((item) => item.id === "egg-1")!
    ],
    createdAt: new Date(0).toISOString()
  },
  {
    id: "cut-dinner-set",
    name: "減量夜セット",
    items: [
      foodPresets.find((item) => item.id === "chicken-breast-100")!,
      foodPresets.find((item) => item.id === "rice-150")!
    ],
    createdAt: new Date(0).toISOString()
  },
  {
    id: "post-workout-set",
    name: "筋トレ後セット",
    items: [
      foodPresets.find((item) => item.id === "protein-1")!,
      foodPresets.find((item) => item.id === "rice-150")!
    ],
    createdAt: new Date(0).toISOString()
  }
];
