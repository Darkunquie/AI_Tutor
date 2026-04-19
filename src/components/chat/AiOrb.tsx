'use client';

import { useEffect, useRef } from 'react';

type OrbState = 'idle' | 'speaking' | 'thinking' | 'listening';

interface AiOrbProps {
  state: OrbState;
  size?: number;
  className?: string;
}

/**
 * Jarvis-style AI orb — glowing amber sphere that reacts to state.
 * idle: gentle breathing pulse
 * speaking: energetic ripples radiating outward
 * thinking: rotating inner ring + faster pulse
 * listening: subtle waveform response
 */
export function AiOrb({ state, size = 120, className = '' }: AiOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = globalThis.window?.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const baseRadius = size * 0.22;

    const draw = (time: number) => {
      ctx.clearRect(0, 0, size, size);
      const t = time * 0.001;

      // ── Outer glow halo ──
      const glowRadius = baseRadius * (state === 'speaking' ? 2.8 : state === 'thinking' ? 2.2 : 1.8);
      const glowPulse = state === 'speaking'
        ? 0.4 + 0.3 * Math.sin(t * 6)
        : state === 'thinking'
          ? 0.3 + 0.15 * Math.sin(t * 4)
          : 0.15 + 0.08 * Math.sin(t * 1.5);

      const outerGlow = ctx.createRadialGradient(cx, cy, baseRadius * 0.5, cx, cy, glowRadius);
      outerGlow.addColorStop(0, `rgba(242, 195, 142, ${glowPulse * 0.6})`);
      outerGlow.addColorStop(0.4, `rgba(212, 163, 115, ${glowPulse * 0.3})`);
      outerGlow.addColorStop(0.7, `rgba(212, 163, 115, ${glowPulse * 0.1})`);
      outerGlow.addColorStop(1, 'rgba(212, 163, 115, 0)');
      ctx.fillStyle = outerGlow;
      ctx.fillRect(0, 0, size, size);

      // ── Speaking: radiating ripple rings ──
      if (state === 'speaking') {
        for (let i = 0; i < 3; i++) {
          const rippleT = ((t * 2 + i * 0.8) % 2.4) / 2.4;
          const rippleR = baseRadius * (1.2 + rippleT * 1.6);
          const rippleAlpha = (1 - rippleT) * 0.25;
          ctx.beginPath();
          ctx.arc(cx, cy, rippleR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(242, 195, 142, ${rippleAlpha})`;
          ctx.lineWidth = 1.5 * (1 - rippleT);
          ctx.stroke();
        }
      }

      // ── Thinking: rotating orbital rings ──
      if (state === 'thinking') {
        ctx.save();
        ctx.translate(cx, cy);
        for (let i = 0; i < 2; i++) {
          ctx.save();
          ctx.rotate(t * (1.5 + i * 0.7) + i * Math.PI * 0.6);
          ctx.beginPath();
          ctx.ellipse(0, 0, baseRadius * 1.5, baseRadius * 0.4, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(212, 163, 115, ${0.2 + 0.1 * Math.sin(t * 3 + i)})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
          // Orbiting dot
          const dotAngle = t * (2 + i * 0.5);
          const dotX = Math.cos(dotAngle) * baseRadius * 1.5;
          const dotY = Math.sin(dotAngle) * baseRadius * 0.4;
          ctx.beginPath();
          ctx.arc(dotX, dotY, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(242, 195, 142, ${0.6 + 0.4 * Math.sin(t * 4)})`;
          ctx.fill();
          ctx.restore();
        }
        ctx.restore();
      }

      // ── Listening: subtle waveform ring ──
      if (state === 'listening') {
        ctx.beginPath();
        const segments = 60;
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2;
          const wobble = Math.sin(angle * 6 + t * 4) * baseRadius * 0.08
            + Math.sin(angle * 3 + t * 2.5) * baseRadius * 0.05;
          const r = baseRadius * 1.3 + wobble;
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          if (i === 0) { ctx.moveTo(x, y); }
          else { ctx.lineTo(x, y); }
        }
        ctx.closePath();
        ctx.strokeStyle = 'rgba(212, 163, 115, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // ── Core orb — layered gradients ──
      const breathe = state === 'speaking'
        ? 1 + 0.08 * Math.sin(t * 8) + 0.04 * Math.sin(t * 13)
        : state === 'thinking'
          ? 1 + 0.05 * Math.sin(t * 5)
          : 1 + 0.03 * Math.sin(t * 1.8);

      const coreR = baseRadius * breathe;

      // Outer shell
      const shell = ctx.createRadialGradient(cx, cy, coreR * 0.2, cx, cy, coreR);
      shell.addColorStop(0, 'rgba(255, 220, 180, 0.95)');
      shell.addColorStop(0.3, 'rgba(242, 195, 142, 0.85)');
      shell.addColorStop(0.6, 'rgba(212, 163, 115, 0.7)');
      shell.addColorStop(0.85, 'rgba(180, 130, 85, 0.4)');
      shell.addColorStop(1, 'rgba(160, 110, 65, 0.1)');
      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx.fillStyle = shell;
      ctx.fill();

      // Inner bright core
      const core = ctx.createRadialGradient(cx - coreR * 0.15, cy - coreR * 0.15, 0, cx, cy, coreR * 0.6);
      core.addColorStop(0, 'rgba(255, 240, 220, 0.9)');
      core.addColorStop(0.5, 'rgba(255, 220, 180, 0.4)');
      core.addColorStop(1, 'rgba(242, 195, 142, 0)');
      ctx.beginPath();
      ctx.arc(cx, cy, coreR * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = core;
      ctx.fill();

      // Specular highlight — top-left
      const spec = ctx.createRadialGradient(
        cx - coreR * 0.25, cy - coreR * 0.3, 0,
        cx - coreR * 0.2, cy - coreR * 0.2, coreR * 0.4
      );
      spec.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
      spec.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
      spec.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.beginPath();
      ctx.arc(cx - coreR * 0.2, cy - coreR * 0.2, coreR * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = spec;
      ctx.fill();

      // ── Speaking: surface energy particles ──
      if (state === 'speaking') {
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2 + t * 1.5;
          const dist = coreR * (0.9 + 0.3 * Math.sin(t * 6 + i * 1.2));
          const px = cx + Math.cos(angle) * dist;
          const py = cy + Math.sin(angle) * dist;
          const pSize = 1.5 + Math.sin(t * 8 + i) * 0.8;
          ctx.beginPath();
          ctx.arc(px, py, pSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 230, 190, ${0.4 + 0.3 * Math.sin(t * 5 + i * 0.7)})`;
          ctx.fill();
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [state, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className={`block ${className}`}
      aria-label={`AI assistant — ${state}`}
    />
  );
}
