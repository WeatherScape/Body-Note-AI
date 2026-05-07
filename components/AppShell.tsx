"use client";

import type React from "react";
import { BarChart3, Bot, Dumbbell, Home, PlusCircle, Soup } from "lucide-react";
import { cn } from "@/lib/utils";

export type TabKey = "dashboard" | "quick" | "meals" | "workouts" | "progress" | "coach";

const tabs: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "dashboard", label: "今日", icon: Home },
  { key: "quick", label: "記録", icon: PlusCircle },
  { key: "meals", label: "食事", icon: Soup },
  { key: "workouts", label: "筋トレ", icon: Dumbbell },
  { key: "progress", label: "進捗", icon: BarChart3 },
  { key: "coach", label: "コーチ", icon: Bot }
];

type AppShellProps = {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  children: React.ReactNode;
};

export function AppShell({ activeTab, onTabChange, children }: AppShellProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-28 pt-5 sm:max-w-xl">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">BodyNote AI</p>
          <h1 className="text-2xl font-black tracking-normal text-ink">今日の体づくり</h1>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-card">
          <Bot className="h-5 w-5 text-apple" />
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-gray-200/80 bg-white/92 px-2 pb-2 pt-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl">
        <div className="mx-auto grid max-w-md grid-cols-6 gap-1 sm:max-w-xl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                aria-label={tab.label}
                onClick={() => onTabChange(tab.key)}
                className={cn(
                  "flex h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-bold transition",
                  active ? "bg-ink text-white shadow-card" : "text-gray-500 hover:bg-gray-100"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
