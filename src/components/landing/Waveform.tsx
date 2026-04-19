'use client';

import { useMemo } from 'react';

/**
 * Layered sine-wave ribbon, amber on black — the hero background flourish.
 * Pure SVG + CSS, no runtime deps.
 */
export function Waveform() {
  const { paths, nodes } = useMemo(() => {
    const WIDTH = 1600;
    const HEIGHT = 560;
    const CENTER_Y = HEIGHT / 2;
    const LINES = 36;
    const STEPS = 220;

    // Data-node positions along the main line (x fractions)
    const NODE_X = [0.12, 0.23, 0.34, 0.44, 0.56, 0.68, 0.82, 0.93];

    // Generate a single sine-ish path — mild envelope so it peaks in the middle and tapers at the sides
    const buildPath = (
      amplitude: number,
      period: number,
      phase: number,
      yOffset: number,
    ) => {
      let d = '';
      for (let i = 0; i <= STEPS; i++) {
        const t = i / STEPS;
        const x = t * WIDTH;
        const envelope = Math.sin(t * Math.PI); // 0 at edges, 1 at middle
        const wobble =
          Math.sin((x / period) * Math.PI * 2 + phase) +
          0.35 * Math.sin((x / (period * 0.43)) * Math.PI * 2 + phase * 1.6);
        const y = CENTER_Y + yOffset + amplitude * envelope * wobble;
        d += `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(2)} `;
      }
      return d;
    };

    // Build ribbon — lines stacked with subtly varying amplitude, period, phase, y-offset
    const paths = Array.from({ length: LINES }, (_, i) => {
      const t = (i - LINES / 2) / (LINES / 2); // -1 … 1
      // Deterministic jitter — Math.random() would cause SSR/CSR hydration mismatch
      const amp = 110 * (1 - Math.abs(t) * 0.25) + Math.sin(i * 1.93) * 2;
      const period = 280 + i * 6;
      const phase = i * 0.22;
      const yOffset = t * 36; // spread vertically
      const opacity = 0.55 * (1 - Math.abs(t) * 0.7);
      const strokeWidth = 1 + (1 - Math.abs(t)) * 0.4;
      const duration = 11 + (i % 5) * 1.0;
      const delay = -i * 0.35;
      return {
        d: buildPath(amp, period, phase, yOffset),
        opacity,
        strokeWidth,
        duration,
        delay,
      };
    });

    // Node positions on the main (center-most) line
    const mainAmp = 110;
    const mainPeriod = 280 + 18 * 6;
    const mainPhase = 18 * 0.22;
    const nodes = NODE_X.map((fx, i) => {
      const x = fx * WIDTH;
      const t = fx;
      const envelope = Math.sin(t * Math.PI);
      const wobble =
        Math.sin((x / mainPeriod) * Math.PI * 2 + mainPhase) +
        0.35 * Math.sin((x / (mainPeriod * 0.43)) * Math.PI * 2 + mainPhase * 1.6);
      const y = CENTER_Y + mainAmp * envelope * wobble;
      // Realistic-looking decimal labels, pseudo-random but deterministic per index
      const label = (fx * 99.3 + i * 7.21).toFixed(2);
      return { x, y, label, i };
    });

    return { paths, nodes };
  }, []);

  return (
    <div aria-hidden className="waveform-root pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        viewBox="0 0 1600 560"
        preserveAspectRatio="xMidYMid slice"
        className="absolute left-1/2 top-1/2 h-[720px] w-[120vw] min-w-[1600px] -translate-x-1/2 -translate-y-1/2"
      >
        <defs>
          <linearGradient id="wv-grad" x1="0" x2="1" y1="0.5" y2="0.5">
            <stop offset="0%" stopColor="#D4A373" stopOpacity="0" />
            <stop offset="18%" stopColor="#D4A373" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#F2C38E" stopOpacity="1" />
            <stop offset="82%" stopColor="#D4A373" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#D4A373" stopOpacity="0" />
          </linearGradient>

          <radialGradient id="wv-core" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="#F2C38E" stopOpacity="0.22" />
            <stop offset="60%" stopColor="#D4A373" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#0E0E10" stopOpacity="0" />
          </radialGradient>

          <filter id="wv-glow" x="-10%" y="-50%" width="120%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur1" />
            <feMerge>
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="wv-glow-strong" x="-20%" y="-100%" width="140%" height="300%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
        </defs>

        {/* Soft amber halo behind the ribbon */}
        <rect x="0" y="0" width="1600" height="560" fill="url(#wv-core)" />

        {/* Blurred ghost ribbon for atmospheric glow */}
        <g filter="url(#wv-glow-strong)" opacity="0.5">
          {paths.slice(12, 24).map((p, i) => (
            <path
              key={`ghost-${i}`}
              d={p.d}
              stroke="#D4A373"
              strokeWidth={2}
              fill="none"
              opacity={0.25}
            />
          ))}
        </g>

        {/* Main ribbon */}
        <g filter="url(#wv-glow)">
          {paths.map((p, i) => (
            <path
              key={i}
              d={p.d}
              stroke="url(#wv-grad)"
              strokeWidth={p.strokeWidth}
              fill="none"
              opacity={p.opacity}
              className="wv-line"
              style={{
                animationDuration: `${p.duration}s`,
                animationDelay: `${p.delay}s`,
                transformOrigin: 'center',
              }}
            />
          ))}
        </g>

        {/* Data nodes */}
        <g>
          {nodes.map((n) => (
            <g key={n.i} transform={`translate(${n.x}, ${n.y})`}>
              {/* Connecting drop-line (subtle) */}
              <line
                x1="0"
                y1="0"
                x2="0"
                y2={n.y > 280 ? -60 : 60}
                stroke="#D4A373"
                strokeWidth="0.6"
                opacity="0.25"
              />
              {/* Node core */}
              <circle r="4" fill="#F2C38E" className="wv-node" />
              <circle r="8" fill="none" stroke="#D4A373" strokeWidth="0.8" opacity="0.4" />
              {/* Label */}
              <text
                x="10"
                y="3"
                fontSize="9"
                fontFamily="Geist, sans-serif"
                fill="#F2C38E"
                opacity="0.75"
                style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '0.04em' }}
              >
                {n.label}
              </text>
            </g>
          ))}
        </g>
      </svg>

      {/* Background bleed — fades the waveform into page bg top & bottom */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #0E0E10 0%, rgba(14,14,16,0.1) 22%, rgba(14,14,16,0) 50%, rgba(14,14,16,0.2) 72%, #0E0E10 100%)',
        }}
      />

      <style jsx>{`
        .wv-line {
          animation-name: wv-drift;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          will-change: transform, opacity;
        }
        .wv-node {
          animation: wv-pulse 2.8s ease-in-out infinite;
        }
        @keyframes wv-drift {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scaleY(1);
          }
          50% {
            transform: translate3d(-28px, -8px, 0) scaleY(1.05);
          }
        }
        @keyframes wv-pulse {
          0%,
          100% {
            opacity: 0.55;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.4);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .wv-line,
          .wv-node {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
