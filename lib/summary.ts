import type { BodyLog, DailySummary, MealEntry, UserProfile, WorkoutEntry } from "@/lib/types";
import { clamp, round, todayKey } from "@/lib/utils";

export function calculateBodyMakeScore(
  profile: UserProfile,
  meals: MealEntry[],
  workouts: WorkoutEntry[],
  bodyLog?: BodyLog
) {
  const calories = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const protein = meals.reduce((sum, meal) => sum + meal.protein, 0);
  const mealTimings = new Set(meals.map((meal) => meal.timing));
  const trainedToday = workouts.length > 0;
  const calorieDiffAbs = Math.abs(calories - profile.targetCalories);
  const proteinRatio = profile.targetProtein > 0 ? protein / profile.targetProtein : 0;

  let score = 58;

  if (meals.length > 0) score += 8;
  if (mealTimings.size >= 2) score += 10;
  if (calorieDiffAbs <= 150) score += 14;
  else if (calorieDiffAbs <= 300) score += 8;
  else if (calories < profile.targetCalories * 0.65 || calories > profile.targetCalories * 1.25) score -= 8;

  if (proteinRatio >= 0.9) score += 14;
  else if (proteinRatio >= 0.7) score += 8;
  else if (proteinRatio < 0.45 && meals.length > 0) score -= 8;

  if (trainedToday) score += 8;
  if (bodyLog) score += 6;
  if (trainedToday && proteinRatio < 0.7) score -= 8;

  return clamp(Math.round(score), 0, 100);
}

export function getSevenDayAverageWeight(bodyLogs: BodyLog[], date = todayKey()) {
  const sorted = bodyLogs
    .filter((log) => log.date <= date)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 7);

  if (sorted.length === 0) return undefined;
  const total = sorted.reduce((sum, log) => sum + log.weight, 0);
  return round(total / sorted.length, 1);
}

export function buildDailySummary(
  profile: UserProfile,
  mealEntries: MealEntry[],
  workoutEntries: WorkoutEntry[],
  bodyLogs: BodyLog[],
  date = todayKey()
): DailySummary {
  const meals = mealEntries.filter((meal) => meal.date === date);
  const workouts = workoutEntries.filter((workout) => workout.date === date);
  const bodyLog = bodyLogs
    .filter((log) => log.date === date)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const calories = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const protein = meals.reduce((sum, meal) => sum + meal.protein, 0);
  const fat = meals.reduce((sum, meal) => sum + meal.fat, 0);
  const carbs = meals.reduce((sum, meal) => sum + meal.carbs, 0);
  const workoutSets = workouts.reduce((sum, workout) => sum + workout.sets, 0);

  return {
    date,
    calories: round(calories),
    protein: round(protein, 1),
    fat: round(fat, 1),
    carbs: round(carbs, 1),
    mealCount: new Set(meals.map((meal) => meal.timing)).size,
    workoutSets,
    trainedToday: workouts.length > 0,
    bodyWeight: bodyLog?.weight,
    bodyFat: bodyLog?.bodyFat,
    score: calculateBodyMakeScore(profile, meals, workouts, bodyLog),
    calorieDiff: round(calories - profile.targetCalories),
    proteinDiff: round(protein - profile.targetProtein, 1),
    sevenDayAverageWeight: getSevenDayAverageWeight(bodyLogs, date)
  };
}
