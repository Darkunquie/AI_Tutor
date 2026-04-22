'use client';

import { useEffect, useRef } from 'react';

interface ChatWaveformProps {
  /** Whether AI is actively speaking/streaming — makes waves more energetic */
  active?: boolean;
}

/**
 * Subtle ambient waveform background for the chat area.
 * Lighter than the landing page version — sits behind messages.
 */
export function ChatWaveform({ active = false }: ChatWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReduced = globalThis.window?.matchMedia?.(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const resize = () => {
      const dpr = globalThis.window?.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    globalThis.window?.addEventListener('resize', resize);

    const LINES = 12;

    const draw = (time: number) => {
      const rect = canvas.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;
      const CY = H * 0.5;

      ctx.clearRect(0, 0, W, H);

      const t = prefersReduced ? 0 : time * 0.0002;
      const intensity = active ? 1.5 : 1;

      // Subtle ambient glow
      const glow = ctx.createRadialGradient(W * 0.5, CY, 0, W * 0.5, CY, W * 0.35);
      glow.addColorStop(0, `rgba(79, 209, 255, ${0.04 * intensity})`);
      glow.addColorStop(1, 'rgba(13, 19, 27, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      // Draw sine ribbon
      for (let i = 0; i < LINES; i++) {
        const norm = (i - LINES / 2) / (LINES / 2);
        const amp = H * 0.15 * intensity * (1 - Math.abs(norm) * 0.4);
        const period = W * 0.4 + i * W * 0.012;
        const phase = i * 0.3 + t * (active ? 3 : 1);
        const yOff = norm * H * 0.08;
        const alpha = (active ? 0.12 : 0.06) * (1 - Math.abs(norm) * 0.6);

        ctx.beginPath();
        const steps = Math.max(60, Math.floor(W / 6));

        for (let s = 0; s <= steps; s++) {
          const frac = s / steps;
          const x = frac * W;
          const envelope = Math.sin(frac * Math.PI);
          const wave = Math.sin((x / period) * Math.PI * 2 + phase)
            + 0.25 * Math.sin((x / (period * 0.5)) * Math.PI * 2 + phase * 1.3);
          const y = CY + yOff + amp * envelope * wave;

          if (s === 0) { ctx.moveTo(x, y); }
          else { ctx.lineTo(x, y); }
        }

        const grad = ctx.createLinearGradient(0, 0, W, 0);
        grad.addColorStop(0, 'rgba(79, 209, 255, 0)');
        grad.addColorStop(0.2, `rgba(79, 209, 255, ${alpha})`);
        grad.addColorStop(0.5, `rgba(79, 209, 255, ${alpha * 1.4})`);
        grad.addColorStop(0.8, `rgba(79, 209, 255, ${alpha})`);
        grad.addColorStop(1, 'rgba(79, 209, 255, 0)');

        ctx.strokeStyle = grad;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // Soft glow on center lines
      if (active) {
        ctx.save();
        ctx.filter = 'blur(8px)';
        for (let i = 4; i < 8; i++) {
          const norm = (i - LINES / 2) / (LINES / 2);
          const amp = H * 0.15 * intensity * (1 - Math.abs(norm) * 0.4);
          const period = W * 0.4 + i * W * 0.012;
          const phase = i * 0.3 + t * 3;
          const yOff = norm * H * 0.08;

          ctx.beginPath();
          const steps = Math.max(40, Math.floor(W / 8));
          for (let s = 0; s <= steps; s++) {
            const frac = s / steps;
            const x = frac * W;
            const envelope = Math.sin(frac * Math.PI);
            const wave = Math.sin((x / period) * Math.PI * 2 + phase);
            const y = CY + yOff + amp * envelope * wave;
            if (s === 0) { ctx.moveTo(x, y); }
            else { ctx.lineTo(x, y); }
          }
          ctx.strokeStyle = 'rgba(79, 209, 255, 0.06)';
          ctx.lineWidth = 3;
          ctx.stroke();
        }
        ctx.restore();
      }

      // Edge fade
      const fade = ctx.createLinearGradient(0, 0, 0, H);
      fade.addColorStop(0, 'rgba(13, 19, 27, 0.8)');
      fade.addColorStop(0.15, 'rgba(13, 19, 27, 0)');
      fade.addColorStop(0.85, 'rgba(13, 19, 27, 0)');
      fade.addColorStop(1, 'rgba(13, 19, 27, 0.8)');
      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, W, H);

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      globalThis.window?.removeEventListener('resize', resize);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
