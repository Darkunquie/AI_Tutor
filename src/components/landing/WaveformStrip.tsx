import { cn } from "@/lib/cn";

interface WaveformStripProps {
  bars?: number;
  className?: string;
}

/**
 * 24 cyan bars with staggered CSS sine-wave scaleY animation driven via --i.
 * Each bar sets `--i` to its index; globals.css applies the keyframe with
 * `animation-delay: calc(var(--i) * 0.1s)`. Respects prefers-reduced-motion.
 */
export function WaveformStrip({ bars = 24, className }: WaveformStripProps) {
  return (
    <div
      aria-hidden
      className={cn("flex items-end gap-1 h-12 w-full", className)}
    >
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className="flex-1 bg-[#4FD1FF] hud-waveform-bar"
          style={{
            // Custom property drives the stagger in globals.css
            ["--i" as string]: i,
            // Initial height (percentage) — animation transforms scaleY
            height: "100%",
          }}
        />
      ))}
    </div>
  );
}
