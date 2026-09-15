import { useEffect, useRef } from "react";
import type { Accent } from "../content/portfolio";
import { isMotionReduced } from "../lib/motion";
type Frame = { x: number; y: number; width: number; height: number };
type Transition = { from: Frame; to: Frame; accent: Accent };
const colors = {
  red: "#e7372f",
  yellow: "#ffd33d",
  blue: "#2477ff",
  green: "#16b35c",
};
function frameOf(element: Element): Frame {
  const { x, y, width, height } = element.getBoundingClientRect();
  return { x, y, width, height };
}
export function reassemble(
  from: Element | null,
  to: Element | null = from,
  accent: Accent = "blue",
) {
  if (!from || !to || isMotionReduced()) return;
  window.dispatchEvent(
    new CustomEvent<Transition>("zinx:matter", {
      detail: { from: frameOf(from), to: frameOf(to), accent },
    }),
  );
}
function perimeter(frame: Frame, t: number) {
  let d = t * (frame.width + frame.height) * 2;
  if (d < frame.width) return { x: frame.x + d, y: frame.y };
  d -= frame.width;
  if (d < frame.height) return { x: frame.x + frame.width, y: frame.y + d };
  d -= frame.height;
  if (d < frame.width)
    return { x: frame.x + frame.width - d, y: frame.y + frame.height };
  return { x: frame.x, y: frame.y + frame.height - (d - frame.width) };
}
/** Particles originate on a real frame and settle onto another frame. */
export function PixelMatter() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    const clear = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      canvas.dataset.animationState = "idle";
    };
    const resize = () => {
      clear();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const start = (event: Event) => {
      clear();
      if (isMotionReduced() || document.hidden) return;
      const { from, to, accent } = (event as CustomEvent<Transition>).detail;
      if (to.y > innerHeight || to.y + to.height < 0) return;
      const count = innerWidth < 720 ? 64 : 144;
      const palette = Object.values(colors);
      const particles = Array.from({ length: count }, (_, i) => {
        const p = perimeter(from, i / count),
          q = perimeter(to, ((i + 12) % count) / count);
        const angle = Math.atan2(
          p.y - from.y - from.height / 2,
          p.x - from.x - from.width / 2,
        );
        const distance = 32 + ((i * 37) % 83);
        return {
          p,
          q,
          sx: p.x + Math.cos(angle) * distance,
          sy: p.y + Math.sin(angle) * distance,
          size: 3 + (i % 4),
          color: i % 3 ? colors[accent] : palette[i % 4],
          delay: (i % 9) * 8,
        };
      });
      const began = performance.now();
      canvas.dataset.animationState = "active";
      const render = (now: number) => {
        ctx.clearRect(0, 0, innerWidth, innerHeight);
        const elapsed = now - began;
        for (const particle of particles) {
          const t = Math.max(0, Math.min(1, (elapsed - particle.delay) / 1000));
          const spread = Math.min(1, t / 0.28),
            flow = Math.max(0, (t - 0.28) / 0.72);
          const a = 1 - Math.pow(1 - spread, 3),
            b = flow * flow * (3 - 2 * flow);
          const x =
            (particle.p.x + (particle.sx - particle.p.x) * a) * (1 - b) +
            particle.q.x * b;
          const y =
            (particle.p.y + (particle.sy - particle.p.y) * a) * (1 - b) +
            particle.q.y * b;
          ctx.globalAlpha = t < 0.82 ? 0.86 : (0.86 * (1 - t)) / 0.18;
          ctx.fillStyle = particle.color;
          ctx.fillRect(
            Math.round(x / 2) * 2,
            Math.round(y / 2) * 2,
            particle.size,
            particle.size,
          );
        }
        if (elapsed < 1100) raf = requestAnimationFrame(render);
        else clear();
      };
      raf = requestAnimationFrame(render);
    };
    resize();
    window.addEventListener("zinx:matter", start);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", clear);
    motion.addEventListener("change", clear);
    window.addEventListener("zinx:motion", clear);
    return () => {
      clear();
      window.removeEventListener("zinx:matter", start);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", clear);
      motion.removeEventListener("change", clear);
      window.removeEventListener("zinx:motion", clear);
    };
  }, []);
  return (
    <canvas
      ref={canvasRef}
      className="pixel-matter"
      aria-hidden="true"
      data-animation-state="idle"
    />
  );
}
