import type { CoachAdvice, DailySummary, UserProfile } from "@/lib/types";
import { formatSigned } from "@/lib/utils";

export function generateCoachAdvice(profile: UserProfile, summary: DailySummary): CoachAdvice {
  const goodPoints: string[] = [];
  const improvements: string[] = [];
  const todos: string[] = [];
  const calorieGap = summary.calories - profile.targetCalories;
  const proteinRatio = profile.targetProtein ? summary.protein / profile.targetProtein : 0;

  if (summary.mealCount >= 2) goodPoints.push("食事を2回以上記録できています。まず継続の土台はかなり良いです。");
  if (Math.abs(calorieGap) <= 150) goodPoints.push("カロリーは目標にかなり近いです。今日は調整が上手です。");
  if (proteinRatio >= 0.9) goodPoints.push("タンパク質は目標の90%以上。筋肉を残す準備ができています。");
  if (summary.trainedToday) goodPoints.push("筋トレ記録があります。食事と運動をセットで見られているのが良いです。");
  if (summary.bodyWeight) goodPoints.push("体重も記録済み。7日平均で冷静に見ていけます。");

  if (summary.mealCount < 2) improvements.push("食事記録が少なめです。完璧でなくていいので、まず2食だけ残せると判断しやすくなります。");
  if (calorieGap < -300) improvements.push("カロリーが低めです。減らしすぎると筋トレの質が落ちやすいので注意しましょう。");
  if (calorieGap > 300) improvements.push("カロリーは少し高めです。明日は主食か脂質を一つだけ軽くすると整いやすいです。");
  if (proteinRatio < 0.7) improvements.push("タンパク質が不足気味です。鶏むね肉、卵、魚、プロテインのどれかを足すのがおすすめです。");
  if (summary.trainedToday && proteinRatio < 0.9) improvements.push("筋トレ日はタンパク質を優先すると、今日のトレーニングがより活きます。");
  if (!summary.bodyWeight) improvements.push("体重は1日1回だけでOKです。数字に振り回されず、平均で見ましょう。");

  if (proteinRatio < 0.9) todos.push("タンパク質をあと一品足す");
  if (calorieGap < -300) todos.push("明日は+100〜150kcalを許可する");
  if (calorieGap > 300) todos.push("脂質か主食を一つだけ軽くする");
  if (!summary.trainedToday) todos.push("10分だけでも体を動かす");
  if (!summary.bodyWeight) todos.push("朝か寝る前に体重を1回記録する");
  if (summary.mealCount < 2) todos.push("今日の食事をもう1つだけ追加する");
  if (todos.length < 3) todos.push("水分を多めにとって睡眠を確保する");
  if (todos.length < 3) todos.push("明日の最初の食事だけ先に決める");

  const scoreLabel =
    summary.score >= 85 ? "かなり良い流れ" : summary.score >= 70 ? "いい感じ" : summary.score >= 55 ? "ここから整う" : "記録できれば勝ち";

  const todayReview =
    summary.score >= 80
      ? "今日は体づくりに必要な材料がかなりそろっています。大きく変えず、この流れを続けましょう。"
      : summary.score >= 65
        ? "今日は十分に前進しています。足りないところを一つだけ足せば、かなり良い日になります。"
        : "今日はまだ情報が少なめです。でも、記録を少し足すだけで次の行動が見えます。焦らなくて大丈夫です。";

  const tomorrowMealAdvice =
    proteinRatio < 0.9
      ? "明日は最初の食事かトレ後に、プロテイン・卵・鶏むね肉のどれかを入れると整いやすいです。"
      : calorieGap > 300
        ? "明日は脂質の多いおかずを一つだけ控えめにして、タンパク質はそのままキープしましょう。"
        : "明日も今日と同じくらいのカロリー感でOKです。主食を抜きすぎず、タンパク質を毎食少しずつ入れましょう。";

  const tomorrowWorkoutAdvice = summary.trainedToday
    ? `今日は${summary.workoutSets}セット記録できています。明日は疲労が強ければ軽め、余裕があれば腹筋か有酸素を短く足すくらいで十分です。`
    : "明日は大きな筋トレでなくてもOKです。腹筋・スクワット・腕立てのどれかを10分だけ入れると流れが作れます。";

  const encouragement = summary.sevenDayAverageWeight
    ? `体重は1日単位より7日平均が大事です。今の7日平均は${summary.sevenDayAverageWeight}kg。落ち着いて積み上げましょう。`
    : `目標との差分は${formatSigned((summary.bodyWeight ?? profile.currentWeight) - profile.targetWeight, "kg")}です。まずは毎日1分、記録を続けるだけで十分です。`;

  return {
    scoreLabel,
    todayReview,
    goodPoints: goodPoints.length ? goodPoints : ["アプリを開いて確認できた時点で、今日の体づくりは一歩進んでいます。"],
    improvements: improvements.length ? improvements : ["大きな修正は不要です。明日も同じ流れで、少しだけ丁寧に続けましょう。"],
    tomorrowMealAdvice,
    tomorrowWorkoutAdvice,
    encouragement,
    todos: todos.slice(0, 3)
  };
}
