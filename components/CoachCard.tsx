import { Sparkles } from "lucide-react";
import type { CoachAdvice } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";

type CoachCardProps = {
  advice: CoachAdvice;
};

export function CoachCard({ advice }: CoachCardProps) {
  return (
    <Card className="border-emerald-100 bg-coach">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center gap-2 text-sm font-black text-emerald-700">
          <Sparkles className="h-4 w-4" />
          今日のコーチ
        </div>
        <p className="text-base font-semibold leading-7 text-ink">{advice.todayReview}</p>
        <p className="text-sm leading-6 text-muted">{advice.encouragement}</p>
      </CardContent>
    </Card>
  );
}
