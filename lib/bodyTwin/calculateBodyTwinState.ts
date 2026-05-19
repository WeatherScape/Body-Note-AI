import type { BodyTwinAvatarVariant, BodyTwinState, BodyTwinStatus, DailyBodyLog } from "@/types/bodyTwin";
import { clamp, round } from "@/lib/utils";

function scoreCalorieBalance(log: DailyBodyLog) {
  const balance = log.intakeCalories - log.burnedCalories;

  if (log.intakeCalories <= 0) return 48;

  if (log.mode === "cut") {
    if (balance >= -600 && balance <= -200) return 92;
    if (balance < -800) return 54;
    if (balance >= -800 && balance < -600) return 74;
    if (balance > 200) return 46;
    return 68;
  }

  if (log.mode === "bulk") {
    if (balance >= 100 && balance <= 400) return 90;
    if (balance >= 700) return 52;
    if (balance > 400) return 70;
    if (balance < -200) return 50;
    return 66;
  }

  if (balance >= -200 && balance <= 200) return 90;
  if (Math.abs(balance) <= 400) return 70;
  return 52;
}

function scoreMuscle(log: DailyBodyLog) {
  const proteinRatio = log.proteinTarget > 0 ? log.protein / log.proteinTarget : 0;
  const proteinScore = clamp(Math.round(proteinRatio * 72), 0, 72);
  const workoutScore = log.workoutDone ? 28 : 8;
  return clamp(proteinScore + workoutScore, 0, 100);
}

function scoreRecovery(log: DailyBodyLog) {
  const sleepScore = log.sleepHours === undefined ? 32 : clamp(Math.round((log.sleepHours / 7) * 54), 16, 54);
  const waterScore = log.waterMl === undefined ? 24 : clamp(Math.round((log.waterMl / 2000) * 46), 12, 46);
  return clamp(sleepScore + waterScore, 0, 100);
}

function scoreConsistency(log: DailyBodyLog) {
  if (log.streakDays <= 0) return 42;
  return clamp(42 + log.streakDays * 8, 42, 100);
}

function statusFor(score: number): BodyTwinStatus {
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  if (score >= 40) return "normal";
  return "support";
}

function unlockedItemsFor(streakDays: number) {
  const unlocks = [
    { days: 3, label: "Soft Light背景" },
    { days: 7, label: "ミントコア" },
    { days: 14, label: "新しい服カラー" },
    { days: 30, label: "限定リング" },
    { days: 50, label: "特別バッジ" },
    { days: 100, label: "100日称号" }
  ];
  return unlocks.filter((item) => streakDays >= item.days).map((item) => item.label);
}

function pickVariant(log: DailyBodyLog, fatBurnScore: number, muscleScore: number, recoveryScore: number, consistencyScore: number): BodyTwinAvatarVariant {
  if (fatBurnScore < 50) return "support";
  if (muscleScore >= 82 && log.workoutDone) return "muscle";
  if (recoveryScore >= 82) return "recovery";
  if (fatBurnScore >= 82) return "burning";
  if (consistencyScore >= 82) return "balanced";
  return "balanced";
}

function labelAndMessage(
  log: DailyBodyLog,
  variant: BodyTwinAvatarVariant,
  fatBurnScore: number,
  muscleScore: number,
  recoveryScore: number,
  consistencyScore: number
) {
  const balance = log.intakeCalories - log.burnedCalories;

  if (variant === "muscle") {
    return {
      label: "筋トレ完了",
      message: log.protein >= log.proteinTarget * 0.9 ? "筋トレ完了。タンパク質も入って、回復までかなり良い。" : "筋トレ完了。次はタンパク質を少し足すともっと整う。"
    };
  }

  if (variant === "recovery") {
    return { label: "回復良好", message: "回復もいい感じ。明日のパフォーマンスにつながる。" };
  }

  if (variant === "burning") {
    return { label: "燃焼モード", message: "今日はいい赤字。無理なく燃やせてる。" };
  }

  if (variant === "support" || fatBurnScore < 50) {
    if (log.mode === "cut" && balance > 200) return { label: "調整デー", message: "少し多めの日。明日で整えれば問題なし。" };
    if (log.mode === "bulk" && balance >= 700) return { label: "補給デー", message: "今日は補給デー。次の記録でまた流れを作ろう。" };
    return { label: "整える日", message: "今日は土台づくりの日。次の一記録で流れを作れます。" };
  }

  if (consistencyScore >= 80) return { label: "継続中", message: "記録が続いてる。これが一番強い。" };
  if (muscleScore >= 72) return { label: "筋肉サポート", message: "タンパク質達成。筋肉の回復にいい感じ。" };
  if (recoveryScore >= 72) return { label: "コンディション良好", message: "体を整える習慣までできてる。" };
  return { label: "バランス良好", message: "今日の習慣が積み上がってる。ボディツインも成長中。" };
}

export function calculateBodyTwinState(logs: DailyBodyLog[]): BodyTwinState {
  const latest = logs[0];
  const recentLogs = logs.slice(0, 7);
  const fatBurnScore = scoreCalorieBalance(latest);
  const muscleScore = scoreMuscle(latest);
  const recoveryScore = scoreRecovery(latest);
  const consistencyScore = scoreConsistency(latest);
  const overallScore = Math.round(fatBurnScore * 0.3 + muscleScore * 0.28 + recoveryScore * 0.18 + consistencyScore * 0.24);
  const avatarVariant = pickVariant(latest, fatBurnScore, muscleScore, recoveryScore, consistencyScore);
  const copy = labelAndMessage(latest, avatarVariant, fatBurnScore, muscleScore, recoveryScore, consistencyScore);
  const weeklyScores = recentLogs.map((log) => Math.round((scoreCalorieBalance(log) + scoreMuscle(log) + scoreRecovery(log) + scoreConsistency(log)) / 4));
  const firstScore = weeklyScores.at(-1) ?? overallScore;
  const lastScore = weeklyScores[0] ?? overallScore;

  return {
    fatBurnScore,
    muscleScore,
    recoveryScore,
    consistencyScore,
    overallScore: clamp(overallScore, 0, 100),
    status: statusFor(overallScore),
    label: copy.label,
    message: copy.message,
    avatarVariant,
    level: Math.max(1, Math.floor(latest.streakDays / 3) + 1),
    unlockedItems: unlockedItemsFor(latest.streakDays),
    streakDays: latest.streakDays,
    calorieBalance: round(latest.intakeCalories - latest.burnedCalories),
    weekly: {
      averageCalorieBalance: recentLogs.length ? round(recentLogs.reduce((sum, log) => sum + (log.intakeCalories - log.burnedCalories), 0) / recentLogs.length) : 0,
      workoutCount: recentLogs.filter((log) => log.workoutDone).length,
      streakDays: latest.streakDays,
      conditionTrend: lastScore - firstScore >= 6 ? "up" : lastScore < 45 ? "support" : "steady"
    }
  };
}
