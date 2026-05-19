export type BodyMode = "cut" | "maintain" | "bulk";
export type TwinBaseType = "natural" | "active" | "cool";
export type TwinHairStyle = "short" | "medium" | "soft-bob" | "wave" | "none";
export type TwinEyeType = "round" | "soft" | "calm" | "smile";
export type TwinColorTheme = "mint" | "blue" | "violet" | "peach" | "neutral";
export type TwinBodyStyle = "soft" | "clean" | "energetic";

export type BodyTwinAppearance = {
  baseType: TwinBaseType;
  skinTone: string;
  hairStyle: TwinHairStyle;
  hairColor: string;
  eyeType: TwinEyeType;
  outfitColor: string;
  coreColor: TwinColorTheme;
  bodyStyle: TwinBodyStyle;
  name: string;
};

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
  unlockedItems: string[];
  streakDays: number;
  calorieBalance: number;
  weekly: BodyTwinWeeklySummary;
};
