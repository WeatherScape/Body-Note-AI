"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Apple,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clipboard,
  Download,
  Dumbbell,
  Flame,
  HeartPulse,
  HelpCircle,
  Pencil,
  Plus,
  RotateCcw,
  Scale,
  Search,
  Send,
  Smartphone,
  Sparkles,
  Star,
  Trash2,
  TrendingDown,
  TrendingUp,
  Utensils
} from "lucide-react";
import { AppShell, type TabKey } from "@/components/AppShell";
import { BodyTwinCard } from "@/components/body-twin/BodyTwinCard";
import { BodyTwinCreator } from "@/components/body-twin/creator/BodyTwinCreator";
import { CoachCard } from "@/components/CoachCard";
import { FoodPresetButton } from "@/components/FoodPresetButton";
import { MacroBar } from "@/components/MacroBar";
import { ProgressChart } from "@/components/ProgressChart";
import { ScoreRing } from "@/components/ScoreRing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select, Textarea } from "@/components/ui/input";
import { generateCoachAdvice } from "@/lib/coach";
import { calculateBodyTwinState } from "@/lib/bodyTwin/calculateBodyTwinState";
import { normalizeBodyTwinAppearance } from "@/lib/bodyTwin/createBodyTwinConfig";
import { activityLevelLabels, calculateNutritionTargets } from "@/lib/nutrition";
import { foodPresets, initialMealTemplates, mealTimingLabels, workoutPresets } from "@/lib/presets";
import { buildDailySummary } from "@/lib/summary";
import {
  loadAppData,
  saveBodyLogs,
  saveCustomFoodPresets,
  saveCustomWorkoutPresets,
  saveBodyTwinAppearance,
  saveMealEntries,
  saveMealTemplates,
  saveProfile,
  saveWorkoutEntries
} from "@/lib/storage";
import type { BodyLog, FoodPreset, GoalType, MealEntry, MealTemplate, MealTiming, UserProfile, WorkoutEntry } from "@/lib/types";
import type { BodyTwinAppearance, BodyTwinState, DailyBodyLog } from "@/types/bodyTwin";
import { clamp, cn, createId, formatSigned, round, todayKey } from "@/lib/utils";

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
const GOOGLE_FEEDBACK_FORM_URL = "";
const QUICK_START_KEY = "bodynote:quickStartDone";
const INSTALL_PROMPT_KEY = "bodynote:installPromptDismissed";
type AppView = TabKey | "settings";
type AnalyticsEventName =
  | "onboarding_complete"
  | "tab_change"
  | "quick_add_food"
  | "save_custom_food"
  | "save_body_log"
  | "add_workout"
  | "feedback_open"
  | "install_prompt_click";
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};
type ProgressInsight = {
  latestWeight?: number;
  startWeight: number;
  weightChange?: number;
  targetProgress: number;
  remainingToGoal?: number;
  bodyFatChange?: number;
  streakDays: number;
  weeklyRecordedDays: number;
  weeklyAverageScore: number;
  weeklyProteinHitDays: number;
  weeklyWorkoutDays: number;
  weeklyWorkoutSets: number;
  weeklyScoreDelta?: number;
};

function trackEvent(name: AnalyticsEventName, data?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined") return;
  const analytics = window as unknown as { va?: (type: "event", eventName: string, payload?: Record<string, string | number | boolean>) => void };
  analytics.va?.("event", name, data);
}

function dateFromKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function buildProgressInsight(
  profile: UserProfile,
  mealEntries: MealEntry[],
  workoutEntries: WorkoutEntry[],
  bodyLogs: BodyLog[],
  date = todayKey()
): ProgressInsight {
  const sortedLogs = [...bodyLogs].sort((a, b) => a.date.localeCompare(b.date));
  const firstLog = sortedLogs[0];
  const latestLog = sortedLogs.at(-1);
  const startWeight = firstLog?.weight ?? profile.currentWeight;
  const latestWeight = latestLog?.weight;
  const weightChange = latestWeight === undefined ? undefined : round(latestWeight - startWeight, 1);
  const totalGoalChange = profile.targetWeight - startWeight;
  const targetProgress =
    latestWeight === undefined || totalGoalChange === 0
      ? 0
      : clamp(Math.round(((latestWeight - startWeight) / totalGoalChange) * 100), 0, 100);
  const bodyFatStart = sortedLogs.find((log) => log.bodyFat !== undefined)?.bodyFat;
  const bodyFatLatest = [...sortedLogs].reverse().find((log) => log.bodyFat !== undefined)?.bodyFat;
  const recordedDates = new Set([
    ...mealEntries.map((meal) => meal.date),
    ...workoutEntries.map((workout) => workout.date),
    ...bodyLogs.map((log) => log.date)
  ]);
  const today = dateFromKey(date);
  let streakDays = 0;
  for (let index = 0; index < 365; index += 1) {
    if (!recordedDates.has(todayKey(addDays(today, -index)))) break;
    streakDays += 1;
  }

  const currentWeek = Array.from({ length: 7 }, (_, index) => todayKey(addDays(today, -index))).map((day) =>
    buildDailySummary(profile, mealEntries, workoutEntries, bodyLogs, day)
  );
  const previousWeek = Array.from({ length: 7 }, (_, index) => todayKey(addDays(today, -7 - index))).map((day) =>
    buildDailySummary(profile, mealEntries, workoutEntries, bodyLogs, day)
  );
  const recordedCurrentWeek = currentWeek.filter((day) => recordedDates.has(day.date));
  const recordedPreviousWeek = previousWeek.filter((day) => recordedDates.has(day.date));
  const weeklyAverageScore = recordedCurrentWeek.length
    ? Math.round(recordedCurrentWeek.reduce((sum, day) => sum + day.score, 0) / recordedCurrentWeek.length)
    : 0;
  const previousAverageScore = recordedPreviousWeek.length
    ? Math.round(recordedPreviousWeek.reduce((sum, day) => sum + day.score, 0) / recordedPreviousWeek.length)
    : undefined;

  return {
    latestWeight,
    startWeight,
    weightChange,
    targetProgress,
    remainingToGoal: latestWeight === undefined ? undefined : round(latestWeight - profile.targetWeight, 1),
    bodyFatChange: bodyFatStart !== undefined && bodyFatLatest !== undefined ? round(bodyFatLatest - bodyFatStart, 1) : undefined,
    streakDays,
    weeklyRecordedDays: recordedCurrentWeek.length,
    weeklyAverageScore,
    weeklyProteinHitDays: recordedCurrentWeek.filter((day) => day.protein >= profile.targetProtein * 0.9).length,
    weeklyWorkoutDays: recordedCurrentWeek.filter((day) => day.trainedToday).length,
    weeklyWorkoutSets: recordedCurrentWeek.reduce((sum, day) => sum + day.workoutSets, 0),
    weeklyScoreDelta: previousAverageScore === undefined ? undefined : weeklyAverageScore - previousAverageScore
  };
}

function buildBodyTwinLogs(
  profile: UserProfile,
  mealEntries: MealEntry[],
  workoutEntries: WorkoutEntry[],
  bodyLogs: BodyLog[],
  date = todayKey()
): DailyBodyLog[] {
  const today = dateFromKey(date);
  const recordedDates = new Set([
    ...mealEntries.map((meal) => meal.date),
    ...workoutEntries.map((workout) => workout.date),
    ...bodyLogs.map((log) => log.date)
  ]);

  let currentStreak = 0;
  for (let index = 0; index < 365; index += 1) {
    if (!recordedDates.has(todayKey(addDays(today, -index)))) break;
    currentStreak += 1;
  }

  return Array.from({ length: 7 }, (_, index) => {
    const day = todayKey(addDays(today, -index));
    const summary = buildDailySummary(profile, mealEntries, workoutEntries, bodyLogs, day);
    const dayStreak = index === 0 ? currentStreak : Math.max(0, currentStreak - index);

    return {
      date: day,
      intakeCalories: summary.calories,
      burnedCalories: profile.estimatedMaintenanceCalories,
      targetCalories: profile.targetCalories,
      protein: summary.protein,
      proteinTarget: profile.targetProtein,
      workoutDone: summary.trainedToday,
      weight: summary.bodyWeight,
      bodyFat: summary.bodyFat,
      streakDays: dayStreak,
      mode: profile.goal
    };
  });
}

function normalizeProfile(profile?: UserProfile): UserProfile | undefined {
  if (!profile) return undefined;
  const merged = { ...defaultProfile, ...profile };
  const targets = calculateNutritionTargets({
    goal: merged.goal,
    style: merged.style,
    sex: merged.sex,
    weight: merged.currentWeight,
    height: merged.height,
    age: merged.age,
    activityLevel: merged.activityLevel
  });

  return {
    ...merged,
    estimatedMaintenanceCalories: merged.estimatedMaintenanceCalories || targets.maintenanceCalories,
    targetCalories: merged.targetCalories || targets.targetCalories,
    targetProtein: merged.targetProtein || targets.targetProtein
  };
}

export default function Home() {
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<AppView>("dashboard");
  const [profile, setProfile] = useState<UserProfile | undefined>();
  const [mealEntries, setMealEntries] = useState<MealEntry[]>([]);
  const [workoutEntries, setWorkoutEntries] = useState<WorkoutEntry[]>([]);
  const [bodyLogs, setBodyLogs] = useState<BodyLog[]>([]);
  const [mealTemplates, setMealTemplates] = useState<MealTemplate[]>(initialMealTemplates);
  const [customFoodPresets, setCustomFoodPresets] = useState<FoodPreset[]>([]);
  const [customWorkoutPresets, setCustomWorkoutPresets] = useState<string[]>([]);
  const [bodyTwinAppearance, setBodyTwinAppearance] = useState<BodyTwinAppearance | undefined>();
  const [editingBodyTwin, setEditingBodyTwin] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ id: number; message: string }>();
  const [showTutorial, setShowTutorial] = useState(false);
  const [quickStartDone, setQuickStartDone] = useState(true);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installPromptDismissed, setInstallPromptDismissed] = useState(true);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const date = todayKey();

  const playAddSound = () => {
    try {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const audio = new AudioContextClass();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(720, audio.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(980, audio.currentTime + 0.08);
      gain.gain.setValueAtTime(0.0001, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.055, audio.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.16);
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start();
      oscillator.stop(audio.currentTime + 0.17);
      window.setTimeout(() => void audio.close(), 240);
    } catch {
      // Audio feedback is nice-to-have. Some browsers block it.
    }
  };

  const notifyAdded = (message: string) => {
    playAddSound();
    setActionFeedback({ id: Date.now(), message });
  };

  useEffect(() => {
    const data = loadAppData();
    const normalizedProfile = normalizeProfile(data.profile);
    setProfile(normalizedProfile);
    if (normalizedProfile && normalizedProfile !== data.profile) saveProfile(normalizedProfile);
    setMealEntries(data.mealEntries);
    setWorkoutEntries(data.workoutEntries);
    setBodyLogs(data.bodyLogs);
    setMealTemplates(data.mealTemplates.length ? data.mealTemplates : initialMealTemplates);
    setCustomFoodPresets(data.customFoodPresets);
    setCustomWorkoutPresets(data.customWorkoutPresets);
    setBodyTwinAppearance(data.bodyTwinAppearance ? normalizeBodyTwinAppearance(data.bodyTwinAppearance) : undefined);
    setShowTutorial(window.localStorage.getItem("bodynote:tutorialDismissed") !== "true");
    setQuickStartDone(window.localStorage.getItem(QUICK_START_KEY) === "true");
    setInstallPromptDismissed(window.localStorage.getItem(INSTALL_PROMPT_KEY) === "true");
    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    );
    setIsIos(/iphone|ipad|ipod/i.test(window.navigator.userAgent));
    setLoaded(true);
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredInstallPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    if (!actionFeedback) return;
    const timer = window.setTimeout(() => setActionFeedback(undefined), 1400);
    return () => window.clearTimeout(timer);
  }, [actionFeedback]);

  const todayMeals = useMemo(() => mealEntries.filter((meal) => meal.date === date), [mealEntries, date]);
  const todayWorkouts = useMemo(() => workoutEntries.filter((workout) => workout.date === date), [workoutEntries, date]);

  const summary = useMemo(
    () => (profile ? buildDailySummary(profile, mealEntries, workoutEntries, bodyLogs, date) : undefined),
    [profile, mealEntries, workoutEntries, bodyLogs, date]
  );

  const advice = useMemo(() => (profile && summary ? generateCoachAdvice(profile, summary) : undefined), [profile, summary]);
  const progressInsight = useMemo(
    () => (profile ? buildProgressInsight(profile, mealEntries, workoutEntries, bodyLogs, date) : undefined),
    [profile, mealEntries, workoutEntries, bodyLogs, date]
  );
  const bodyTwinState = useMemo(
    () => (profile ? calculateBodyTwinState(buildBodyTwinLogs(profile, mealEntries, workoutEntries, bodyLogs, date)) : undefined),
    [profile, mealEntries, workoutEntries, bodyLogs, date]
  );

  const completeQuickStart = () => {
    if (quickStartDone) return;
    setQuickStartDone(true);
    window.localStorage.setItem(QUICK_START_KEY, "true");
    window.setTimeout(() => setActiveTab("dashboard"), 650);
  };

  const dismissInstallPrompt = () => {
    setInstallPromptDismissed(true);
    window.localStorage.setItem(INSTALL_PROMPT_KEY, "true");
  };

  const handleInstallPrompt = async () => {
    trackEvent("install_prompt_click", { source: deferredInstallPrompt ? "browser_prompt" : isIos ? "ios_guide" : "guide" });
    if (!deferredInstallPrompt) {
      notifyAdded("共有ボタンからホーム画面に追加できます");
      return;
    }
    await deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    setDeferredInstallPrompt(null);
    if (choice.outcome === "accepted") dismissInstallPrompt();
  };

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
    trackEvent("quick_add_food", { source: food.id.startsWith("my-food") || food.id.startsWith("custom-food") ? "custom" : "preset" });
    notifyAdded(`${food.name}を追加。Body Twinが更新されました`);
    completeQuickStart();
  };

  const addTemplate = (template: MealTemplate, timing: MealTiming) => {
    const targetTiming = template.timing ?? timing;
    const now = new Date().toISOString();
    const entries = template.items.map<MealEntry>((item) => ({
      id: createId("meal"),
      date,
      timing: targetTiming,
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
    trackEvent("quick_add_food", { source: "template", count: entries.length });
    notifyAdded(`${template.name}を追加。Body Twinが更新されました`);
    completeQuickStart();
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
    trackEvent("save_custom_food");
    notifyAdded("自分のプリセットに保存しました");
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
    trackEvent("add_workout");
    notifyAdded("筋トレを追加しました");
  };

  const saveCustomWorkoutPreset = (exercise: string) => {
    const name = exercise.trim();
    if (!name) return;
    const next = [name, ...customWorkoutPresets.filter((item) => item !== name)].slice(0, 30);
    setCustomWorkoutPresets(next);
    saveCustomWorkoutPresets(next);
    notifyAdded("自分用の種目に保存しました");
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
    trackEvent("save_body_log");
    notifyAdded("体重を保存しました");
  };

  const saveTodayTemplate = (name: string, timing: MealTiming, templateId?: string) => {
    const sourceMeals = todayMeals.filter((meal) => meal.timing === timing);
    const fallbackTemplate = templateId ? mealTemplates.find((template) => template.id === templateId) : undefined;
    const items = (sourceMeals.length ? sourceMeals : templateId ? [] : todayMeals).map<FoodPreset>((meal) => ({
      id: meal.id,
      name: meal.name,
      calories: meal.calories,
      protein: meal.protein,
      fat: meal.fat,
      carbs: meal.carbs
    }));
    const nextItems = items.length ? items : fallbackTemplate?.items ?? [];
    if (!name.trim() || nextItems.length === 0) return;
    const nextTemplate: MealTemplate = {
      id: templateId ?? createId("template"),
      name: name.trim(),
      timing,
      items: nextItems,
      createdAt: fallbackTemplate?.createdAt ?? new Date().toISOString()
    };
    const next = [nextTemplate, ...mealTemplates.filter((template) => template.id !== nextTemplate.id)];
    setMealTemplates(next);
    saveMealTemplates(next);
    notifyAdded(templateId ? "テンプレートを更新しました" : "テンプレートを保存しました");
  };

  const deleteMealTemplate = (id: string) => {
    const next = mealTemplates.filter((template) => template.id !== id);
    setMealTemplates(next);
    saveMealTemplates(next);
  };

  const dismissTutorial = () => {
    setShowTutorial(false);
    window.localStorage.setItem("bodynote:tutorialDismissed", "true");
  };

  const showTutorialAgain = () => {
    window.localStorage.removeItem("bodynote:tutorialDismissed");
    setShowTutorial(true);
    setActiveTab("dashboard");
    notifyAdded("使い方を表示しました");
  };

  const exportData = () => ({
    profile,
    mealEntries,
    workoutEntries,
    bodyLogs,
    mealTemplates,
    customFoodPresets,
    customWorkoutPresets,
    bodyTwinAppearance,
    exportedAt: new Date().toISOString()
  });

  const resetAllData = () => {
    if (!window.confirm("すべての記録と設定を削除します。元に戻せません。")) return;
    [
      "bodynote:userProfile",
      "bodynote:mealEntries",
      "bodynote:workoutEntries",
      "bodynote:bodyLogs",
      "bodynote:mealTemplates",
      "bodynote:customFoodPresets",
      "bodynote:customWorkoutPresets",
      "bodynote:bodyTwinAppearance",
      "bodynote:tutorialDismissed",
      QUICK_START_KEY,
      INSTALL_PROMPT_KEY
    ].forEach((key) => window.localStorage.removeItem(key));
    window.location.reload();
  };

  if (!loaded) {
    return <div className="grid min-h-screen place-items-center text-sm font-bold text-muted">BodyNote AI を準備中...</div>;
  }

  if (!profile) {
    return (
      <Onboarding
        onComplete={(nextProfile) => {
          window.localStorage.removeItem("bodynote:tutorialDismissed");
          window.localStorage.removeItem(QUICK_START_KEY);
          setShowTutorial(true);
          setQuickStartDone(false);
          setActiveTab("quick");
          setProfile(nextProfile);
          saveProfile(nextProfile);
          trackEvent("onboarding_complete");
        }}
      />
    );
  }

  if (!bodyTwinAppearance || editingBodyTwin) {
    return (
      <BodyTwinCreator
        initialAppearance={bodyTwinAppearance}
        onComplete={(appearance) => {
          setBodyTwinAppearance(appearance);
          saveBodyTwinAppearance(appearance);
          setEditingBodyTwin(false);
          notifyAdded("相棒を保存しました");
        }}
      />
    );
  }

  if (!summary || !advice || !progressInsight || !bodyTwinState) return null;

  return (
    <AppShell
      activeTab={activeTab === "settings" ? "dashboard" : activeTab}
      onTabChange={(tab) => {
        setActiveTab(tab);
        trackEvent("tab_change", { tab });
      }}
      onSettings={() => setActiveTab("settings")}
    >
      <ActionFeedback feedback={actionFeedback} />
      {activeTab === "settings" && (
        <SettingsScreen
          profile={profile}
          exportData={exportData}
          resetAllData={resetAllData}
          onNotify={notifyAdded}
          onShowTutorial={showTutorialAgain}
          onSave={(nextProfile) => {
            setProfile(nextProfile);
            saveProfile(nextProfile);
            setActiveTab("dashboard");
          }}
        />
      )}
      {activeTab === "dashboard" && (
        <DashboardScreen
          profile={profile}
          summary={summary}
          advice={advice}
          progressInsight={progressInsight}
          bodyTwinState={bodyTwinState}
          bodyTwinAppearance={bodyTwinAppearance}
          showTutorial={showTutorial}
          showInstallPrompt={!isStandalone && !installPromptDismissed && (Boolean(deferredInstallPrompt) || isIos)}
          hasNativeInstallPrompt={Boolean(deferredInstallPrompt)}
          isIos={isIos}
          onDismissTutorial={dismissTutorial}
          onInstall={handleInstallPrompt}
          onDismissInstall={dismissInstallPrompt}
          onEditBodyTwin={() => setEditingBodyTwin(true)}
          onQuick={() => setActiveTab("quick")}
          onCoach={() => setActiveTab("coach")}
        />
      )}
      {activeTab === "quick" && (
        <QuickRecordScreen
          templates={mealTemplates}
          customFoodPresets={customFoodPresets}
          showQuickStart={!quickStartDone}
          onAddMeal={addMeal}
          onAddTemplate={addTemplate}
          onSaveCustomFood={saveCustomFoodPreset}
          onDeleteCustomFood={deleteCustomFoodPreset}
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
          onDeleteTemplate={deleteMealTemplate}
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
          progressInsight={progressInsight}
          onAddBodyLog={addBodyLog}
        />
      )}
      {activeTab === "coach" && <CoachScreen advice={advice} summary={summary} profile={profile} />}
    </AppShell>
  );
}

function Onboarding({
  onComplete,
  initialProfile,
  embedded = false,
  submitLabel = "はじめる"
}: {
  onComplete: (profile: UserProfile) => void;
  initialProfile?: UserProfile;
  embedded?: boolean;
  submitLabel?: string;
}) {
  const [form, setForm] = useState(initialProfile ?? defaultProfile);
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
    <main className={cn(embedded ? "w-full" : "mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-8")}>
      <div className={cn("mb-8", embedded && "hidden")}>
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

      {!embedded && <OnboardingGuide />}

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
          {submitLabel}
          <ChevronRight className="h-5 w-5" />
        </Button>
      </Card>
    </main>
  );
}

function OnboardingGuide() {
  const steps = [
    { title: "体情報を入れる", body: "身長・年齢・体重・運動頻度から、目標カロリーとタンパク質を自動で出します。" },
    { title: "食べたら1タップ", body: "よく食べるものは自分のプリセットに保存して、次回からすぐ追加できます。" },
    { title: "今日の判断を見る", body: "スコア、足りない栄養、明日の一手をアプリがやさしく整理します。" }
  ];

  return (
    <Card className="mb-5 border-blue-100 bg-blue-50/80">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-apple" />
          <h2 className="font-black text-ink">最初はこの3つだけ</h2>
        </div>
        <div className="grid gap-2">
          {steps.map((step, index) => (
            <div key={step.title} className="rounded-3xl bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink text-xs font-black text-white">{index + 1}</span>
                <p className="font-black text-ink">{step.title}</p>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted">{step.body}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SettingsScreen({
  profile,
  exportData,
  resetAllData,
  onNotify,
  onShowTutorial,
  onSave
}: {
  profile: UserProfile;
  exportData: () => unknown;
  resetAllData: () => void;
  onNotify: (message: string) => void;
  onShowTutorial: () => void;
  onSave: (profile: UserProfile) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-black tracking-normal text-ink">目標設定</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          体重・身長・年齢・運動頻度を入れると、消費カロリーと目標カロリーを再計算できます。
        </p>
      </div>
      <Onboarding initialProfile={profile} embedded submitLabel="設定を保存" onComplete={onSave} />
      <Card>
        <CardContent className="flex items-center justify-between gap-3 p-5">
          <div>
            <h3 className="font-black text-ink">使い方を確認</h3>
            <p className="mt-1 text-sm leading-6 text-muted">初めて触る人向けの3ステップをもう一度表示します。</p>
          </div>
          <Button variant="secondary" size="sm" onClick={onShowTutorial}>
            <HelpCircle className="h-4 w-4" />
            表示
          </Button>
        </CardContent>
      </Card>
      <FeedbackCard onNotify={onNotify} />
      <DataToolsCard exportData={exportData} resetAllData={resetAllData} onNotify={onNotify} />
    </div>
  );
}

function FeedbackCard({ onNotify }: { onNotify: (message: string) => void }) {
  const [rating, setRating] = useState("5");
  const [category, setCategory] = useState("使いにくいところ");
  const [message, setMessage] = useState("");
  const feedbackText = `BodyNote AI feedback\n評価: ${rating}/5\nカテゴリ: ${category}\n内容: ${message || "未入力"}`;
  const hasGoogleForm = GOOGLE_FEEDBACK_FORM_URL.trim().length > 0;

  const copyFeedback = async () => {
    await navigator.clipboard.writeText(feedbackText);
    onNotify("フィードバック文をコピーしました");
  };

  const openGoogleForm = () => {
    trackEvent("feedback_open", { mode: hasGoogleForm ? "google_form" : "fallback" });
    if (!hasGoogleForm) {
      onNotify("GoogleフォームURL未設定です。コピーで送れます");
      return;
    }
    window.open(GOOGLE_FEEDBACK_FORM_URL, "_blank", "noopener,noreferrer");
  };

  const mailFeedback = () => {
    const subject = encodeURIComponent("BodyNote AI フィードバック");
    const body = encodeURIComponent(feedbackText);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-apple" />
          フィードバック
        </CardTitle>
        <p className="text-sm leading-6 text-muted">友達が30秒で「ここ微妙」「これ欲しい」を送れる導線です。</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button className="w-full" onClick={openGoogleForm}>
          <Send className="h-4 w-4" />
          30秒で感想を送る
        </Button>
        {!hasGoogleForm && (
          <p className="rounded-2xl bg-amberSoft p-3 text-xs font-bold leading-5 text-amber-800">
            GoogleフォームURLはまだ未設定です。URLを入れるまでは、下のコピー/メールでフィードバックを残せます。
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Select value={rating} onChange={(event) => setRating(event.target.value)}>
            <option value="5">5 とても良い</option>
            <option value="4">4 良い</option>
            <option value="3">3 普通</option>
            <option value="2">2 微妙</option>
            <option value="1">1 使いにくい</option>
          </Select>
          <Select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option>使いにくいところ</option>
            <option>欲しい機能</option>
            <option>表示がわかりにくい</option>
            <option>バグっぽい</option>
            <option>その他</option>
          </Select>
        </div>
        <Textarea placeholder="例: 初回設定で何を入れたらいいかわからなかった" value={message} onChange={(event) => setMessage(event.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={copyFeedback}>
            <Clipboard className="h-4 w-4" />
            コピー
          </Button>
          <Button onClick={mailFeedback}>
            <ChevronRight className="h-4 w-4" />
            メール
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function DataToolsCard({
  exportData,
  resetAllData,
  onNotify
}: {
  exportData: () => unknown;
  resetAllData: () => void;
  onNotify: (message: string) => void;
}) {
  const copyExport = async () => {
    await navigator.clipboard.writeText(JSON.stringify(exportData(), null, 2));
    onNotify("データを書き出しました");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>データ管理</CardTitle>
        <p className="text-sm leading-6 text-muted">テスト中の記録を控えたり、最初からやり直したい時に使います。</p>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={copyExport}>
          <Download className="h-4 w-4" />
          出力
        </Button>
        <Button variant="danger" onClick={resetAllData}>
          <RotateCcw className="h-4 w-4" />
          リセット
        </Button>
      </CardContent>
    </Card>
  );
}

function TutorialCard({ onDismiss }: { onDismiss: () => void }) {
  const steps = [
    "まずは記録タブで食べたものを1つ追加",
    "よく食べるものは自分のプリセットに保存",
    "今日タブでスコアと次の行動を見る"
  ];

  return (
    <Card className="border-blue-100 bg-blue-50/80">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-black text-apple">最初の使い方</p>
            <h2 className="mt-1 text-xl font-black tracking-normal text-ink">今日やることは3つだけ</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            閉じる
          </Button>
        </div>
        <div className="grid gap-2">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center gap-3 rounded-2xl bg-white p-3 text-sm font-bold text-ink">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-xs text-white">{index + 1}</span>
              {step}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function InstallPromptCard({
  hasNativeInstallPrompt,
  isIos,
  onInstall,
  onDismiss
}: {
  hasNativeInstallPrompt: boolean;
  isIos: boolean;
  onInstall: () => void;
  onDismiss: () => void;
}) {
  return (
    <Card className="border-emerald-100 bg-emerald-50/80">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-3xl bg-white text-emerald-600 shadow-sm">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-black text-ink">スマホに入れて毎日開く</h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-muted">
                {hasNativeInstallPrompt
                  ? "ホーム画面に追加すると、アプリみたいにすぐ記録できます。"
                  : isIos
                    ? "Safariの共有ボタンから「ホーム画面に追加」を選ぶと、アプリのように使えます。"
                    : "ブラウザのメニューからホーム画面に追加できます。"}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            閉じる
          </Button>
        </div>
        <Button className="w-full" onClick={onInstall}>
          <Smartphone className="h-4 w-4" />
          {hasNativeInstallPrompt ? "ホーム画面に追加" : "追加方法を見る"}
        </Button>
      </CardContent>
    </Card>
  );
}

function ActionFeedback({ feedback }: { feedback?: { id: number; message: string } }) {
  if (!feedback) return null;

  return (
    <div
      key={feedback.id}
      className="fixed inset-x-0 bottom-24 z-40 mx-auto flex w-fit max-w-[calc(100%-2rem)] animate-[fadeSlide_1.4s_ease-out_forwards] items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-black text-white shadow-soft"
    >
      <CheckCircle2 className="h-5 w-5 text-mint" />
      {feedback.message}
    </div>
  );
}

function ChangeSnapshotCard({ profile, insight, compact = false }: { profile: UserProfile; insight: ProgressInsight; compact?: boolean }) {
  const goalDirection = profile.goal === "bulk" ? "増量" : profile.goal === "maintain" ? "維持" : "減量";
  const progressLabel = insight.latestWeight
    ? `${goalDirection}の目標まで ${Math.abs(insight.remainingToGoal ?? 0)}kg`
    : "体重を記録すると目標までの距離が出ます";
  const weightTone = insight.weightChange === undefined ? "text-muted" : insight.weightChange <= 0 ? "text-mint" : "text-apple";
  const scoreDeltaLabel =
    insight.weeklyScoreDelta === undefined ? "先週比較は記録待ち" : `${insight.weeklyScoreDelta >= 0 ? "+" : ""}${insight.weeklyScoreDelta}pt`;

  return (
    <Card className={cn("overflow-hidden", compact ? "bg-white" : "bg-ink text-white")}>
      <CardContent className="space-y-5 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={cn("text-xs font-black uppercase tracking-[0.18em]", compact ? "text-muted" : "text-white/55")}>Body Change</p>
            <h2 className={cn("mt-1 text-2xl font-black tracking-normal", compact ? "text-ink" : "text-white")}>変化が見えるカード</h2>
            <p className={cn("mt-2 text-sm font-bold leading-6", compact ? "text-muted" : "text-white/70")}>{progressLabel}</p>
          </div>
          <div className={cn("grid h-16 w-16 shrink-0 place-items-center rounded-full text-lg font-black", compact ? "bg-gray-100 text-ink" : "bg-white text-ink")}>
            {insight.targetProgress}%
          </div>
        </div>

        <div className="h-3 rounded-full bg-gray-100/70">
          <div className="h-full rounded-full bg-mint transition-all" style={{ width: `${insight.targetProgress}%` }} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ChangeMetric
            icon={insight.weightChange !== undefined && insight.weightChange <= 0 ? TrendingDown : TrendingUp}
            label="開始から"
            value={insight.weightChange === undefined ? "-" : formatSigned(insight.weightChange, "kg")}
            sub={insight.latestWeight ? `${insight.startWeight}kg → ${insight.latestWeight}kg` : "体重待ち"}
            className={weightTone}
            dark={!compact}
          />
          <ChangeMetric
            icon={CalendarDays}
            label="連続記録"
            value={`${insight.streakDays}日`}
            sub={`${insight.weeklyRecordedDays}/7日 記録`}
            dark={!compact}
          />
          <ChangeMetric
            icon={Apple}
            label="タンパク質"
            value={`${insight.weeklyProteinHitDays}日`}
            sub="今週の達成日"
            dark={!compact}
          />
          <ChangeMetric
            icon={Dumbbell}
            label="筋トレ"
            value={`${insight.weeklyWorkoutDays}日`}
            sub={`${insight.weeklyWorkoutSets}セット`}
            dark={!compact}
          />
        </div>

        {!compact && (
          <div className="rounded-3xl bg-white p-4 text-ink">
            <p className="text-xs font-black text-muted">先週とのスコア差</p>
            <p className="mt-1 text-2xl font-black">{scoreDeltaLabel}</p>
            <p className="mt-1 text-sm font-bold leading-6 text-muted">体重だけじゃなく、記録・食事・筋トレの積み上げも変化として見ます。</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ChangeMetric({
  icon: Icon,
  label,
  value,
  sub,
  className,
  dark = false
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  className?: string;
  dark?: boolean;
}) {
  return (
    <div className={cn("rounded-3xl p-4", dark ? "bg-white/10" : "bg-gray-50")}>
      <Icon className={cn("h-4 w-4", dark ? "text-mint" : "text-apple")} />
      <p className={cn("mt-3 text-[11px] font-black", dark ? "text-white/55" : "text-muted")}>{label}</p>
      <p className={cn("mt-1 text-2xl font-black", dark ? "text-white" : "text-ink", className)}>{value}</p>
      <p className={cn("mt-1 text-xs font-bold", dark ? "text-white/55" : "text-muted")}>{sub}</p>
    </div>
  );
}

function DashboardScreen({
  profile,
  summary,
  advice,
  progressInsight,
  bodyTwinState,
  bodyTwinAppearance,
  showTutorial,
  showInstallPrompt,
  hasNativeInstallPrompt,
  isIos,
  onDismissTutorial,
  onInstall,
  onDismissInstall,
  onEditBodyTwin,
  onQuick,
  onCoach
}: {
  profile: UserProfile;
  summary: NonNullable<ReturnType<typeof buildDailySummary>>;
  advice: NonNullable<ReturnType<typeof generateCoachAdvice>>;
  progressInsight: ProgressInsight;
  bodyTwinState: BodyTwinState;
  bodyTwinAppearance: BodyTwinAppearance;
  showTutorial: boolean;
  showInstallPrompt: boolean;
  hasNativeInstallPrompt: boolean;
  isIos: boolean;
  onDismissTutorial: () => void;
  onInstall: () => void;
  onDismissInstall: () => void;
  onEditBodyTwin: () => void;
  onQuick: () => void;
  onCoach: () => void;
}) {
  return (
    <div className="space-y-4">
      {showTutorial && <TutorialCard onDismiss={onDismissTutorial} />}
      {showInstallPrompt && (
        <InstallPromptCard
          hasNativeInstallPrompt={hasNativeInstallPrompt}
          isIos={isIos}
          onInstall={onInstall}
          onDismiss={onDismissInstall}
        />
      )}
      <BodyTwinCard
        state={bodyTwinState}
        appearance={bodyTwinAppearance}
        onEdit={onEditBodyTwin}
        onShare={() => {
          const text = `BodyNote AI 今日の相棒\n${bodyTwinState.label}: ${bodyTwinState.message}\nhttps://body-note-ai.vercel.app`;
          if (navigator.share) {
            void navigator.share({ title: "BodyNote AI", text, url: "https://body-note-ai.vercel.app" });
            return;
          }
          void navigator.clipboard.writeText(text);
        }}
      />
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

      <ChangeSnapshotCard profile={profile} insight={progressInsight} compact />

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
  templates,
  customFoodPresets,
  showQuickStart,
  onAddMeal,
  onAddTemplate,
  onSaveCustomFood,
  onDeleteCustomFood
}: {
  templates: MealTemplate[];
  customFoodPresets: FoodPreset[];
  showQuickStart: boolean;
  onAddMeal: (food: FoodPreset, timing: MealTiming, note?: string) => void;
  onAddTemplate: (template: MealTemplate, timing: MealTiming) => void;
  onSaveCustomFood: (food: Omit<FoodPreset, "id"> & { id?: string }) => void;
  onDeleteCustomFood: (id: string) => void;
}) {
  const [timing, setTiming] = useState<MealTiming>("lunch");
  const [foodQuery, setFoodQuery] = useState("");
  const [customFood, setCustomFood] = useState({ name: "", calories: 300, protein: 20, fat: 8, carbs: 35, note: "" });
  const [editingFoodId, setEditingFoodId] = useState<string | undefined>();
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
  const normalizedQuery = foodQuery.trim().toLowerCase();
  const visibleCustomFoods = customFoodPresets.filter((food) => food.name.toLowerCase().includes(normalizedQuery));
  const visibleDefaultFoods = foodPresets.filter((food) => food.name.toLowerCase().includes(normalizedQuery));

  return (
    <div className="space-y-4">
      {showQuickStart && <QuickStartCard />}
      <Card>
        <CardHeader>
          <CardTitle>1分クイック記録</CardTitle>
          <p className="text-sm text-muted">タイミングを選んで、よく食べるものをタップするだけ。</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <TimingPicker value={timing} onChange={setTiming} />
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input className="pl-11" placeholder="食品を検索" value={foodQuery} onChange={(event) => setFoodQuery(event.target.value)} />
          </div>
          {customFoodPresets.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-black text-ink">マイ定番</p>
                <p className="text-xs font-bold text-muted">{customFoodPresets.length}件</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {visibleCustomFoods.map((food) => (
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
            {visibleDefaultFoods.map((food) => (
              <FoodPresetButton
                key={food.id}
                food={food}
                onAdd={(item) => onAddMeal(item, timing)}
                onEdit={(item) => editPreset(item)}
              />
            ))}
          </div>
          {visibleCustomFoods.length === 0 && visibleDefaultFoods.length === 0 && (
            <div className="rounded-3xl bg-gray-50 p-6 text-center text-sm font-semibold text-muted">
              見つかりません。下の「プリセットを作る」から追加できます。
            </div>
          )}
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
              <div className="flex items-center justify-between gap-3">
                <p className="font-black text-ink">{template.name}</p>
                <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-black text-muted">
                  {mealTimingLabels[template.timing ?? timing]}
                </span>
              </div>
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

    </div>
  );
}

function QuickStartCard() {
  return (
    <Card className="border-blue-100 bg-blue-50/80">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-3xl bg-white text-apple shadow-sm">
            <Plus className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-apple">First Mission</p>
            <h2 className="mt-1 text-xl font-black tracking-normal text-ink">まず1品だけ追加</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-muted">
              鶏むね肉、白米、プロテインなどを1つタップすると、今日のスコアと次の行動が見えるようになります。
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MealsScreen({
  profile,
  summary,
  meals,
  templates,
  onDeleteMeal,
  onAddTemplate,
  onSaveTemplate,
  onDeleteTemplate
}: {
  profile: UserProfile;
  summary: NonNullable<ReturnType<typeof buildDailySummary>>;
  meals: MealEntry[];
  templates: MealTemplate[];
  onDeleteMeal: (id: string) => void;
  onAddTemplate: (template: MealTemplate, timing: MealTiming) => void;
  onSaveTemplate: (name: string, timing: MealTiming, templateId?: string) => void;
  onDeleteTemplate: (id: string) => void;
}) {
  const [templateName, setTemplateName] = useState("");
  const [timing, setTiming] = useState<MealTiming>("dinner");
  const [editingTemplateId, setEditingTemplateId] = useState<string | undefined>();
  const mealsForTiming = meals.filter((meal) => meal.timing === timing);
  const editingTemplate = editingTemplateId ? templates.find((template) => template.id === editingTemplateId) : undefined;

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
              <div key={template.id} className="rounded-2xl bg-gray-50 p-4">
                <button onClick={() => onAddTemplate(template, timing)} className="w-full text-left">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black text-ink">{template.name}</p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-muted shadow-sm">
                      {mealTimingLabels[template.timing ?? timing]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted">{template.items.map((item) => item.name).join(" / ")}</p>
                </button>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setEditingTemplateId(template.id);
                      setTemplateName(template.name);
                      setTiming(template.timing ?? timing);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    編集
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => onDeleteTemplate(template.id)}>
                    <Trash2 className="h-4 w-4" />
                    削除
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <p className="rounded-2xl bg-blue-50 p-3 text-xs font-semibold leading-5 text-muted">
            テンプレートは「毎日ほぼ同じ朝食」「固定のトレ後セット」向けです。選んだタイミングの今日の食事から保存・更新します。
          </p>
          <div className="flex gap-2">
            <Input
              placeholder={editingTemplateId ? "テンプレート名を編集" : "今日の食事をテンプレ保存"}
              value={templateName}
              onChange={(event) => setTemplateName(event.target.value)}
            />
            <Button
              size="icon"
              onClick={() => {
                onSaveTemplate(templateName, timing, editingTemplateId);
                setTemplateName("");
                setEditingTemplateId(undefined);
              }}
            >
              {editingTemplateId ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            </Button>
          </div>
          <p className="text-xs font-semibold leading-5 text-muted">
            {editingTemplate
              ? `編集中: ${editingTemplate.name}。${mealsForTiming.length ? `${mealTimingLabels[timing]}の今日の食事で中身も更新されます。` : "今日の該当タイミングに食事がない場合、中身はそのままで名前とタイミングだけ更新します。"}`
              : `${mealTimingLabels[timing]}の今日の食事 ${mealsForTiming.length}件をテンプレート化します。`}
          </p>
          {editingTemplateId && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setEditingTemplateId(undefined);
                setTemplateName("");
              }}
            >
              編集をキャンセル
            </Button>
          )}
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
  progressInsight,
  onAddBodyLog
}: {
  profile: UserProfile;
  mealEntries: MealEntry[];
  workoutEntries: WorkoutEntry[];
  bodyLogs: BodyLog[];
  progressInsight: ProgressInsight;
  onAddBodyLog: (entry: Omit<BodyLog, "id" | "date" | "createdAt">) => void;
}) {
  const sortedLogs = [...bodyLogs].sort((a, b) => a.date.localeCompare(b.date));
  const dailySummaries = Array.from(
    new Set([...mealEntries.map((meal) => meal.date), ...workoutEntries.map((workout) => workout.date), ...bodyLogs.map((log) => log.date)])
  )
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 14)
    .map((day) => buildDailySummary(profile, mealEntries, workoutEntries, bodyLogs, day));
  const weeklySummaries = dailySummaries.slice(0, 7);
  const weeklyAverageScore = weeklySummaries.length
    ? Math.round(weeklySummaries.reduce((sum, day) => sum + day.score, 0) / weeklySummaries.length)
    : 0;
  const weeklyWorkoutSets = weeklySummaries.reduce((sum, day) => sum + day.workoutSets, 0);
  const weeklyAverageProtein = weeklySummaries.length
    ? Math.round(weeklySummaries.reduce((sum, day) => sum + day.protein, 0) / weeklySummaries.length)
    : 0;
  const latest = sortedLogs.at(-1);
  const sevenAverage = sortedLogs.length
    ? round(sortedLogs.slice(-7).reduce((sum, log) => sum + log.weight, 0) / Math.min(sortedLogs.length, 7), 1)
    : undefined;
  const [weight, setWeight] = useState(latest?.weight ?? profile.currentWeight);
  const [bodyFat, setBodyFat] = useState<number | undefined>(latest?.bodyFat);
  const [note, setNote] = useState("");

  return (
    <div className="space-y-4">
      <ChangeSnapshotCard profile={profile} insight={progressInsight} />

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
          <ProgressChart logs={sortedLogs} targetWeight={profile.targetWeight} />
        </CardContent>
      </Card>

      <Card className="bg-ink text-white">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-white/55">Weekly Review</p>
              <h2 className="mt-1 text-2xl font-black tracking-normal">今週の流れ</h2>
            </div>
            <Star className="h-7 w-7 text-mint" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-3xl bg-white/10 p-3">
              <p className="text-[11px] font-bold text-white/55">記録日</p>
              <p className="mt-1 text-2xl font-black">{weeklySummaries.length}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-3">
              <p className="text-[11px] font-bold text-white/55">平均Score</p>
              <p className="mt-1 text-2xl font-black">{weeklyAverageScore}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-3">
              <p className="text-[11px] font-bold text-white/55">筋トレ</p>
              <p className="mt-1 text-2xl font-black">{weeklyWorkoutSets}</p>
            </div>
          </div>
          <p className="rounded-3xl bg-white p-4 text-sm font-bold leading-6 text-ink">
            平均タンパク質は{weeklyAverageProtein}g。まずは記録日を増やすほど、次の改善点が見えやすくなります。
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>変化メモ</CardTitle>
          <p className="text-sm leading-6 text-muted">数字が少なくても、続けた証拠を拾います。</p>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <DashboardMetric label="目標進捗" value={`${progressInsight.targetProgress}%`} />
          <DashboardMetric label="残り" value={progressInsight.remainingToGoal === undefined ? "記録待ち" : `${Math.abs(progressInsight.remainingToGoal)}kg`} />
          <DashboardMetric label="体脂肪の変化" value={progressInsight.bodyFatChange === undefined ? "記録待ち" : formatSigned(progressInsight.bodyFatChange, "%")} />
          <DashboardMetric
            label="先週比Score"
            value={progressInsight.weeklyScoreDelta === undefined ? "記録待ち" : `${progressInsight.weeklyScoreDelta >= 0 ? "+" : ""}${progressInsight.weeklyScoreDelta}pt`}
          />
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
  const [draft, setDraft] = useState(Number.isNaN(value) ? "" : String(value));

  useEffect(() => {
    setDraft(Number.isNaN(value) ? "" : String(value));
  }, [value]);

  return (
    <div className="relative">
      <Input
        type="number"
        inputMode="decimal"
        value={draft}
        onChange={(event) => {
          const next = event.target.value;
          setDraft(next);
          if (next === "") return;
          const parsed = Number(next);
          if (!Number.isNaN(parsed)) onChange(parsed);
        }}
        onBlur={() => {
          if (draft === "") return;
          const parsed = Number(draft);
          if (Number.isNaN(parsed)) setDraft(Number.isNaN(value) ? "" : String(value));
        }}
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
