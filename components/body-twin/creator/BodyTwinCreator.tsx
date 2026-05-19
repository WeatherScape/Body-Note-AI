"use client";

import { ChevronRight, Sparkles } from "lucide-react";
import { useState } from "react";
import type { BodyTwinAppearance } from "@/types/bodyTwin";
import { defaultBodyTwinAppearance, normalizeBodyTwinAppearance } from "@/lib/bodyTwin/createBodyTwinConfig";
import { Button } from "@/components/ui/button";
import { BodyTwinCustomizer } from "@/components/body-twin/creator/BodyTwinCustomizer";
import { BodyTwinNameInput } from "@/components/body-twin/creator/BodyTwinNameInput";
import { BodyTwinPreview } from "@/components/body-twin/creator/BodyTwinPreview";
import { BodyTwinStepSelector } from "@/components/body-twin/creator/BodyTwinStepSelector";

type BodyTwinCreatorProps = {
  initialAppearance?: BodyTwinAppearance;
  onComplete: (appearance: BodyTwinAppearance) => void;
};

export function BodyTwinCreator({ initialAppearance, onComplete }: BodyTwinCreatorProps) {
  const [step, setStep] = useState(0);
  const [appearance, setAppearance] = useState<BodyTwinAppearance>(normalizeBodyTwinAppearance(initialAppearance ?? defaultBodyTwinAppearance));
  const isLastStep = step === 2;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-8 sm:max-w-xl">
      <div className="mb-5">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-950 text-white shadow-card">
          <Sparkles className="h-6 w-6" />
        </div>
        <p className="text-sm font-black text-blue-600">Body Buddy Creator</p>
        <h1 className="mt-2 text-4xl font-black tracking-normal text-slate-950">今日から一緒に育つ相棒をつくろう。</h1>
        <p className="mt-3 text-sm font-semibold leading-7 text-slate-500">食事・運動・回復を記録するほど、相棒の表情やオーラが変わります。まずは数秒でかわいいバディを作りましょう。</p>
      </div>

      <div className="space-y-4">
        <BodyTwinPreview appearance={appearance} />
        <BodyTwinStepSelector step={step} onStepChange={setStep} />
        {step === 2 ? (
          <BodyTwinNameInput appearance={appearance} onChange={setAppearance} />
        ) : (
          <BodyTwinCustomizer appearance={appearance} onChange={setAppearance} step={step} />
        )}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))}>
            戻る
          </Button>
          <Button
            onClick={() => {
              if (!isLastStep) {
                setStep((current) => current + 1);
                return;
              }
              onComplete(normalizeBodyTwinAppearance(appearance));
            }}
          >
            {isLastStep ? "この相棒と始める" : "次へ"}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </main>
  );
}
