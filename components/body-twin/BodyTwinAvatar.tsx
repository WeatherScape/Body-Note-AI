import type { BodyTwinAppearance, BodyTwinAvatarVariant, BodyTwinStatus, TwinColorTheme } from "@/types/bodyTwin";
import { cn } from "@/lib/utils";

type BodyTwinAvatarProps = {
  appearance: BodyTwinAppearance;
  variant: BodyTwinAvatarVariant;
  status: BodyTwinStatus;
  level: number;
  fatBurnScore: number;
  muscleScore: number;
  recoveryScore: number;
  consistencyScore: number;
};

const variantAura = {
  burning: "from-amber-200 via-rose-100 to-white",
  muscle: "from-indigo-200 via-sky-100 to-white",
  recovery: "from-emerald-200 via-cyan-100 to-white",
  balanced: "from-sky-200 via-white to-emerald-100",
  support: "from-slate-200 via-blue-50 to-white"
};

const coreColors: Record<TwinColorTheme, string> = {
  mint: "#34d399",
  blue: "#60a5fa",
  violet: "#a78bfa",
  peach: "#fb7185",
  neutral: "#94a3b8"
};

function earShape(style: BodyTwinAppearance["hairStyle"], side: "left" | "right", fill: string) {
  const transform = side === "left" ? "" : "translate(220 0) scale(-1 1)";
  if (style === "medium") return <path d="M70 66 C42 76 36 110 58 128 C82 119 89 91 70 66 Z" fill={fill} transform={transform} />;
  if (style === "soft-bob") return <ellipse cx="64" cy="86" rx="22" ry="31" fill={fill} transform={side === "left" ? "translate(0 0)" : "translate(220 0) scale(-1 1)"} />;
  if (style === "wave") return <path d="M72 64 C50 54 34 76 42 99 C46 120 62 134 80 124 C67 105 67 84 72 64 Z" fill={fill} transform={transform} />;
  if (style === "none") return <path d="M75 70 C60 72 55 87 65 99 C76 96 82 82 75 70 Z" fill={fill} transform={transform} />;
  return <path d="M75 72 C56 45 35 58 48 94 C59 90 70 82 75 72 Z" fill={fill} transform={transform} />;
}

function eyes(type: BodyTwinAppearance["eyeType"]) {
  if (type === "calm") {
    return (
      <>
        <path d="M88 97 C96 91 104 91 112 97" stroke="#111827" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M132 97 C140 91 148 91 156 97" stroke="#111827" strokeWidth="5" strokeLinecap="round" fill="none" />
      </>
    );
  }
  if (type === "smile") {
    return (
      <>
        <path d="M88 95 C96 103 104 103 112 95" stroke="#111827" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M132 95 C140 103 148 103 156 95" stroke="#111827" strokeWidth="5" strokeLinecap="round" fill="none" />
      </>
    );
  }
  const radius = type === "round" ? 6 : 4.8;
  return (
    <>
      <circle cx="100" cy="96" r={radius} fill="#111827" />
      <circle cx="144" cy="96" r={radius} fill="#111827" />
      <circle cx="102" cy="94" r="1.8" fill="#fff" />
      <circle cx="146" cy="94" r="1.8" fill="#fff" />
    </>
  );
}

export function BodyTwinAvatar({ appearance, variant, status, level, fatBurnScore, muscleScore, recoveryScore, consistencyScore }: BodyTwinAvatarProps) {
  const fur = appearance.hairColor;
  const muzzle = appearance.skinTone;
  const collar = appearance.outfitColor;
  const coreColor = coreColors[appearance.coreColor];
  const glowOpacity = Math.max(fatBurnScore, muscleScore, recoveryScore, consistencyScore) / 100;
  const fluffy = appearance.bodyStyle === "soft";
  const energetic = appearance.bodyStyle === "energetic";
  const isHappy = status !== "support";

  return (
    <div className="relative mx-auto grid h-80 place-items-center overflow-hidden rounded-[2.25rem] bg-white/60 shadow-inner">
      <div className={cn("absolute inset-4 rounded-full bg-gradient-to-br blur-2xl body-twin-aura", variantAura[variant])} style={{ opacity: 0.58 + glowOpacity * 0.25 }} />
      <div className="absolute bottom-9 left-8 right-8 h-20 rounded-full bg-slate-900/10 blur-2xl" />
      <div className="absolute left-8 top-10 h-12 w-12 rounded-full bg-white/60 body-buddy-bubble" />
      <div className="absolute right-10 top-20 h-7 w-7 rounded-full bg-white/70 body-buddy-bubble-delayed" />
      {variant === "burning" && <span className="absolute left-9 top-28 text-2xl body-twin-float">✦</span>}
      {consistencyScore >= 82 && <span className="absolute right-6 top-6 rounded-full bg-white px-3 py-1 text-xs font-black text-amber-600 shadow-sm">★ Lv.{level}</span>}

      <div className={cn("relative body-buddy-wag", variant === "muscle" && "body-twin-pulse")}>
        <svg viewBox="0 0 240 270" className="h-72 w-64" role="img" aria-label="今日の相棒">
          <defs>
            <filter id="buddyShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="14" stdDeviation="12" floodOpacity="0.17" />
            </filter>
            <linearGradient id="buddyBelly" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f8fafc" />
            </linearGradient>
          </defs>

          <ellipse cx="122" cy="245" rx="64" ry="13" fill="#0f172a" opacity="0.09" />
          <path className="body-buddy-tail" d="M172 158 C218 134 218 196 182 187" stroke={fur} strokeWidth="18" strokeLinecap="round" fill="none" />
          <ellipse cx="122" cy="170" rx={fluffy ? 62 : 56} ry={energetic ? 58 : 64} fill={fur} filter="url(#buddyShadow)" />
          <ellipse cx="122" cy="185" rx="38" ry="42" fill="url(#buddyBelly)" opacity="0.72" />
          <path d="M79 195 C60 211 62 235 84 237" stroke={fur} strokeWidth="18" strokeLinecap="round" fill="none" />
          <path d="M165 195 C184 211 182 235 160 237" stroke={fur} strokeWidth="18" strokeLinecap="round" fill="none" />
          <path d="M100 218 C96 236 93 246 82 253" stroke={fur} strokeWidth="16" strokeLinecap="round" />
          <path d="M144 218 C148 236 151 246 162 253" stroke={fur} strokeWidth="16" strokeLinecap="round" />

          {earShape(appearance.hairStyle, "left", fur)}
          {earShape(appearance.hairStyle, "right", fur)}
          <circle cx="122" cy="92" r={fluffy ? 56 : 52} fill={fur} filter="url(#buddyShadow)" />
          <ellipse cx="122" cy="112" rx="31" ry="24" fill={muzzle} opacity="0.96" />
          {eyes(appearance.eyeType)}
          <path d="M118 111 C120 108 124 108 126 111 C126 116 118 116 118 111 Z" fill="#111827" />
          <path d={isHappy ? "M112 126 C120 135 132 135 140 126" : "M113 129 C121 124 131 124 139 129"} stroke="#111827" strokeWidth="4.5" strokeLinecap="round" fill="none" />
          <circle cx="82" cy="112" r="8" fill="#fb7185" opacity="0.22" />
          <circle cx="162" cy="112" r="8" fill="#fb7185" opacity="0.22" />

          <path d="M84 151 C103 161 141 161 160 151" stroke={collar} strokeWidth="13" strokeLinecap="round" />
          <circle cx="122" cy="162" r="16" fill="#fff" opacity="0.86" />
          <circle cx="122" cy="162" r="9" fill={coreColor} className="body-buddy-core" />
          <circle cx="122" cy="162" r="22" fill={coreColor} opacity={0.11 + glowOpacity * 0.2} />
        </svg>
      </div>
    </div>
  );
}
