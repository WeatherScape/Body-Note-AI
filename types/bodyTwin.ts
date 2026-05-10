export type BodyMode = "cut" | "maintain" | "bulk";

export type DailyBodyLog = {
  date: string;
  intakeCalories: number;
  burnedCalories: number;
  targetCalories: number;
  protein: number;
  proteinTarget: number;
  workoutDone: boolean;
  sleepHours?: number;
  waterMl?: number;
  weight?: number;
  bodyFat?: number;
  streakDays: number;
  mode: BodyMode;
};

export type BodyTwinStatus = "excellent" | "good" | "normal" | "support";
export type BodyTwinAvatarVariant = "burning" | "muscle" | "recovery" | "balanced" | "support";

export type BodyTwinWeeklySummary = {
  averageCalorieBalance: number;
  workoutCount: number;
  streakDays: number;
  conditionTrend: "up" | "steady" | "support";
};

export type BodyTwinState = {
  fatBurnScore: number;
  muscleScore: number;
  recoveryScore: number;
  consistencyScore: number;
  overallScore: number;
  status: BodyTwinStatus;
  label: string;
  message: string;
  avatarVariant: BodyTwinAvatarVariant;
  level: number;
  streakDays: number;
  calorieBalance: number;
  weekly: BodyTwinWeeklySummary;
};
