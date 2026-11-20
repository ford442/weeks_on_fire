import { useEffect, useRef } from 'react';

import { drawSnake, prefersReducedMotion, spawnSnake, stepSnake, type Snake } from './laserSnake';

const SNAKE_COUNT = 4;

/**
 * Laser snakes — Episode 3 language for the public shell.
 * A fixed, pointer-events-none canvas behind the content: a few thin glowing
 * polylines (green/cyan halo, orange core) crawl on noise-ish sine paths,
 * fade out and respawn so they never pile up.
 *
 * Respects `prefers-reduced-motion` (renders nothing), pauses while the tab is
 * hidden, caps DPR at 2. No dependencies.
 */

export default function LaserSnakes() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    let snakes: Snake[] = [];
    let running = false;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      snakes = snakes.map((s) => {
        const margin = 80;
        const out = s.x < -margin || s.x > w + margin || s.y < -margin || s.y > h + margin;
        if (s.age < 0) {
          s.age += 1;
          return s;
        }
        if (s.age > s.life || (out && s.age > 60)) return spawnSnake(w, h);
        stepSnake(s);
        drawSnake(ctx, s);
        return s;
      });
      ctx.globalCompositeOperation = 'source-over';
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (running || document.hidden || prefersReducedMotion()) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, w, h);
    };

    resize();
    snakes = Array.from({ length: SNAKE_COUNT }, () => {
      const s = spawnSnake(w, h);
      // Stagger so they don't all arrive together.
      s.age = -Math.floor(Math.random() * 240);
      return s;
    });
    start();

    const onVisibility = () => (document.hidden ? stop() : start());
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const onMotion = () => (mq?.matches ? stop() : start());
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);
    mq?.addEventListener?.('change', onMotion);

    return () => {
      stop();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      mq?.removeEventListener?.('change', onMotion);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full motion-reduce:hidden"
    />
  );
}
