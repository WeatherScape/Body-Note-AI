import type { ActivityLevel, GoalType, ManagementStyle, Sex } from "@/lib/types";

export const activityLevelLabels: Record<ActivityLevel, string> = {
  sedentary: "少なめ",
  light: "週1〜2回",
  moderate: "週3〜4回",
  active: "週5回以上"
};

const activityMultipliers: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725
};

export function estimateMaintenanceCalories({
  sex,
  weight,
  height,
  age,
  activityLevel
}: {
  sex: Sex;
  weight: number;
  height: number;
  age: number;
  activityLevel: ActivityLevel;
}) {
  const base = 10 * weight + 6.25 * height - 5 * age + (sex === "male" ? 5 : -161);
  return Math.round(base * activityMultipliers[activityLevel]);
}

export function estimateTargetCalories({
  goal,
  style,
  maintenanceCalories
}: {
  goal: GoalType;
  style: ManagementStyle;
  maintenanceCalories: number;
}) {
  if (goal === "maintain") return Math.round(maintenanceCalories);

  const cutRate = style === "easy" ? 0.9 : style === "serious" ? 0.8 : 0.85;
  const bulkRate = style === "easy" ? 1.05 : style === "serious" ? 1.15 : 1.1;
  return Math.round(maintenanceCalories * (goal === "cut" ? cutRate : bulkRate));
}

export function estimateTargetProtein({
  goal,
  weight
}: {
  goal: GoalType;
  weight: number;
}) {
  const gramsPerKg = goal === "cut" ? 1.8 : goal === "bulk" ? 1.7 : 1.6;
  return Math.round(weight * gramsPerKg);
}

export function calculateNutritionTargets(input: {
  goal: GoalType;
  style: ManagementStyle;
  sex: Sex;
  weight: number;
  height: number;
  age: number;
  activityLevel: ActivityLevel;
}) {
  const maintenanceCalories = estimateMaintenanceCalories(input);
  return {
    maintenanceCalories,
    targetCalories: estimateTargetCalories({
      goal: input.goal,
      style: input.style,
      maintenanceCalories
    }),
    targetProtein: estimateTargetProtein({ goal: input.goal, weight: input.weight })
  };
}
