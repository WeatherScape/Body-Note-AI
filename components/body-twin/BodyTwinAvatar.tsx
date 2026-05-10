import type { BodyTwinAvatarVariant, BodyTwinStatus } from "@/types/bodyTwin";
import { cn } from "@/lib/utils";

type BodyTwinAvatarProps = {
  variant: BodyTwinAvatarVariant;
  status: BodyTwinStatus;
  level: number;
  fatBurnScore: number;
  muscleScore: number;
  recoveryScore: number;
  consistencyScore: number;
};

const variantAura = {
  burning: "from-amber-200 via-orange-100 to-white",
  muscle: "from-indigo-200 via-blue-100 to-white",
  recovery: "from-emerald-200 via-cyan-100 to-white",
  balanced: "from-sky-200 via-white to-emerald-100",
  support: "from-slate-200 via-blue-50 to-white"
};

export function BodyTwinAvatar({ variant, status, level, fatBurnScore, muscleScore, recoveryScore, consistencyScore }: BodyTwinAvatarProps) {
  const isMuscle = variant === "muscle";
  const isSupport = variant === "support";
  const bodyWidth = 82 - Math.min(12, Math.max(0, fatBurnScore - 72) / 3);
  const shoulderWidth = 92 + Math.min(14, Math.max(0, muscleScore - 72) / 2);
  const glowOpacity = Math.max(fatBurnScore, muscleScore, recoveryScore, consistencyScore) / 100;

  return (
    <div className="relative mx-auto grid h-72 place-items-center overflow-hidden rounded-[2rem] bg-white/58 shadow-inner">
      <div className={cn("absolute inset-5 rounded-full bg-gradient-to-br blur-2xl body-twin-aura", variantAura[variant])} style={{ opacity: 0.55 + glowOpacity * 0.24 }} />
      <div className={cn("absolute inset-x-10 bottom-9 h-20 rounded-full blur-2xl", variant === "support" ? "bg-blue-200/40" : "bg-emerald-200/50")} />
      {variant === "burning" && (
        <>
          <span className="absolute left-10 top-16 text-2xl body-twin-float">✦</span>
          <span className="absolute right-12 top-24 text-3xl body-twin-float-delayed">✧</span>
        </>
      )}
      {consistencyScore >= 82 && <span className="absolute right-7 top-7 rounded-full bg-white px-3 py-1 text-xs font-black text-amber-600 shadow-sm">★ Lv.{level}</span>}
      <div className={cn("relative body-twin-breathe", isMuscle && "body-twin-pulse")}>
        <svg viewBox="0 0 220 260" className="h-64 w-56" role="img" aria-label="今日のBody Twin">
          <defs>
            <linearGradient id="twinBody" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor={isSupport ? "#dbeafe" : "#f8fafc"} />
              <stop offset="100%" stopColor={variant === "recovery" ? "#ccfbf1" : variant === "muscle" ? "#dbeafe" : "#e0f2fe"} />
            </linearGradient>
            <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="12" stdDeviation="10" floodOpacity="0.16" />
            </filter>
          </defs>
          <ellipse cx="110" cy="232" rx="58" ry="12" fill="#0f172a" opacity="0.08" />
          <path d={`M${110 - shoulderWidth / 2} 122 C78 132 70 170 80 214 C95 228 125 230 140 214 C150 169 142 132 ${110 + shoulderWidth / 2} 122 Z`} fill="url(#twinBody)" filter="url(#softShadow)" />
          <path d={`M${110 - bodyWidth / 2} 126 C92 154 91 194 103 218 C108 222 112 222 117 218 C129 194 128 154 ${110 + bodyWidth / 2} 126 Z`} fill="#ffffff" opacity="0.48" />
          <path d="M75 134 C49 151 43 181 54 202" stroke="#dbeafe" strokeWidth={isMuscle ? 17 : 14} strokeLinecap="round" />
          <path d="M145 134 C171 151 177 181 166 202" stroke="#dbeafe" strokeWidth={isMuscle ? 17 : 14} strokeLinecap="round" />
          <path d="M94 214 C91 232 90 242 82 250" stroke="#dbeafe" strokeWidth="15" strokeLinecap="round" />
          <path d="M126 214 C129 232 130 242 138 250" stroke="#dbeafe" strokeWidth="15" strokeLinecap="round" />
          <circle cx="110" cy="72" r="42" fill="#f8fafc" filter="url(#softShadow)" />
          <circle cx="94" cy="70" r="4" fill="#111827" />
          <circle cx="126" cy="70" r="4" fill="#111827" />
          <path d={status === "support" ? "M96 91 C105 86 116 86 125 91" : "M95 90 C104 100 118 100 127 90"} stroke="#111827" strokeWidth="5" strokeLinecap="round" fill="none" />
          <circle cx="74" cy="82" r="7" fill="#bae6fd" opacity={variant === "recovery" ? 1 : 0.55} />
          <circle cx="146" cy="82" r="7" fill="#fed7aa" opacity={variant === "burning" ? 1 : 0.55} />
          <circle cx="110" cy="161" r="22" fill={variant === "support" ? "#93c5fd" : "#34d399"} opacity={0.18 + glowOpacity * 0.28} />
        </svg>
      </div>
    </div>
  );
}
