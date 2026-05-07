export type GoalType = "cut" | "maintain" | "bulk";
export type ManagementStyle = "easy" | "normal" | "serious";
export type MealTiming = "breakfast" | "lunch" | "dinner" | "snack" | "postWorkout";
export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active";

export type UserProfile = {
  goal: GoalType;
  currentWeight: number;
  targetWeight: number;
  height: number;
  age: number;
  sex: Sex;
  activityLevel: ActivityLevel;
  estimatedMaintenanceCalories: number;
  targetCalories: number;
  targetProtein: number;
  weeklyWorkoutGoal: number;
  style: ManagementStyle;
  createdAt: string;
};

export type Macro = {
  protein: number;
  fat: number;
  carbs: number;
};

export type MealEntry = {
  id: string;
  date: string;
  timing: MealTiming;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  note?: string;
  createdAt: string;
};

export type WorkoutEntry = {
  id: string;
  date: string;
  exercise: string;
  weight: number;
  reps: number;
  sets: number;
  note?: string;
  createdAt: string;
};

export type BodyLog = {
  id: string;
  date: string;
  weight: number;
  bodyFat?: number;
  note?: string;
  createdAt: string;
};

export type FoodPreset = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

export type MealTemplate = {
  id: string;
  name: string;
  items: FoodPreset[];
  createdAt: string;
};

export type CoachAdvice = {
  scoreLabel: string;
  todayReview: string;
  goodPoints: string[];
  improvements: string[];
  tomorrowMealAdvice: string;
  tomorrowWorkoutAdvice: string;
  encouragement: string;
  todos: string[];
};

export type DailySummary = {
  date: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  mealCount: number;
  workoutSets: number;
  trainedToday: boolean;
  bodyWeight?: number;
  bodyFat?: number;
  score: number;
  calorieDiff: number;
  proteinDiff: number;
  sevenDayAverageWeight?: number;
};
