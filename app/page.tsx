"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Apple,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Dumbbell,
  Flame,
  HeartPulse,
  Plus,
  Scale,
  Sparkles,
  Trash2,
  Utensils
} from "lucide-react";
import { AppShell, type TabKey } from "@/components/AppShell";
import { CoachCard } from "@/components/CoachCard";
import { FoodPresetButton } from "@/components/FoodPresetButton";
import { MacroBar } from "@/components/MacroBar";
import { ProgressChart } from "@/components/ProgressChart";
import { ScoreRing } from "@/components/ScoreRing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { generateCoachAdvice } from "@/lib/coach";
import { activityLevelLabels, calculateNutritionTargets } from "@/lib/nutrition";
import { foodPresets, initialMealTemplates, mealTimingLabels, workoutPresets } from "@/lib/presets";
import { buildDailySummary } from "@/lib/summary";
import {
  loadAppData,
  saveBodyLogs,
  saveCustomFoodPresets,
  saveCustomWorkoutPresets,
  saveMealEntries,
  saveMealTemplates,
  saveProfile,
  saveWorkoutEntries
} from "@/lib/storage";
import type { BodyLog, FoodPreset, GoalType, MealEntry, MealTemplate, MealTiming, UserProfile, WorkoutEntry } from "@/lib/types";
import { cn, createId, formatSigned, round, todayKey } from "@/lib/utils";

const defaultProfile: UserProfile = {
  goal: "cut",
  currentWeight: 68,
  targetWeight: 62,
  height: 170,
  age: 22,
  sex: "male",
  activityLevel: "moderate",
  estimatedMaintenanceCalories: 2300,
  targetCalories: 1900,
  targetProtein: 120,
  weeklyWorkoutGoal: 3,
  style: "normal",
  createdAt: new Date().toISOString()
};

const mealTimingOptions = Object.entries(mealTimingLabels) as [MealTiming, string][];

export default function Home() {
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("dashboard");
  const [profile, setProfile] = useState<UserProfile | undefined>();
  const [mealEntries, setMealEntries] = useState<MealEntry[]>([]);
  const [workoutEntries, setWorkoutEntries] = useState<WorkoutEntry[]>([]);
  const [bodyLogs, setBodyLogs] = useState<BodyLog[]>([]);
  const [mealTemplates, setMealTemplates] = useState<MealTemplate[]>(initialMealTemplates);
  const [customFoodPresets, setCustomFoodPresets] = useState<FoodPreset[]>([]);
  const [customWorkoutPresets, setCustomWorkoutPresets] = useState<string[]>([]);
  const date = todayKey();

  useEffect(() => {
    const data = loadAppData();
    setProfile(data.profile);
    setMealEntries(data.mealEntries);
    setWorkoutEntries(data.workoutEntries);
    setBodyLogs(data.bodyLogs);
    setMealTemplates(data.mealTemplates.length ? data.mealTemplates : initialMealTemplates);
    setCustomFoodPresets(data.customFoodPresets);
    setCustomWorkoutPresets(data.customWorkoutPresets);
    setLoaded(true);
  }, []);

  const todayMeals = useMemo(() => mealEntries.filter((meal) => meal.date === date), [mealEntries, date]);
  const todayWorkouts = useMemo(() => workoutEntries.filter((workout) => workout.date === date), [workoutEntries, date]);

  const summary = useMemo(
    () => (profile ? buildDailySummary(profile, mealEntries, workoutEntries, bodyLogs, date) : undefined),
    [profile, mealEntries, workoutEntries, bodyLogs, date]
  );

  const advice = useMemo(() => (profile && summary ? generateCoachAdvice(profile, summary) : undefined), [profile, summary]);

  const addMeal = (food: FoodPreset, timing: MealTiming, note?: string) => {
    const next: MealEntry[] = [
      ...mealEntries,
      {
        id: createId("meal"),
        date,
        timing,
        name: food.name,
        calories: food.calories,
        protein: food.protein,
        fat: food.fat,
        carbs: food.carbs,
        note,
        createdAt: new Date().toISOString()
      }
    ];
    setMealEntries(next);
    saveMealEntries(next);
  };

  const addTemplate = (template: MealTemplate, timing: MealTiming) => {
    const now = new Date().toISOString();
    const entries = template.items.map<MealEntry>((item) => ({
      id: createId("meal"),
      date,
      timing,
      name: item.name,
      calories: item.calories,
      protein: item.protein,
      fat: item.fat,
      carbs: item.carbs,
      note: template.name,
      createdAt: now
    }));
    const next = [...mealEntries, ...entries];
    setMealEntries(next);
    saveMealEntries(next);
  };

  const deleteMeal = (id: string) => {
    const next = mealEntries.filter((meal) => meal.id !== id);
    setMealEntries(next);
    saveMealEntries(next);
  };

  const saveCustomFoodPreset = (food: Omit<FoodPreset, "id"> & { id?: string }) => {
    const name = food.name.trim();
    if (!name) return;
    const nextFood: FoodPreset = { ...food, id: food.id ?? createId("my-food"), name };
    const next = [
      nextFood,
      ...customFoodPresets.filter((item) => item.id !== nextFood.id && item.name.trim() !== name)
    ].slice(0, 24);
    setCustomFoodPresets(next);
    saveCustomFoodPresets(next);
  };

  const deleteCustomFoodPreset = (id: string) => {
    const next = customFoodPresets.filter((food) => food.id !== id);
    setCustomFoodPresets(next);
    saveCustomFoodPresets(next);
  };

  const addWorkout = (entry: Omit<WorkoutEntry, "id" | "date" | "createdAt">) => {
    const next = [...workoutEntries, { ...entry, id: createId("workout"), date, createdAt: new Date().toISOString() }];
    setWorkoutEntries(next);
    saveWorkoutEntries(next);
  };

  const saveCustomWorkoutPreset = (exercise: string) => {
    const name = exercise.trim();
    if (!name) return;
    const next = [name, ...customWorkoutPresets.filter((item) => item !== name)].slice(0, 30);
    setCustomWorkoutPresets(next);
    saveCustomWorkoutPresets(next);
  };

  const deleteCustomWorkoutPreset = (exercise: string) => {
    const next = customWorkoutPresets.filter((item) => item !== exercise);
    setCustomWorkoutPresets(next);
    saveCustomWorkoutPresets(next);
  };

  const deleteWorkout = (id: string) => {
    const next = workoutEntries.filter((workout) => workout.id !== id);
    setWorkoutEntries(next);
    saveWorkoutEntries(next);
  };

  const addBodyLog = (entry: Omit<BodyLog, "id" | "date" | "createdAt">) => {
    const next = [...bodyLogs.filter((log) => log.date !== date), { ...entry, id: createId("body"), date, createdAt: new Date().toISOString() }];
    setBodyLogs(next);
    saveBodyLogs(next);
  };

  const saveTodayTemplate = (name: string) => {
    const items = todayMeals.map<FoodPreset>((meal) => ({
      id: meal.id,
      name: meal.name,
      calories: meal.calories,
      protein: meal.protein,
      fat: meal.fat,
      carbs: meal.carbs
    }));
    if (!name.trim() || items.length === 0) return;
    const next = [...mealTemplates, { id: createId("template"), name: name.trim(), items, createdAt: new Date().toISOString() }];
    setMealTemplates(next);
    saveMealTemplates(next);
  };

  if (!loaded) {
    return <div className="grid min-h-screen place-items-center text-sm font-bold text-muted">BodyNote AI を準備中...</div>;
  }

  if (!profile) {
    return (
      <Onboarding
        onComplete={(nextProfile) => {
          setProfile(nextProfile);
          saveProfile(nextProfile);
        }}
      />
    );
  }

  if (!summary || !advice) return null;

  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "dashboard" && (
        <DashboardScreen
          profile={profile}
          summary={summary}
          advice={advice}
          onQuick={() => setActiveTab("quick")}
          onCoach={() => setActiveTab("coach")}
        />
      )}
      {activeTab === "quick" && (
        <QuickRecordScreen
          profile={profile}
          selectedDate={date}
          templates={mealTemplates}
          customFoodPresets={customFoodPresets}
          customWorkoutPresets={customWorkoutPresets}
          onAddMeal={addMeal}
          onAddTemplate={addTemplate}
          onSaveCustomFood={saveCustomFoodPreset}
          onDeleteCustomFood={deleteCustomFoodPreset}
          onSaveCustomWorkout={saveCustomWorkoutPreset}
          onAddWorkout={addWorkout}
          onAddBodyLog={addBodyLog}
          workouts={workoutEntries}
        />
      )}
      {activeTab === "meals" && (
        <MealsScreen
          profile={profile}
          summary={summary}
          meals={todayMeals}
          templates={mealTemplates}
          onDeleteMeal={deleteMeal}
          onAddTemplate={addTemplate}
          onSaveTemplate={saveTodayTemplate}
        />
      )}
  {activeTab === "workouts" && (
        <WorkoutsScreen
          workouts={todayWorkouts}
          allWorkouts={workoutEntries}
          customWorkoutPresets={customWorkoutPresets}
          onAddWorkout={addWorkout}
          onDeleteWorkout={deleteWorkout}
          onSaveCustomWorkout={saveCustomWorkoutPreset}
          onDeleteCustomWorkout={deleteCustomWorkoutPreset}
        />
      )}
      {activeTab === "progress" && (
        <ProgressScreen
          profile={profile}
          mealEntries={mealEntries}
          workoutEntries={workoutEntries}
          bodyLogs={bodyLogs}
          onAddBodyLog={addBodyLog}
        />
      )}
      {activeTab === "coach" && <CoachScreen advice={advice} summary={summary} profile={profile} />}
    </AppShell>
  );
}

function Onboarding({ onComplete }: { onComplete: (profile: UserProfile) => void }) {
  const [form, setForm] = useState(defaultProfile);
  const [autoTargets, setAutoTargets] = useState(true);
  const calculatedTargets = useMemo(
    () =>
      calculateNutritionTargets({
        goal: form.goal,
        style: form.style,
        sex: form.sex,
        weight: form.currentWeight,
        height: form.height,
        age: form.age,
        activityLevel: form.activityLevel
      }),
    [form.goal, form.style, form.sex, form.currentWeight, form.height, form.age, form.activityLevel]
  );

  useEffect(() => {
    if (!autoTargets) return;
    setForm((current) => ({
      ...current,
      estimatedMaintenanceCalories: calculatedTargets.maintenanceCalories,
      targetCalories: calculatedTargets.targetCalories,
      targetProtein: calculatedTargets.targetProtein
    }));
  }, [autoTargets, calculatedTargets.maintenanceCalories, calculatedTargets.targetCalories, calculatedTargets.targetProtein]);

  const update = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-8">
      <div className="mb-8">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-ink text-white shadow-card">
          <Sparkles className="h-6 w-6" />
        </div>
        <p className="text-sm font-bold text-apple">毎日1分のボディメイクコーチ</p>
        <h1 className="mt-2 text-4xl font-black tracking-normal text-ink">BodyNote AI</h1>
        <p className="mt-3 leading-7 text-muted">細かすぎる管理は不要です。目標だけ決めて、今日の判断をアプリに任せましょう。</p>
        <p className="mt-3 rounded-3xl bg-white p-4 text-sm font-semibold leading-6 text-muted shadow-sm">
          記録データはこの端末のブラウザに保存されます。外部AI APIやサーバー送信は使っていません。
        </p>
      </div>

      <Card className="space-y-5 p-5">
        <Labeled label="目的">
          <div className="grid grid-cols-3 gap-2">
            {[
              ["cut", "減量"],
              ["maintain", "維持"],
              ["bulk", "増量"]
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => update("goal", value as GoalType)}
                className={cn(
                  "h-12 rounded-2xl text-sm font-bold transition",
                  form.goal === value ? "bg-ink text-white shadow-card" : "bg-gray-100 text-muted"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </Labeled>
        <div className="grid grid-cols-2 gap-3">
          <Labeled label="現在体重">
            <NumberInput value={form.currentWeight} unit="kg" onChange={(value) => update("currentWeight", value)} />
          </Labeled>
          <Labeled label="目標体重">
            <NumberInput value={form.targetWeight} unit="kg" onChange={(value) => update("targetWeight", value)} />
          </Labeled>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Labeled label="身長">
            <NumberInput value={form.height} unit="cm" onChange={(value) => update("height", value)} />
          </Labeled>
          <Labeled label="年齢">
            <NumberInput value={form.age} unit="歳" onChange={(value) => update("age", value)} />
          </Labeled>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Labeled label="性別">
            <Select value={form.sex} onChange={(event) => update("sex", event.target.value as UserProfile["sex"])}>
              <option value="male">男性</option>
              <option value="female">女性</option>
            </Select>
          </Labeled>
          <Labeled label="運動頻度">
            <Select value={form.activityLevel} onChange={(event) => update("activityLevel", event.target.value as UserProfile["activityLevel"])}>
              {Object.entries(activityLevelLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Labeled>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Labeled label="週の筋トレ">
            <NumberInput value={form.weeklyWorkoutGoal} unit="回" onChange={(value) => update("weeklyWorkoutGoal", value)} />
          </Labeled>
          <Labeled label="管理スタイル">
            <Select value={form.style} onChange={(event) => update("style", event.target.value as UserProfile["style"])}>
              <option value="easy">ゆるめ</option>
              <option value="normal">普通</option>
              <option value="serious">ガチ</option>
            </Select>
          </Labeled>
        </div>
        <div className="rounded-3xl bg-gray-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black text-muted">推定消費カロリー</p>
              <p className="mt-1 text-3xl font-black text-ink">{calculatedTargets.maintenanceCalories}kcal</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-muted shadow-sm">目安</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <DashboardMetric label="目標カロリー" value={`${form.targetCalories}kcal`} />
            <DashboardMetric label="目標タンパク質" value={`${form.targetProtein}g`} />
          </div>
          <p className="mt-3 text-xs font-semibold leading-5 text-muted">
            体重・身長・年齢・性別・運動頻度から計算した目安です。あとから調整できます。
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Labeled label="目標カロリー">
            <NumberInput
              value={form.targetCalories}
              unit="kcal"
              onChange={(value) => {
                setAutoTargets(false);
                update("targetCalories", value);
              }}
            />
          </Labeled>
          <Labeled label="目標タンパク質">
            <NumberInput
              value={form.targetProtein}
              unit="g"
              onChange={(value) => {
                setAutoTargets(false);
                update("targetProtein", value);
              }}
            />
          </Labeled>
        </div>
        {!autoTargets && (
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              setAutoTargets(true);
              setForm((current) => ({
                ...current,
                estimatedMaintenanceCalories: calculatedTargets.maintenanceCalories,
                targetCalories: calculatedTargets.targetCalories,
                targetProtein: calculatedTargets.targetProtein
              }));
            }}
          >
            自動計算に戻す
          </Button>
        )}
        <Button
          size="lg"
          className="w-full"
          onClick={() =>
            onComplete({
              ...form,
              estimatedMaintenanceCalories: calculatedTargets.maintenanceCalories,
              createdAt: new Date().toISOString()
            })
          }
        >
          はじめる
          <ChevronRight className="h-5 w-5" />
        </Button>
      </Card>
    </main>
  );
}

function DashboardScreen({
  profile,
  summary,
  advice,
  onQuick,
  onCoach
}: {
  profile: UserProfile;
  summary: NonNullable<ReturnType<typeof buildDailySummary>>;
  advice: NonNullable<ReturnType<typeof generateCoachAdvice>>;
  onQuick: () => void;
  onCoach: () => void;
}) {
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <CardContent className="space-y-5 p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-3">
              <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-muted">今日のスコア</span>
              <div>
                <h2 className="text-2xl font-black tracking-normal text-ink">{advice.scoreLabel}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{advice.todayReview}</p>
              </div>
            </div>
            <ScoreRing score={summary.score} label="Score" className="w-32 shrink-0" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <MiniStat icon={Flame} label="カロリー" value={`${summary.calories}`} sub={`/ ${profile.targetCalories}`} tone="blue" />
            <MiniStat icon={Apple} label="たんぱく" value={`${round(summary.protein)}`} sub={`/ ${profile.targetProtein}g`} tone="mint" />
            <MiniStat icon={Dumbbell} label="セット" value={`${summary.workoutSets}`} sub={summary.trainedToday ? "実施済み" : "未実施"} tone="ink" />
          </div>
        </CardContent>
      </Card>

      <ShareResultCard profile={profile} summary={summary} advice={advice} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-mint" />
            今日やること
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {advice.todos.map((todo) => (
            <div key={todo} className="flex items-center gap-3 rounded-2xl bg-gray-50 p-3 text-sm font-bold text-ink">
              <span className="h-2 w-2 rounded-full bg-mint" />
              {todo}
            </div>
          ))}
        </CardContent>
      </Card>

      <CoachCard advice={advice} />

      <Card>
        <CardHeader>
          <CardTitle>栄養バランス</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <MacroBar summary={summary} />
          <div className="grid grid-cols-2 gap-3">
            <DashboardMetric label="カロリー差分" value={formatSigned(summary.calorieDiff, "kcal")} />
            <DashboardMetric label="タンパク質差分" value={formatSigned(summary.proteinDiff, "g")} />
            <DashboardMetric label="今日の体重" value={summary.bodyWeight ? `${summary.bodyWeight}kg` : "未記録"} />
            <DashboardMetric label="7日平均" value={summary.sevenDayAverageWeight ? `${summary.sevenDayAverageWeight}kg` : "記録待ち"} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={onQuick} className="w-full">
              <Plus className="h-4 w-4" />
              記録する
            </Button>
            <Button variant="secondary" onClick={onCoach} className="w-full">
              <Sparkles className="h-4 w-4" />
              コーチを見る
            </Button>
          </div>
        </CardContent>
      </Card>

      <PrivacyNotice />
    </div>
  );
}

function QuickRecordScreen({
  profile,
  selectedDate,
  templates,
  customFoodPresets,
  customWorkoutPresets,
  workouts,
  onAddMeal,
  onAddTemplate,
  onSaveCustomFood,
  onDeleteCustomFood,
  onSaveCustomWorkout,
  onAddWorkout,
  onAddBodyLog
}: {
  profile: UserProfile;
  selectedDate: string;
  templates: MealTemplate[];
  customFoodPresets: FoodPreset[];
  customWorkoutPresets: string[];
  workouts: WorkoutEntry[];
  onAddMeal: (food: FoodPreset, timing: MealTiming, note?: string) => void;
  onAddTemplate: (template: MealTemplate, timing: MealTiming) => void;
  onSaveCustomFood: (food: Omit<FoodPreset, "id"> & { id?: string }) => void;
  onDeleteCustomFood: (id: string) => void;
  onSaveCustomWorkout: (exercise: string) => void;
  onAddWorkout: (entry: Omit<WorkoutEntry, "id" | "date" | "createdAt">) => void;
  onAddBodyLog: (entry: Omit<BodyLog, "id" | "date" | "createdAt">) => void;
}) {
  const [timing, setTiming] = useState<MealTiming>("lunch");
  const [customFood, setCustomFood] = useState({ name: "", calories: 300, protein: 20, fat: 8, carbs: 35, note: "" });
  const [editingFoodId, setEditingFoodId] = useState<string | undefined>();
  const [bodyWeight, setBodyWeight] = useState(profile.currentWeight);
  const [bodyFat, setBodyFat] = useState<number | undefined>();
  const [exercise, setExercise] = useState("ベンチプレス");
  const [workout, setWorkout] = useState({ weight: 40, reps: 10, sets: 3, note: "" });
  const exerciseOptions = useMemo(
    () => [...customWorkoutPresets, ...workoutPresets.filter((item) => !customWorkoutPresets.includes(item))],
    [customWorkoutPresets]
  );
  const previous = workouts
    .filter((item) => item.exercise === exercise && item.date < selectedDate)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  const editPreset = (food: FoodPreset, editable = false) => {
    setCustomFood({
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      fat: food.fat,
      carbs: food.carbs,
      note: editable ? "自分のプリセットを編集中" : "初期プリセットをコピー"
    });
    setEditingFoodId(editable ? food.id : undefined);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>1分クイック記録</CardTitle>
          <p className="text-sm text-muted">タイミングを選んで、よく食べるものをタップするだけ。</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <TimingPicker value={timing} onChange={setTiming} />
          {customFoodPresets.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-black text-ink">マイ定番</p>
                <p className="text-xs font-bold text-muted">{customFoodPresets.length}件</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {customFoodPresets.map((food) => (
                  <FoodPresetButton
                    key={food.id}
                    food={food}
                    badge="自分用"
                    accent
                    onAdd={(item) => onAddMeal(item, timing)}
                    onEdit={(item) => editPreset(item, true)}
                    onDelete={onDeleteCustomFood}
                  />
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <p className="text-sm font-black text-ink">おすすめプリセット</p>
            <p className="text-xs font-bold text-muted">最初から使える定番</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {foodPresets.map((food) => (
              <FoodPresetButton
                key={food.id}
                food={food}
                onAdd={(item) => onAddMeal(item, timing)}
                onEdit={(item) => editPreset(item)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>食事テンプレート</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3 overflow-x-auto pb-5 no-scrollbar">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => onAddTemplate(template, timing)}
              className="min-w-44 rounded-3xl border border-line bg-white p-4 text-left shadow-sm transition active:scale-[0.98]"
            >
              <p className="font-black text-ink">{template.name}</p>
              <p className="mt-2 text-xs leading-5 text-muted">{template.items.map((item) => item.name.split(" ")[0]).join(" + ")}</p>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{editingFoodId ? "プリセットを編集" : "プリセットを作る"}</CardTitle>
          <p className="text-sm text-muted">自分がよく食べる商品名と栄養を保存できます。</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="食品名" value={customFood.name} onChange={(event) => setCustomFood({ ...customFood, name: event.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <NumberInput value={customFood.calories} unit="kcal" onChange={(value) => setCustomFood({ ...customFood, calories: value })} />
            <NumberInput value={customFood.protein} unit="P g" onChange={(value) => setCustomFood({ ...customFood, protein: value })} />
            <NumberInput value={customFood.fat} unit="F g" onChange={(value) => setCustomFood({ ...customFood, fat: value })} />
            <NumberInput value={customFood.carbs} unit="C g" onChange={(value) => setCustomFood({ ...customFood, carbs: value })} />
          </div>
          <Textarea placeholder="メモ 任意" value={customFood.note} onChange={(event) => setCustomFood({ ...customFood, note: event.target.value })} />
          <Button
            className="w-full"
            onClick={() => {
              if (!customFood.name.trim()) return;
              onAddMeal({ id: createId("custom-food"), ...customFood, name: customFood.name.trim() }, timing, customFood.note);
              setCustomFood({ name: "", calories: 300, protein: 20, fat: 8, carbs: 35, note: "" });
            }}
          >
            食事を追加
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              if (!customFood.name.trim()) return;
              onSaveCustomFood({
                id: editingFoodId,
                name: customFood.name,
                calories: customFood.calories,
                protein: customFood.protein,
                fat: customFood.fat,
                carbs: customFood.carbs
              });
              setEditingFoodId(undefined);
            }}
          >
            {editingFoodId ? "プリセットを更新" : "自分のプリセットに保存"}
          </Button>
          {editingFoodId && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setEditingFoodId(undefined);
                setCustomFood({ name: "", calories: 300, protein: 20, fat: 8, carbs: 35, note: "" });
              }}
            >
              編集をキャンセル
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>筋トレと体重</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Select value={exercise} onChange={(event) => setExercise(event.target.value)}>
              {exerciseOptions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
            <div className="rounded-2xl bg-gray-50 px-4 py-3 text-xs font-bold text-muted">
              前回 {previous ? `${previous.weight}kg x ${previous.reps}` : "記録なし"}
            </div>
            <NumberInput value={workout.weight} unit="kg" onChange={(value) => setWorkout({ ...workout, weight: value })} />
            <NumberInput value={workout.reps} unit="回" onChange={(value) => setWorkout({ ...workout, reps: value })} />
            <NumberInput value={workout.sets} unit="set" onChange={(value) => setWorkout({ ...workout, sets: value })} />
            <Input placeholder="メモ" value={workout.note} onChange={(event) => setWorkout({ ...workout, note: event.target.value })} />
          </div>
          <Button className="w-full" onClick={() => onAddWorkout({ exercise, ...workout })}>
            筋トレを追加
          </Button>
          {!customWorkoutPresets.includes(exercise) && (
            <Button variant="secondary" className="w-full" onClick={() => onSaveCustomWorkout(exercise)}>
              この種目を自分用に保存
            </Button>
          )}
          <div className="grid grid-cols-2 gap-3">
            <NumberInput value={bodyWeight} unit="kg" onChange={setBodyWeight} />
            <NumberInput value={bodyFat ?? 0} unit="%" onChange={setBodyFat} />
          </div>
          <Button variant="secondary" className="w-full" onClick={() => onAddBodyLog({ weight: bodyWeight, bodyFat: bodyFat || undefined })}>
            体重を記録
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function MealsScreen({
  profile,
  summary,
  meals,
  templates,
  onDeleteMeal,
  onAddTemplate,
  onSaveTemplate
}: {
  profile: UserProfile;
  summary: NonNullable<ReturnType<typeof buildDailySummary>>;
  meals: MealEntry[];
  templates: MealTemplate[];
  onDeleteMeal: (id: string) => void;
  onAddTemplate: (template: MealTemplate, timing: MealTiming) => void;
  onSaveTemplate: (name: string) => void;
}) {
  const [templateName, setTemplateName] = useState("");
  const [timing, setTiming] = useState<MealTiming>("dinner");

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>今日の食事</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <MiniStat icon={Flame} label="合計" value={`${summary.calories}`} sub={`${formatSigned(summary.calorieDiff, "kcal")}`} tone="blue" />
            <MiniStat icon={Apple} label="P" value={`${round(summary.protein)}g`} sub={`/ ${profile.targetProtein}g`} tone="mint" />
            <MiniStat icon={Activity} label="食事" value={`${summary.mealCount}`} sub="タイミング" tone="ink" />
          </div>
          <MacroBar summary={summary} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-5">
          {meals.length === 0 && <EmptyText icon={Utensils} text="まだ食事がありません。記録タブからワンタップで追加できます。" />}
          {meals.map((meal) => (
            <ListRow
              key={meal.id}
              title={meal.name}
              subtitle={`${mealTimingLabels[meal.timing]} / ${meal.calories}kcal / P${meal.protein} F${meal.fat} C${meal.carbs}`}
              onDelete={() => onDeleteMeal(meal.id)}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>テンプレート</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <TimingPicker value={timing} onChange={setTiming} />
          <div className="grid gap-2">
            {templates.map((template) => (
              <button key={template.id} onClick={() => onAddTemplate(template, timing)} className="rounded-2xl bg-gray-50 p-4 text-left">
                <p className="font-black text-ink">{template.name}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{template.items.map((item) => item.name).join(" / ")}</p>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input placeholder="今日の食事をテンプレ保存" value={templateName} onChange={(event) => setTemplateName(event.target.value)} />
            <Button
              size="icon"
              onClick={() => {
                onSaveTemplate(templateName);
                setTemplateName("");
              }}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function WorkoutsScreen({
  workouts,
  allWorkouts,
  customWorkoutPresets,
  onAddWorkout,
  onDeleteWorkout,
  onSaveCustomWorkout,
  onDeleteCustomWorkout
}: {
  workouts: WorkoutEntry[];
  allWorkouts: WorkoutEntry[];
  customWorkoutPresets: string[];
  onAddWorkout: (entry: Omit<WorkoutEntry, "id" | "date" | "createdAt">) => void;
  onDeleteWorkout: (id: string) => void;
  onSaveCustomWorkout: (exercise: string) => void;
  onDeleteCustomWorkout: (exercise: string) => void;
}) {
  const [exercise, setExercise] = useState("スクワット");
  const [customExercise, setCustomExercise] = useState("");
  const [form, setForm] = useState({ weight: 50, reps: 10, sets: 3, note: "" });
  const exerciseOptions = useMemo(
    () => [...customWorkoutPresets, ...workoutPresets.filter((item) => !customWorkoutPresets.includes(item))],
    [customWorkoutPresets]
  );
  const totalSets = workouts.reduce((sum, workout) => sum + workout.sets, 0);
  const previous = allWorkouts.filter((item) => item.exercise === exercise).sort((a, b) => b.date.localeCompare(a.date))[0];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>筋トレ記録</CardTitle>
          <p className="text-sm text-muted">今日の合計 {totalSets} セット</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={exercise} onChange={(event) => setExercise(event.target.value)}>
            {exerciseOptions.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </Select>
          {customWorkoutPresets.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {customWorkoutPresets.map((item) => (
                <div key={item} className="flex shrink-0 items-center gap-2 rounded-full bg-emerald-50 py-1 pl-3 pr-1 text-xs font-black text-emerald-700">
                  <button onClick={() => setExercise(item)}>{item}</button>
                  <button
                    aria-label={`${item}を削除`}
                    onClick={() => {
                      onDeleteCustomWorkout(item);
                      if (exercise === item) setExercise("スクワット");
                    }}
                    className="grid h-7 w-7 place-items-center rounded-full bg-white text-gray-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="rounded-2xl bg-amberSoft p-3 text-xs font-bold text-amber-800">
            前回: {previous ? `${previous.weight}kg x ${previous.reps}回 x ${previous.sets}セット` : "まだ記録がありません"}
          </p>
          <div className="grid grid-cols-3 gap-2">
            <NumberInput value={form.weight} unit="kg" onChange={(value) => setForm({ ...form, weight: value })} />
            <NumberInput value={form.reps} unit="回" onChange={(value) => setForm({ ...form, reps: value })} />
            <NumberInput value={form.sets} unit="set" onChange={(value) => setForm({ ...form, sets: value })} />
          </div>
          <Input placeholder="メモ" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
          <Button className="w-full" onClick={() => onAddWorkout({ exercise, ...form })}>
            追加する
          </Button>
          {!customWorkoutPresets.includes(exercise) && (
            <Button variant="secondary" className="w-full" onClick={() => onSaveCustomWorkout(exercise)}>
              この種目を自分用に保存
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>種目を追加</CardTitle>
          <p className="text-sm text-muted">ジムのマシン名や自重メニューを自分用リストに保存できます。</p>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input placeholder="例: インクラインプレス" value={customExercise} onChange={(event) => setCustomExercise(event.target.value)} />
          <Button
            size="icon"
            onClick={() => {
              if (!customExercise.trim()) return;
              onSaveCustomWorkout(customExercise);
              setExercise(customExercise.trim());
              setCustomExercise("");
            }}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-5">
          {workouts.length === 0 && <EmptyText icon={Dumbbell} text="今日の筋トレはまだありません。1種目だけでも記録するとスコアに反映されます。" />}
          {workouts.map((workout) => (
            <ListRow
              key={workout.id}
              title={workout.exercise}
              subtitle={`${workout.weight}kg / ${workout.reps}回 / ${workout.sets}セット${workout.note ? ` / ${workout.note}` : ""}`}
              onDelete={() => onDeleteWorkout(workout.id)}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ProgressScreen({
  profile,
  mealEntries,
  workoutEntries,
  bodyLogs,
  onAddBodyLog
}: {
  profile: UserProfile;
  mealEntries: MealEntry[];
  workoutEntries: WorkoutEntry[];
  bodyLogs: BodyLog[];
  onAddBodyLog: (entry: Omit<BodyLog, "id" | "date" | "createdAt">) => void;
}) {
  const sortedLogs = [...bodyLogs].sort((a, b) => a.date.localeCompare(b.date));
  const dailySummaries = Array.from(
    new Set([...mealEntries.map((meal) => meal.date), ...workoutEntries.map((workout) => workout.date), ...bodyLogs.map((log) => log.date)])
  )
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 14)
    .map((day) => buildDailySummary(profile, mealEntries, workoutEntries, bodyLogs, day));
  const latest = sortedLogs.at(-1);
  const sevenAverage = sortedLogs.length
    ? round(sortedLogs.slice(-7).reduce((sum, log) => sum + log.weight, 0) / Math.min(sortedLogs.length, 7), 1)
    : undefined;
  const [weight, setWeight] = useState(latest?.weight ?? profile.currentWeight);
  const [bodyFat, setBodyFat] = useState<number | undefined>(latest?.bodyFat);
  const [note, setNote] = useState("");

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>7日平均で見る</CardTitle>
          <p className="text-sm text-muted">1日の増減ではなく、平均で焦らず確認します。</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <MiniStat icon={Scale} label="最新" value={latest ? `${latest.weight}` : "-"} sub="kg" tone="ink" />
            <MiniStat icon={CalendarDays} label="7日平均" value={sevenAverage ? `${sevenAverage}` : "-"} sub="kg" tone="blue" />
            <MiniStat icon={HeartPulse} label="目標差" value={latest ? formatSigned(latest.weight - profile.targetWeight) : "-"} sub="kg" tone="mint" />
          </div>
          <ProgressChart logs={sortedLogs} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>体重を記録</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <NumberInput value={weight} unit="kg" onChange={setWeight} />
            <NumberInput value={bodyFat ?? 0} unit="%" onChange={setBodyFat} />
          </div>
          <Textarea placeholder="メモ 任意" value={note} onChange={(event) => setNote(event.target.value)} />
          <Button className="w-full" onClick={() => onAddBodyLog({ weight, bodyFat: bodyFat || undefined, note })}>
            保存する
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-5">
          <h2 className="text-base font-black text-ink">日別ログ</h2>
          {dailySummaries.length === 0 && <EmptyText icon={CalendarDays} text="食事・筋トレ・体重を記録すると、過去の日別ログがここに残ります。" />}
          {dailySummaries.map((day) => (
            <div key={day.date} className="rounded-3xl bg-gray-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black text-ink">{day.date}</p>
                  <p className="mt-1 text-xs font-bold text-muted">
                    {day.calories}kcal / P{round(day.protein)}g / {day.workoutSets}セット
                  </p>
                </div>
                <div className="rounded-2xl bg-white px-3 py-2 text-right shadow-sm">
                  <p className="text-[10px] font-black text-muted">Score</p>
                  <p className="text-lg font-black text-ink">{day.score}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs font-bold text-muted">
                <span className="rounded-2xl bg-white px-3 py-2">食事 {day.mealCount}</span>
                <span className="rounded-2xl bg-white px-3 py-2">{day.trainedToday ? "筋トレ済み" : "休養/未記録"}</span>
                <span className="rounded-2xl bg-white px-3 py-2">{day.bodyWeight ? `${day.bodyWeight}kg` : "体重なし"}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-5">
          <h2 className="text-base font-black text-ink">体重メモ</h2>
          {sortedLogs.slice(-14).reverse().map((log) => (
            <div key={log.id} className="rounded-2xl bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <p className="font-black text-ink">{log.date}</p>
                <p className="text-lg font-black text-ink">{log.weight}kg</p>
              </div>
              <p className="mt-1 text-xs font-bold text-muted">
                {log.bodyFat ? `体脂肪率 ${log.bodyFat}%` : "体脂肪率 未記録"} {log.note ? ` / ${log.note}` : ""}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function CoachScreen({ advice, summary, profile }: { advice: ReturnType<typeof generateCoachAdvice>; summary: DailySummaryLike; profile: UserProfile }) {
  return (
    <div className="space-y-4">
      <Card className="bg-ink text-white">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-2 text-sm font-bold text-white/70">
            <Sparkles className="h-4 w-4" />
            今日の評価
          </div>
          <h2 className="text-3xl font-black tracking-normal">{advice.scoreLabel}</h2>
          <p className="leading-7 text-white/80">{advice.todayReview}</p>
          <div className="rounded-3xl bg-white/10 p-4">
            <p className="text-sm font-bold text-white/70">Score</p>
            <p className="text-5xl font-black">{summary.score}</p>
          </div>
        </CardContent>
      </Card>
      <AdviceSection title="良かった点" items={advice.goodPoints} tone="good" />
      <AdviceSection title="改善ポイント" items={advice.improvements} tone="improve" />
      <Card>
        <CardContent className="space-y-4 p-5">
          <CoachText title="明日の食事" text={advice.tomorrowMealAdvice} />
          <CoachText title="明日のトレーニング" text={advice.tomorrowWorkoutAdvice} />
          <CoachText title="一言" text={advice.encouragement} />
          <div className="rounded-3xl bg-gray-50 p-4 text-sm leading-6 text-muted">
            目標: {goalLabel(profile.goal)} / {profile.targetCalories}kcal / P{profile.targetProtein}g / 週{profile.weeklyWorkoutGoal}回
          </div>
        </CardContent>
      </Card>
      <PrivacyNotice />
    </div>
  );
}

type DailySummaryLike = NonNullable<ReturnType<typeof buildDailySummary>>;

function AdviceSection({ title, items, tone }: { title: string; items: string[]; tone: "good" | "improve" }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <p key={item} className={cn("rounded-2xl p-4 text-sm font-semibold leading-6", tone === "good" ? "bg-emerald-50 text-emerald-800" : "bg-amberSoft text-amber-900")}>
            {item}
          </p>
        ))}
      </CardContent>
    </Card>
  );
}

function CoachText({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <p className="text-sm font-black text-apple">{title}</p>
      <p className="mt-1 text-sm font-semibold leading-6 text-ink">{text}</p>
    </div>
  );
}

function PrivacyNotice() {
  return (
    <Card className="border-blue-100 bg-blue-50/80">
      <CardContent className="space-y-2 p-4">
        <p className="text-sm font-black text-ink">安心メモ</p>
        <p className="text-xs font-semibold leading-5 text-muted">
          食事・体重・筋トレの記録はこの端末のブラウザ内に保存されます。外部AI APIやサーバー送信は使っていません。
          医療・栄養指導ではなく、日々の記録と意思決定を助けるための目安です。
        </p>
      </CardContent>
    </Card>
  );
}

function TimingPicker({ value, onChange }: { value: MealTiming; onChange: (value: MealTiming) => void }) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {mealTimingOptions.map(([key, label]) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={cn("h-10 rounded-2xl text-xs font-black transition", value === key ? "bg-ink text-white" : "bg-gray-100 text-muted")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-black text-muted">{label}</span>
      {children}
    </label>
  );
}

function NumberInput({ value, unit, onChange }: { value: number; unit: string; onChange: (value: number) => void }) {
  return (
    <div className="relative">
      <Input
        type="number"
        inputMode="decimal"
        value={Number.isNaN(value) ? "" : value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="pr-14"
      />
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-muted">{unit}</span>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  sub,
  tone
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
  tone: "blue" | "mint" | "ink";
}) {
  const toneClass = tone === "blue" ? "bg-blue-50 text-apple" : tone === "mint" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-ink";
  return (
    <div className="rounded-3xl bg-gray-50 p-3">
      <div className={cn("mb-3 grid h-8 w-8 place-items-center rounded-2xl", toneClass)}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-[11px] font-black text-muted">{label}</p>
      <p className="mt-1 text-xl font-black leading-none tracking-normal text-ink">{value}</p>
      <p className="mt-1 text-[11px] font-bold text-muted">{sub}</p>
    </div>
  );
}

function DashboardMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-gray-50 p-4">
      <p className="text-xs font-black text-muted">{label}</p>
      <p className="mt-1 text-xl font-black text-ink">{value}</p>
    </div>
  );
}

function ShareResultCard({
  profile,
  summary,
  advice
}: {
  profile: UserProfile;
  summary: DailySummaryLike;
  advice: ReturnType<typeof generateCoachAdvice>;
}) {
  const calorieRate = Math.min(120, Math.round((summary.calories / Math.max(profile.targetCalories, 1)) * 100));
  const proteinRate = Math.min(120, Math.round((summary.protein / Math.max(profile.targetProtein, 1)) * 100));

  return (
    <Card className="overflow-hidden border-gray-900 bg-ink text-white">
      <CardContent className="space-y-5 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/55">BodyNote AI</p>
            <h2 className="mt-1 text-2xl font-black tracking-normal">{advice.scoreLabel}</h2>
          </div>
          <div className="grid h-20 w-20 place-items-center rounded-full bg-white text-ink">
            <span className="text-3xl font-black">{summary.score}</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-3xl bg-white/10 p-3">
            <p className="text-[11px] font-bold text-white/55">kcal</p>
            <p className="mt-1 text-xl font-black">{summary.calories}</p>
            <p className="text-[11px] font-bold text-white/55">{calorieRate}%</p>
          </div>
          <div className="rounded-3xl bg-white/10 p-3">
            <p className="text-[11px] font-bold text-white/55">Protein</p>
            <p className="mt-1 text-xl font-black">{round(summary.protein)}g</p>
            <p className="text-[11px] font-bold text-white/55">{proteinRate}%</p>
          </div>
          <div className="rounded-3xl bg-white/10 p-3">
            <p className="text-[11px] font-bold text-white/55">Workout</p>
            <p className="mt-1 text-xl font-black">{summary.workoutSets}</p>
            <p className="text-[11px] font-bold text-white/55">sets</p>
          </div>
        </div>
        <div className="rounded-3xl bg-white p-4 text-ink">
          <p className="text-xs font-black text-muted">明日の一手</p>
          <p className="mt-1 text-sm font-black leading-6">{advice.todos[0]}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ListRow({ title, subtitle, onDelete }: { title: string; subtitle: string; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-3xl bg-gray-50 p-4">
      <div className="min-w-0">
        <p className="truncate font-black text-ink">{title}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-muted">{subtitle}</p>
      </div>
      <Button variant="danger" size="icon" onClick={onDelete} aria-label="削除">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function EmptyText({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <div className="grid place-items-center rounded-3xl bg-gray-50 p-8 text-center">
      <Icon className="mb-3 h-8 w-8 text-gray-300" />
      <p className="text-sm font-semibold leading-6 text-muted">{text}</p>
    </div>
  );
}

function goalLabel(goal: UserProfile["goal"]) {
  if (goal === "cut") return "減量";
  if (goal === "bulk") return "増量";
  return "維持";
}
