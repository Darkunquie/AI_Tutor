'use client';

import { useEffect, useRef } from 'react';

/**
 * Animated waveform — amber sine ribbons with floating data nodes.
 * Canvas-based for smooth rendering across all viewports.
 */
export function Waveform() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reduced motion check
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

    // Wave config
    const LINES = 28;
    const NODES = [
      { xFrac: 0.12, label: '1.92' },
      { xFrac: 0.23, label: '30.05' },
      { xFrac: 0.34, label: '48.18' },
      { xFrac: 0.44, label: '65.32' },
      { xFrac: 0.56, label: '84.45' },
      { xFrac: 0.68, label: '103.57' },
      { xFrac: 0.82, label: '124.69' },
    ];

    const draw = (time: number) => {
      const rect = canvas.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;
      const CY = H * 0.5;

      ctx.clearRect(0, 0, W, H);

      // Ambient glow — radial gradient behind ribbon
      const glow = ctx.createRadialGradient(W * 0.5, CY, 0, W * 0.5, CY, W * 0.4);
      glow.addColorStop(0, 'rgba(212, 163, 115, 0.12)');
      glow.addColorStop(0.5, 'rgba(212, 163, 115, 0.04)');
      glow.addColorStop(1, 'rgba(14, 14, 16, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      const t = prefersReduced ? 0 : time * 0.0003;

      // Draw ribbon lines
      for (let i = 0; i < LINES; i++) {
        const norm = (i - LINES / 2) / (LINES / 2); // -1 to 1
        const amp = H * 0.28 * (1 - Math.abs(norm) * 0.3);
        const period = W * 0.35 + i * W * 0.008;
        const phase = i * 0.25 + t;
        const yOff = norm * H * 0.06;
        const alpha = 0.45 * (1 - Math.abs(norm) * 0.65);
        const lineW = 0.8 + (1 - Math.abs(norm)) * 0.6;

        ctx.beginPath();
        const steps = Math.max(100, Math.floor(W / 4));

        for (let s = 0; s <= steps; s++) {
          const frac = s / steps;
          const x = frac * W;
          const envelope = Math.sin(frac * Math.PI);
          const wave =
            Math.sin((x / period) * Math.PI * 2 + phase) +
            0.3 * Math.sin((x / (period * 0.45)) * Math.PI * 2 + phase * 1.5);
          const y = CY + yOff + amp * envelope * wave;

          if (s === 0) { ctx.moveTo(x, y); }
          else { ctx.lineTo(x, y); }
        }

        // Gradient stroke — fade at edges
        const grad = ctx.createLinearGradient(0, 0, W, 0);
        grad.addColorStop(0, 'rgba(212, 163, 115, 0)');
        grad.addColorStop(0.15, `rgba(212, 163, 115, ${alpha})`);
        grad.addColorStop(0.5, `rgba(242, 195, 142, ${alpha * 1.3})`);
        grad.addColorStop(0.85, `rgba(212, 163, 115, ${alpha})`);
        grad.addColorStop(1, 'rgba(212, 163, 115, 0)');

        ctx.strokeStyle = grad;
        ctx.lineWidth = lineW;
        ctx.stroke();
      }

      // Wide soft glow layer — atmospheric bloom
      ctx.save();
      ctx.filter = 'blur(18px)';
      for (let i = 8; i < 20; i++) {
        const norm = (i - LINES / 2) / (LINES / 2);
        const amp = H * 0.28 * (1 - Math.abs(norm) * 0.3);
        const period = W * 0.35 + i * W * 0.008;
        const phase = i * 0.25 + t;
        const yOff = norm * H * 0.06;

        ctx.beginPath();
        const steps = Math.max(60, Math.floor(W / 6));
        for (let s = 0; s <= steps; s++) {
          const frac = s / steps;
          const x = frac * W;
          const envelope = Math.sin(frac * Math.PI);
          const wave =
            Math.sin((x / period) * Math.PI * 2 + phase) +
            0.3 * Math.sin((x / (period * 0.45)) * Math.PI * 2 + phase * 1.5);
          const y = CY + yOff + amp * envelope * wave;
          if (s === 0) { ctx.moveTo(x, y); }
          else { ctx.lineTo(x, y); }
        }
        ctx.strokeStyle = 'rgba(212, 163, 115, 0.08)';
        ctx.lineWidth = 6;
        ctx.stroke();
      }
      ctx.restore();

      // Tight glow layer — sharper bloom on center lines
      ctx.save();
      ctx.filter = 'blur(4px)';
      for (let i = 11; i < 17; i++) {
        const norm = (i - LINES / 2) / (LINES / 2);
        const amp = H * 0.28 * (1 - Math.abs(norm) * 0.3);
        const period = W * 0.35 + i * W * 0.008;
        const phase = i * 0.25 + t;
        const yOff = norm * H * 0.06;

        ctx.beginPath();
        const steps = Math.max(60, Math.floor(W / 6));
        for (let s = 0; s <= steps; s++) {
          const frac = s / steps;
          const x = frac * W;
          const envelope = Math.sin(frac * Math.PI);
          const wave =
            Math.sin((x / period) * Math.PI * 2 + phase) +
            0.3 * Math.sin((x / (period * 0.45)) * Math.PI * 2 + phase * 1.5);
          const y = CY + yOff + amp * envelope * wave;
          if (s === 0) { ctx.moveTo(x, y); }
          else { ctx.lineTo(x, y); }
        }
        ctx.strokeStyle = 'rgba(242, 195, 142, 0.18)';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
      ctx.restore();

      // Data nodes — positioned on center line
      const centerAmp = H * 0.28;
      const centerPeriod = W * 0.35 + 14 * W * 0.008;
      const centerPhase = 14 * 0.25 + t;

      for (const node of NODES) {
        const x = node.xFrac * W;
        const envelope = Math.sin(node.xFrac * Math.PI);
        const wave =
          Math.sin((x / centerPeriod) * Math.PI * 2 + centerPhase) +
          0.3 * Math.sin((x / (centerPeriod * 0.45)) * Math.PI * 2 + centerPhase * 1.5);
        const y = CY + centerAmp * envelope * wave;

        const pulse = prefersReduced ? 1 : 0.7 + 0.3 * Math.sin(time * 0.002 + node.xFrac * 10);

        // Node halo glow — soft radial bloom
        const halo = ctx.createRadialGradient(x, y, 0, x, y, 28 * pulse);
        halo.addColorStop(0, `rgba(242, 195, 142, ${0.25 * pulse})`);
        halo.addColorStop(0.4, `rgba(212, 163, 115, ${0.08 * pulse})`);
        halo.addColorStop(1, 'rgba(212, 163, 115, 0)');
        ctx.fillStyle = halo;
        ctx.fillRect(x - 30, y - 30, 60, 60);

        // Drop line
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + (y > CY ? -50 : 50));
        ctx.strokeStyle = 'rgba(212, 163, 115, 0.25)';
        ctx.lineWidth = 0.6;
        ctx.stroke();

        // Outer ring — pulse size
        ctx.beginPath();
        ctx.arc(x, y, 6 + 2 * pulse, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(212, 163, 115, ${0.25 + 0.15 * pulse})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();

        // Inner dot — bright pulse
        ctx.beginPath();
        ctx.arc(x, y, 3.5 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(242, 195, 142, ${0.7 + 0.3 * pulse})`;
        ctx.fill();

        // Label
        ctx.font = '9px Geist, system-ui, sans-serif';
        ctx.fillStyle = 'rgba(242, 195, 142, 0.7)';
        ctx.fillText(node.label, x + 12, y + 3);
      }

      // Edge fade — top and bottom blend into page background
      const fadeTop = ctx.createLinearGradient(0, 0, 0, H);
      fadeTop.addColorStop(0, 'rgba(14, 14, 16, 1)');
      fadeTop.addColorStop(0.18, 'rgba(14, 14, 16, 0.3)');
      fadeTop.addColorStop(0.4, 'rgba(14, 14, 16, 0)');
      fadeTop.addColorStop(0.6, 'rgba(14, 14, 16, 0)');
      fadeTop.addColorStop(0.82, 'rgba(14, 14, 16, 0.3)');
      fadeTop.addColorStop(1, 'rgba(14, 14, 16, 1)');
      ctx.fillStyle = fadeTop;
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
