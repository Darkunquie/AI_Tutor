'use client';

import { useEffect, useRef } from 'react';

/**
 * Animated waveform — amber sine ribbons with floating data nodes.
 * Canvas-based, optimized for 60fps.
 */
export function Waveform() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) { return; }
    const ctx = canvas.getContext('2d');
    if (!ctx) { return; }

    const prefersReduced = globalThis.window?.matchMedia?.(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    let W = 0;
    let H = 0;
    let CY = 0;

    const resize = () => {
      const dpr = Math.min(globalThis.window?.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      CY = H * 0.5;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    globalThis.window?.addEventListener('resize', resize);

    const LINES = 16;
    const NODES = [
      { xFrac: 0.15, label: '1.92' },
      { xFrac: 0.30, label: '30.05' },
      { xFrac: 0.45, label: '48.18' },
      { xFrac: 0.60, label: '65.32' },
      { xFrac: 0.75, label: '84.45' },
      { xFrac: 0.90, label: '103.57' },
    ];

    const draw = (time: number) => {
      ctx.clearRect(0, 0, W, H);
      const t = prefersReduced ? 0 : time * 0.00025;
      const steps = Math.min(80, Math.floor(W / 8));

      // Ambient glow
      const glow = ctx.createRadialGradient(W * 0.5, CY, 0, W * 0.5, CY, W * 0.35);
      glow.addColorStop(0, 'rgba(212, 163, 115, 0.10)');
      glow.addColorStop(1, 'rgba(14, 14, 16, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      // Ribbon lines
      for (let i = 0; i < LINES; i++) {
        const norm = (i - LINES / 2) / (LINES / 2);
        const amp = H * 0.22 * (1 - Math.abs(norm) * 0.35);
        const period = W * 0.38 + i * W * 0.01;
        const phase = i * 0.28 + t;
        const yOff = norm * H * 0.05;
        const alpha = 0.35 * (1 - Math.abs(norm) * 0.6);

        ctx.beginPath();
        for (let s = 0; s <= steps; s++) {
          const frac = s / steps;
          const x = frac * W;
          const envelope = Math.sin(frac * Math.PI);
          const wave = Math.sin((x / period) * 6.283 + phase)
            + 0.25 * Math.sin((x / (period * 0.48)) * 6.283 + phase * 1.4);
          const y = CY + yOff + amp * envelope * wave;
          if (s === 0) { ctx.moveTo(x, y); }
          else { ctx.lineTo(x, y); }
        }

        // Single color stroke — avoids per-frame gradient creation
        const brightness = Math.abs(norm) < 0.3 ? 242 : 212;
        ctx.strokeStyle = `rgba(${brightness}, ${brightness === 242 ? 195 : 163}, ${brightness === 242 ? 142 : 115}, ${alpha})`;
        ctx.lineWidth = 0.6 + (1 - Math.abs(norm)) * 0.5;
        ctx.stroke();
      }

      // Center glow lines (no blur filter — just thicker + more opaque)
      for (let i = 6; i < 10; i++) {
        const norm = (i - LINES / 2) / (LINES / 2);
        const amp = H * 0.22 * (1 - Math.abs(norm) * 0.35);
        const period = W * 0.38 + i * W * 0.01;
        const phase = i * 0.28 + t;
        const yOff = norm * H * 0.05;

        ctx.beginPath();
        for (let s = 0; s <= steps; s++) {
          const frac = s / steps;
          const x = frac * W;
          const envelope = Math.sin(frac * Math.PI);
          const wave = Math.sin((x / period) * 6.283 + phase)
            + 0.25 * Math.sin((x / (period * 0.48)) * 6.283 + phase * 1.4);
          const y = CY + yOff + amp * envelope * wave;
          if (s === 0) { ctx.moveTo(x, y); }
          else { ctx.lineTo(x, y); }
        }
        ctx.strokeStyle = 'rgba(242, 195, 142, 0.08)';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Data nodes
      const cAmp = H * 0.22;
      const cPeriod = W * 0.38 + 8 * W * 0.01;
      const cPhase = 8 * 0.28 + t;

      for (const node of NODES) {
        const x = node.xFrac * W;
        const envelope = Math.sin(node.xFrac * Math.PI);
        const wave = Math.sin((x / cPeriod) * 6.283 + cPhase)
          + 0.25 * Math.sin((x / (cPeriod * 0.48)) * 6.283 + cPhase * 1.4);
        const y = CY + cAmp * envelope * wave;
        const pulse = prefersReduced ? 1 : 0.7 + 0.3 * Math.sin(time * 0.002 + node.xFrac * 10);

        // Drop line
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + (y > CY ? -40 : 40));
        ctx.strokeStyle = 'rgba(212, 163, 115, 0.18)';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // Ring
        ctx.beginPath();
        ctx.arc(x, y, 5 + pulse * 2, 0, 6.283);
        ctx.strokeStyle = `rgba(212, 163, 115, ${0.2 + 0.1 * pulse})`;
        ctx.lineWidth = 0.7;
        ctx.stroke();

        // Dot
        ctx.beginPath();
        ctx.arc(x, y, 2.5 * pulse, 0, 6.283);
        ctx.fillStyle = `rgba(242, 195, 142, ${0.6 + 0.3 * pulse})`;
        ctx.fill();

        // Label
        ctx.font = '9px Geist, system-ui, sans-serif';
        ctx.fillStyle = 'rgba(242, 195, 142, 0.6)';
        ctx.fillText(node.label, x + 10, y + 3);
      }

      // Edge fade
      const fade = ctx.createLinearGradient(0, 0, 0, H);
      fade.addColorStop(0, 'rgba(14, 14, 16, 1)');
      fade.addColorStop(0.2, 'rgba(14, 14, 16, 0)');
      fade.addColorStop(0.8, 'rgba(14, 14, 16, 0)');
      fade.addColorStop(1, 'rgba(14, 14, 16, 1)');
      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, W, H);

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animRef.current);
      globalThis.window?.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
