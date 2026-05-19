"use client";

import type { BodyTwinAppearance } from "@/types/bodyTwin";
import type { BodyLog, FoodPreset, MealEntry, MealTemplate, UserProfile, WorkoutEntry } from "@/lib/types";
import { initialMealTemplates } from "@/lib/presets";

const keys = {
  userProfile: "bodynote:userProfile",
  mealEntries: "bodynote:mealEntries",
  workoutEntries: "bodynote:workoutEntries",
  bodyLogs: "bodynote:bodyLogs",
  mealTemplates: "bodynote:mealTemplates",
  customFoodPresets: "bodynote:customFoodPresets",
  customWorkoutPresets: "bodynote:customWorkoutPresets",
  bodyTwinAppearance: "bodynote:bodyTwinAppearance"
} as const;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export type AppData = {
  profile?: UserProfile;
  mealEntries: MealEntry[];
  workoutEntries: WorkoutEntry[];
  bodyLogs: BodyLog[];
  mealTemplates: MealTemplate[];
  customFoodPresets: FoodPreset[];
  customWorkoutPresets: string[];
  bodyTwinAppearance?: BodyTwinAppearance;
};

export function loadAppData(): AppData {
  return {
    profile: readJson<UserProfile | undefined>(keys.userProfile, undefined),
    mealEntries: readJson<MealEntry[]>(keys.mealEntries, []),
    workoutEntries: readJson<WorkoutEntry[]>(keys.workoutEntries, []),
    bodyLogs: readJson<BodyLog[]>(keys.bodyLogs, []),
    mealTemplates: readJson<MealTemplate[]>(keys.mealTemplates, initialMealTemplates),
    customFoodPresets: readJson<FoodPreset[]>(keys.customFoodPresets, []),
    customWorkoutPresets: readJson<string[]>(keys.customWorkoutPresets, []),
    bodyTwinAppearance: readJson<BodyTwinAppearance | undefined>(keys.bodyTwinAppearance, undefined)
  };
}

export function saveProfile(profile: UserProfile) {
  writeJson(keys.userProfile, profile);
}

export function saveMealEntries(entries: MealEntry[]) {
  writeJson(keys.mealEntries, entries);
}

export function saveWorkoutEntries(entries: WorkoutEntry[]) {
  writeJson(keys.workoutEntries, entries);
}

export function saveBodyLogs(entries: BodyLog[]) {
  writeJson(keys.bodyLogs, entries);
}

export function saveMealTemplates(entries: MealTemplate[]) {
  writeJson(keys.mealTemplates, entries);
}

export function saveCustomFoodPresets(entries: FoodPreset[]) {
  writeJson(keys.customFoodPresets, entries);
}

export function saveCustomWorkoutPresets(entries: string[]) {
  writeJson(keys.customWorkoutPresets, entries);
}

export function saveBodyTwinAppearance(appearance: BodyTwinAppearance) {
  writeJson(keys.bodyTwinAppearance, appearance);
}
