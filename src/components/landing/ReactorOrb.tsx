"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/cn";

// Three.js scene cannot SSR (touches window and WebGL). Dynamic import with ssr:false.
const GenerativeArtScene = dynamic(
  () =>
    import("@/components/ui/anomalous-matter-hero").then(
      (mod) => mod.GenerativeArtScene,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 rounded-full border-[0.5px] border-[#4FD1FF]/20 reactor-orb-glow" />
    ),
  },
);

interface ReactorOrbProps {
  size?: number;
  className?: string;
}

export function ReactorOrb({ size = 360, className }: ReactorOrbProps) {
  return (
    <div
      className={cn(
        "relative reactor-orb-glow rounded-full border-[0.5px] border-[#4FD1FF]/20 flex items-center justify-center",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <GenerativeArtScene />
      {/* Cardinal telemetry labels */}
      <span className="absolute -top-4 left-1/2 -translate-x-1/2 font-jetbrains-mono text-[10px] text-[#4FD1FF]/60 tracking-widest">
        N // 42.1002
      </span>
      <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 font-jetbrains-mono text-[10px] text-[#4FD1FF]/60 tracking-widest">
        S // 19.3402
      </span>
      <span className="absolute top-1/2 -left-16 -translate-y-1/2 font-jetbrains-mono text-[10px] text-[#4FD1FF]/60 tracking-widest">
        W // LVL_MAX
      </span>
      <span className="absolute top-1/2 -right-20 -translate-y-1/2 font-jetbrains-mono text-[10px] text-[#4FD1FF]/60 tracking-widest">
        E // SIG_STABLE
      </span>
    </div>
  );
}
