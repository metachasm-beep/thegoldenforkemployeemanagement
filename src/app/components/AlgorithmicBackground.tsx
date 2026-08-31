'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { usePathname } from 'next/navigation';

export default function AlgorithmicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let t = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // Determine target progress (simulated algorithmic input based on time of day)
    const hour = new Date().getHours();
    
    // Day progress (0 to 1)
    const timeProgress = (hour * 60 + new Date().getMinutes()) / (24 * 60);

    const render = () => {
      t += 0.002;
      const w = canvas.width;
      const h = canvas.height;

      // Base colors change depending on theme and time of day
      const isDark = theme === 'dark';
      
      ctx.clearRect(0, 0, w, h);
      
      // We will draw a few large blurred circles that move organically
      const drawOrb = (cx: number, cy: number, r: number, color: string) => {
        ctx.beginPath();
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      };

      // Organic math for coordinates
      const x1 = w * 0.5 + Math.sin(t * 0.8) * w * 0.3;
      const y1 = h * 0.5 + Math.cos(t * 1.2) * h * 0.3;
      
      const x2 = w * 0.8 + Math.cos(t * 0.5) * w * 0.2;
      const y2 = h * 0.2 + Math.sin(t * 0.9) * h * 0.4;
      
      const x3 = w * 0.2 + Math.sin(t * 1.5) * w * 0.3;
      const y3 = h * 0.8 + Math.cos(t * 0.7) * h * 0.2;

      // Generate colors based on theme and time progress
      const hue1 = isDark ? 230 : 210 + timeProgress * 20; // Blues
      const hue2 = isDark ? 280 : 340 + timeProgress * 30; // Purples/Pinks
      const hue3 = isDark ? 180 : 40 + timeProgress * 10;  // Teals/Ambers

      const alpha = isDark ? 0.15 : 0.4;

      ctx.globalCompositeOperation = isDark ? 'screen' : 'multiply';
      
      drawOrb(x1, y1, w * 0.6, `hsla(${hue1}, 80%, 60%, ${alpha})`);
      drawOrb(x2, y2, w * 0.5, `hsla(${hue2}, 70%, 55%, ${alpha})`);
      drawOrb(x3, y3, w * 0.7, `hsla(${hue3}, 90%, 65%, ${alpha})`);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mounted, theme, pathname]);

  if (!mounted) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-40 mix-blend-normal transition-opacity duration-1000"
      style={{ filter: 'blur(60px)' }}
    />
  );
}
