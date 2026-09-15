import { useEffect, useId, useRef, useState } from "react";
import { yyAppearance } from "../content/portfolio";
import { useReducedMotion } from "../lib/motion";
import { reassemble } from "./PixelMatter";
import parts from "../vendor/yy/base-parts.json";
import { DailyYellowHat } from "../vendor/yy/wardrobe/daily-outing/components/DailyYellowHat";
import { DailyRedScarf } from "../vendor/yy/wardrobe/daily-outing/components/DailyRedScarf";
import { DailyStarSticker } from "../vendor/yy/wardrobe/daily-outing/components/DailyStarSticker";
import "../vendor/yy/dance.css";
import "./YYCompanion.css";

export function YYCompanion() {
  const root = useRef<HTMLDivElement>(null);
  const body = useRef<SVGGElement>(null);
  const timer = useRef(0);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(() => typeof document === "undefined" || document.visibilityState === "visible");
  const [paused, setPaused] = useState(false);
  const [encore, setEncore] = useState(false);
  const [greeting, setGreeting] = useState(false);
  const reduced = useReducedMotion();
  const gradient = `yy-body-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const svgPart = (source: string) => ({ __html: source.replaceAll("bodyGradient", gradient) });
  const running = inView && pageVisible && !paused && !reduced;

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    if (root.current) observer.observe(root.current);
    const visibility = () => setPageVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", visibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      clearTimeout(timer.current);
    };
  }, []);

  function interact() {
    clearTimeout(timer.current);
    setGreeting(true);
    if (!reduced) {
      setPaused(false);
      setEncore(true);
      reassemble(root.current);
    }
    timer.current = window.setTimeout(() => setGreeting(false), 1400);
  }

  return (
    <div
      className="yy-companion"
      ref={root}
      data-yy-appearance={yyAppearance.id}
      data-running={running}
      data-reduced={reduced}
      data-dance={encore ? "encore" : "loop"}
      data-feedback={greeting}
    >
      <button type="button" className="yy-dance-trigger" aria-label="和 YY 一起跳舞" onClick={interact}>
        <svg viewBox="-25 -40 350 335" role="img" aria-label="戴小黄帽、红围巾和星星脸贴的 YY" className="yy-dancer">
          <defs dangerouslySetInnerHTML={svgPart(parts.defs)} />
          <g
            className="yy-motion yy-dancer-body"
            ref={body}
            onAnimationEnd={(event) => {
              if (event.target === body.current) setEncore(false);
            }}
          >
            <g className="yy-motion yy-dancer-ear-left" dangerouslySetInnerHTML={svgPart(parts.earLeft)} />
            <g className="yy-motion yy-dancer-ear-right" dangerouslySetInnerHTML={svgPart(parts.earRight)} />
            <g dangerouslySetInnerHTML={svgPart(parts.body)} />
            <g dangerouslySetInnerHTML={svgPart(parts.face)} />
            <DailyYellowHat pose="dance" />
            <DailyStarSticker pose="dance" />
            <DailyRedScarf pose="dance" />
          </g>
          <g className="yy-motion yy-dancer-hand-left" dangerouslySetInnerHTML={svgPart(parts.handLeft)} />
          <g className="yy-motion yy-dancer-hand-right" dangerouslySetInnerHTML={svgPart(parts.handRight)} />
        </svg>
        <span className="yy-dance-hint" aria-live="polite">{greeting ? (reduced ? "收到啦！" : "再来一段！") : "点我，来一段"}</span>
      </button>
      <button
        type="button"
        className="yy-dance-pause"
        aria-label={reduced ? "YY 动效已减少" : paused ? "继续 YY 跳舞" : "暂停 YY 跳舞"}
        aria-pressed={paused || reduced}
        disabled={reduced}
        onClick={() => setPaused(!paused)}
      >
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          {paused || reduced ? <path d="M5 3 13 8 5 13Z" fill="currentColor" /> : <path d="M4 3H7V13H4ZM10 3H13V13H10Z" fill="currentColor" />}
        </svg>
      </button>
    </div>
  );
}
